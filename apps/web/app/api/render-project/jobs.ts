import path from "node:path"
import os from "node:os"
import fs from "node:fs/promises"
import { bundle } from "@remotion/bundler"
import { renderMedia, selectComposition } from "@remotion/renderer"

export type RenderJobStatus = "rendering" | "done" | "error"

export type RenderJob = {
  id: string
  status: RenderJobStatus
  progress: number
  outputPath?: string
  error?: string
  createdAt: number
}

const globalAny = globalThis as unknown as {
  __studioJobs?: Map<string, RenderJob>
  __studioBundle?: { promise: Promise<string>; signature: string }
}

// Persist across HMR reloads in dev.
const jobs: Map<string, RenderJob> = (globalAny.__studioJobs ??= new Map())

export function getJob(id: string): RenderJob | undefined {
  return jobs.get(id)
}

export function createJob(): RenderJob {
  const id = makeJobId()
  const job: RenderJob = {
    id,
    status: "rendering",
    progress: 0,
    createdAt: Date.now(),
  }
  jobs.set(id, job)
  return job
}

export function deleteJob(id: string): void {
  const job = jobs.get(id)
  if (job?.outputPath) {
    fs.rm(path.dirname(job.outputPath), { recursive: true, force: true }).catch(
      () => {},
    )
  }
  jobs.delete(id)
}

function makeJobId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2)
}

async function computeSourceSignature(): Promise<string> {
  const root = path.resolve(process.cwd(), "../remotion/src")
  let latest = 0
  async function walk(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.name.startsWith(".") || entry.name === "node_modules") continue
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        await walk(full)
      } else if (
        entry.isFile() &&
        /\.(ts|tsx|css|js|jsx|json)$/.test(entry.name)
      ) {
        const stat = await fs.stat(full)
        if (stat.mtimeMs > latest) latest = stat.mtimeMs
      }
    }
  }
  await walk(root)
  return String(latest)
}

async function getBundle(): Promise<string> {
  const signature = await computeSourceSignature()
  const cached = globalAny.__studioBundle
  if (cached && cached.signature === signature) {
    return cached.promise
  }
  const entryPoint = path.resolve(process.cwd(), "../remotion/src/index.ts")
  const promise = bundle({
    entryPoint,
    webpackOverride: (config) => config,
  })
  globalAny.__studioBundle = { promise, signature }
  return promise
}

export async function runRender(
  jobId: string,
  inputProps: Record<string, unknown>,
): Promise<void> {
  const job = jobs.get(jobId)
  if (!job) return

  let outDir: string | null = null
  try {
    const serveUrl = await getBundle()

    const composition = await selectComposition({
      serveUrl,
      id: "Project",
      inputProps,
    })

    outDir = await fs.mkdtemp(path.join(os.tmpdir(), `render-${jobId}-`))
    const outputLocation = path.join(outDir, "project.mp4")

    await renderMedia({
      composition,
      serveUrl,
      codec: "h264",
      outputLocation,
      inputProps,
      onProgress: ({ progress }) => {
        const current = jobs.get(jobId)
        if (current) current.progress = progress
      },
    })

    const finalJob = jobs.get(jobId)
    if (finalJob) {
      finalJob.outputPath = outputLocation
      finalJob.progress = 1
      finalJob.status = "done"
    }
  } catch (err) {
    // Reset bundle so a retry rebuilds.
    globalAny.__studioBundle = undefined
    const message = err instanceof Error ? err.stack || err.message : String(err)
    const errored = jobs.get(jobId)
    if (errored) {
      errored.status = "error"
      errored.error = message
    }
    if (outDir) {
      await fs.rm(outDir, { recursive: true, force: true }).catch(() => {})
    }
  }
}
