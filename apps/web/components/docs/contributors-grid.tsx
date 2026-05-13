"use client";

import * as React from "react";

type Contributor = {
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
};

const REPO_OWNER = "theexperiencecompany";
const REPO_NAME = "motion-studio";

export function ContributorsGrid() {
  const [contributors, setContributors] = React.useState<Contributor[] | null>(
    null,
  );
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contributors?per_page=50`,
    )
      .then(async (r) => {
        const data = (await r.json()) as Contributor[] | { message?: string };
        if (cancelled) return;
        if (!Array.isArray(data)) {
          setError(data.message ?? "Failed to fetch contributors");
          return;
        }
        setContributors(data);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="not-prose my-8 flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">{error}</p>
        <a
          href={`https://github.com/${REPO_OWNER}/${REPO_NAME}/graphs/contributors`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium hover:bg-muted"
        >
          View on GitHub →
        </a>
      </div>
    );
  }

  return (
    <div className="not-prose my-8">
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {(contributors ?? Array.from({ length: 10 })).map((c, i) =>
          c ? (
            <a
              key={c.login}
              href={c.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex aspect-square min-w-0 cursor-pointer flex-col items-center gap-3 rounded-xl p-4 transition-colors hover:bg-accent"
            >
              {/* biome-ignore lint/performance/noImgElement: external GitHub avatars served from many origins */}
              <img
                src={c.avatar_url}
                alt={c.login}
                width={64}
                height={64}
                className="h-16 w-16 rounded-full"
              />
              <div className="w-full min-w-0 text-center">
                <div className="w-full truncate text-sm font-medium text-foreground/90 transition-colors group-hover:text-foreground">
                  {c.login}
                </div>
                <div className="text-xs text-muted-foreground">
                  {c.contributions} commits
                </div>
              </div>
            </a>
          ) : (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder, no stable id
              key={`skeleton-${i}`}
              className="flex aspect-square animate-pulse flex-col items-center gap-3 rounded-xl p-4"
            >
              <div className="h-16 w-16 rounded-full bg-muted/60" />
              <div className="h-3 w-24 rounded bg-muted/40" />
            </div>
          ),
        )}
      </div>
      <div className="mt-10 rounded-xl bg-muted/30 p-5">
        <h3 className="mb-1 text-base font-semibold">Want to contribute?</h3>
        <p className="text-sm text-muted-foreground">
          Check out the{" "}
          <a
            href={`https://github.com/${REPO_OWNER}/${REPO_NAME}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline underline-offset-2 hover:no-underline"
          >
            repo
          </a>{" "}
          and open a PR. We welcome contributions of all kinds.
        </p>
      </div>
    </div>
  );
}
