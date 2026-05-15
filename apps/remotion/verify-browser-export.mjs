import fs from "node:fs";
import puppeteer from "puppeteer";

const STUDIO_URL = process.env.STUDIO_URL ?? "http://localhost:3010/studio";
const OUTPUT = process.env.OUTPUT ?? "/tmp/jitter/browser-export.mp4";

async function main() {
  console.log("[verify] launching browser");
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--window-size=1400,900"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });

  page.on("console", (m) => {
    const t = m.text();
    if (t.startsWith("[export-hook]") || t.includes("Error") || t.includes("error")) {
      console.log("[page] " + t);
    }
  });

  console.log("[verify] loading studio");
  await page.goto(STUDIO_URL, { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1500));

  // Patch the page to intercept the blob and stash it on window.
  await page.evaluate(() => {
    window.__t0 = null; window.__t1 = null; window.__cfg = null; window.__blob = null;
    const o = VideoEncoder.prototype.configure;
    VideoEncoder.prototype.configure = function (c) {
      window.__cfg = { codec: c.codec, bitrate: c.bitrate, w: c.width, h: c.height };
      return o.call(this, c);
    };
    const oc = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (b) => {
      if (b instanceof Blob && b.type?.startsWith("video/")) {
        window.__blob = b;
        window.__t1 = performance.now();
      }
      return oc(b);
    };
  });

  await page.evaluate(() => {
    const bs = [...document.querySelectorAll("button")];
    (bs.find((b) => b.textContent?.trim() === "Add scene") || bs.find((b) => b.textContent?.trim() === "Library"))?.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  console.log("[verify] adding Soft Blur In");
  const added = await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((x) => x.textContent?.trim() === "Soft Blur In");
    if (b) { b.click(); return true; } return false;
  });
  if (!added) throw new Error("Soft Blur In not found");
  await new Promise((r) => setTimeout(r, 600));

  await page.evaluate(() => {
    const b = [...document.querySelectorAll("button")].find((x) => x.textContent?.trim() === "Export" && !x.disabled);
    b?.click();
  });
  await new Promise((r) => setTimeout(r, 600));

  console.log("[verify] selecting High + 120");
  await page.evaluate(() => {
    const labels = [...document.querySelectorAll("label")];
    labels.find((l) => l.textContent?.includes("High quality"))?.click();
    const bs = [...document.querySelectorAll("button")];
    bs.find((b) => b.textContent?.trim() === "120")?.click();
  });
  await new Promise((r) => setTimeout(r, 500));

  console.log("[verify] starting export");
  await page.evaluate(() => {
    window.__t0 = performance.now();
    [...document.querySelectorAll("button")].find((x) => x.textContent?.includes("Start render"))?.click();
  });

  console.log("[verify] waiting for blob...");
  await page.waitForFunction(() => window.__blob, { timeout: 5 * 60_000 });

  // Pull blob bytes out as base64 via evaluate.
  const result = await page.evaluate(async () => {
    const blob = window.__blob;
    const ab = await blob.arrayBuffer();
    const u8 = new Uint8Array(ab);
    // Chunked base64 encode (avoid call-stack overflow on big arrays).
    let bin = "";
    const CHUNK = 8192;
    for (let i = 0; i < u8.length; i += CHUNK) {
      bin += String.fromCharCode.apply(null, u8.subarray(i, i + CHUNK));
    }
    return {
      size: blob.size,
      type: blob.type,
      b64: btoa(bin),
    };
  });

  const t0 = await page.evaluate(() => window.__t0);
  const t1 = await page.evaluate(() => window.__t1);
  const cfg = await page.evaluate(() => window.__cfg);
  const elapsed = t0 && t1 ? ((t1 - t0) / 1000).toFixed(2) : "?";

  fs.mkdirSync("/tmp/jitter", { recursive: true });
  fs.writeFileSync(OUTPUT, Buffer.from(result.b64, "base64"));
  console.log(`[verify] wrote ${OUTPUT} ${fs.statSync(OUTPUT).size}B  ${elapsed}s  type=${result.type}  cfg=${JSON.stringify(cfg)}`);
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
