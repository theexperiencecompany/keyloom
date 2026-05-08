/**
 * Shim for `next/dynamic`. Replaces dynamic import + SSR loader with synchronous
 * rendering. The chat-ui components only use it for client-only modules; in
 * Remotion's bundle there's no SSR boundary so we just return the component.
 */
import { lazy, Suspense, type ComponentType } from "react";

type Importer<P> = () => Promise<{ default: ComponentType<P> } | ComponentType<P>>;

type DynamicOptions<P> = {
  ssr?: boolean;
  loading?: ComponentType<{ error?: Error | null; isLoading: boolean; pastDelay: boolean }>;
  suspense?: boolean;
} & Record<string, unknown>;

export default function dynamic<P = Record<string, unknown>>(
  importer: Importer<P>,
  options?: DynamicOptions<P>,
): ComponentType<P> {
  const Lazy = lazy(async () => {
    const mod = await importer();
    return "default" in mod ? mod : { default: mod };
  });
  const Loading = options?.loading;
  return function DynamicShim(props: P) {
    return (
      <Suspense fallback={Loading ? <Loading isLoading pastDelay error={null} /> : null}>
        <Lazy {...(props as Record<string, unknown>)} />
      </Suspense>
    );
  } as ComponentType<P>;
}
