/**
 * Shim for `next/dynamic`. Replaces dynamic import + SSR loader with synchronous
 * rendering. The chat-ui components only use it for client-only modules; in
 * Remotion's bundle there's no SSR boundary so we just return the component.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { type ComponentType, lazy, Suspense } from "react";

type Importer<P> = () => Promise<
  { default: ComponentType<P> } | ComponentType<P>
>;

type DynamicOptions = {
  ssr?: boolean;
  loading?: ComponentType<{
    error?: Error | null;
    isLoading: boolean;
    pastDelay: boolean;
  }>;
  suspense?: boolean;
};

export default function dynamic<P extends object = Record<string, unknown>>(
  importer: Importer<P>,
  options?: DynamicOptions,
): ComponentType<P> {
  const Lazy = lazy(async () => {
    const mod = await importer();
    return "default" in mod ? mod : { default: mod };
  }) as ComponentType<P>;
  const Loading = options?.loading;
  const DynamicShim: ComponentType<P> = (props) => {
    const fallback = Loading ? (
      <Loading isLoading pastDelay error={null} />
    ) : null;
    return (
      <Suspense fallback={fallback}>
        <Lazy {...props} />
      </Suspense>
    );
  };
  return DynamicShim;
}
