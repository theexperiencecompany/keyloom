"use client";
/**
 * Renders a user-forked ("custom:") composition from its source code.
 *
 * Compilation is memoized per source string, and a runtime error in the
 * forked code is caught by an error boundary so one bad fork shows an inline
 * card instead of crashing the whole Player / render.
 */
import * as React from "react";
import { AbsoluteFill } from "remotion";
import { compileComponent } from "./runtime";

export type DynamicCompositionProps = {
  /** Editable TSX source of the forked component. */
  code: string;
  /** Expected named export (the base composition's name). */
  exportName?: string;
  /** Props passed through to the rendered component (clip.props + clipStyle). */
  componentProps?: Record<string, unknown>;
};

export const DynamicComposition: React.FC<DynamicCompositionProps> = ({
  code,
  exportName,
  componentProps,
}) => {
  const compiled = React.useMemo(
    () => compileComponent(code, exportName),
    [code, exportName],
  );

  const Component = compiled.Component;
  if (!Component) {
    return (
      <ErrorCard
        title="Component failed to compile"
        detail={compiled.error ?? "Unknown error"}
      />
    );
  }

  return (
    <CompileErrorBoundary
      // Remount the boundary when the code changes so a fixed fork recovers.
      key={code}
      fallback={(error) => (
        <ErrorCard
          title="Component crashed while rendering"
          detail={error.message}
        />
      )}
    >
      <Component {...componentProps} />
    </CompileErrorBoundary>
  );
};

class CompileErrorBoundary extends React.Component<
  { fallback: (error: Error) => React.ReactNode; children: React.ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) return this.props.fallback(this.state.error);
    return this.props.children;
  }
}

function ErrorCard({ title, detail }: { title: string; detail: string }) {
  return (
    <AbsoluteFill
      style={{
        background: "#1a1a1d",
        color: "#fafafa",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: "0 80px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: "-0.02em" }}>
        {title}
      </div>
      <div
        style={{
          fontSize: 22,
          opacity: 0.6,
          maxWidth: 1200,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {detail}
      </div>
    </AbsoluteFill>
  );
}
