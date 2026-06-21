const STEPS = [
  {
    n: "01",
    title: "Describe it, or pick it",
    body: "Give the agent a sentence and let it build the timeline — or drag scenes from the library yourself.",
  },
  {
    n: "02",
    title: "Refine in the Studio",
    body: "Retime on the timeline, restyle colors and fonts, add transitions and effects, and drop in music.",
  },
  {
    n: "03",
    title: "Export and ship",
    body: "Render a Full-HD MP4 in your browser or the cloud, in any aspect ratio, and post it everywhere.",
  },
];

export function HowItWorks() {
  return (
    <section className="border-b border-dashed border-border px-6 py-20 sm:px-10 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <p className="text-[13px] font-medium uppercase tracking-wider text-primary">
            How it works
          </p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Three steps from blank canvas to finished cut.
          </h2>
        </div>

        <ol className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n} className="bg-background p-7">
              <span className="font-mono text-sm font-medium text-primary">
                {s.n}
              </span>
              <h3 className="mt-3 text-lg font-semibold text-foreground">
                {s.title}
              </h3>
              <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
                {s.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
