import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import { ComponentCode } from "@/components/docs/component-code";
import { ComponentsGrid } from "@/components/docs/components-grid";
import { CompositionStats } from "@/components/docs/composition-stats";
import { EditorLink } from "@/components/docs/editor-link";
import { Preview } from "@/components/docs/preview";
import { PropsTable } from "@/components/docs/props-table";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children, ...props }) => (
      <h1 className="text-4xl font-bold tracking-tight scroll-mt-24" {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }) => (
      <h2
        className="text-2xl font-semibold tracking-tight scroll-mt-24 mt-12 mb-4"
        {...props}
      >
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3
        className="text-[15px] font-semibold scroll-mt-24 mt-8 mb-2"
        {...props}
      >
        {children}
      </h3>
    ),
    p: ({ children, ...props }) => (
      <p
        className="text-[15px] leading-relaxed text-muted-foreground my-4"
        {...props}
      >
        {children}
      </p>
    ),
    a: ({ href, children, ...props }) => {
      const isExternal = href?.startsWith("http");
      const className =
        "text-foreground underline decoration-muted-foreground/40 underline-offset-4 transition-colors hover:decoration-foreground";
      if (isExternal) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className={className}
            {...props}
          >
            {children}
          </a>
        );
      }
      return (
        <Link href={href ?? "#"} className={className} {...props}>
          {children}
        </Link>
      );
    },
    ul: ({ children, ...props }) => (
      <ul
        className="my-4 ml-6 list-disc space-y-2 text-[15px] text-muted-foreground"
        {...props}
      >
        {children}
      </ul>
    ),
    ol: ({ children, ...props }) => (
      <ol
        className="my-4 ml-6 list-decimal space-y-2 text-[15px] text-muted-foreground"
        {...props}
      >
        {children}
      </ol>
    ),
    code: ({ children, ...props }) => (
      <code
        className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px] text-foreground"
        {...props}
      >
        {children}
      </code>
    ),
    pre: ({ children, ...props }) => (
      <pre
        className="my-6 overflow-x-auto rounded-lg border border-border bg-muted/30 p-4 text-[13px]"
        {...props}
      >
        {children}
      </pre>
    ),
    hr: (props) => <hr className="my-10 border-border" {...props} />,
    blockquote: ({ children, ...props }) => (
      <blockquote
        className="my-6 border-l-2 border-border pl-4 text-[15px] italic text-muted-foreground"
        {...props}
      >
        {children}
      </blockquote>
    ),
    Preview,
    PropsTable,
    CompositionStats,
    EditorLink,
    ComponentCode,
    ComponentsGrid,
    ...components,
  };
}
