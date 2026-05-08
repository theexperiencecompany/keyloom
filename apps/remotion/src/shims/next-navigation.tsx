/**
 * Shim for `next/navigation`. Returns no-op router/params/pathname objects
 * so chat-ui components that read these don't crash inside Remotion.
 */

const noop = () => {};

export const useRouter = () => ({
  push: noop,
  replace: noop,
  back: noop,
  forward: noop,
  refresh: noop,
  prefetch: noop,
});

export const usePathname = () => "/";

export const useSearchParams = () => {
  const params = new URLSearchParams();
  return {
    get: (key: string) => params.get(key),
    getAll: (key: string) => params.getAll(key),
    has: (key: string) => params.has(key),
    keys: () => params.keys(),
    values: () => params.values(),
    entries: () => params.entries(),
    forEach: (cb: (value: string, key: string) => void) => params.forEach(cb),
    toString: () => params.toString(),
  };
};

export const useParams = <
  T extends Record<string, string | string[]> = Record<string, string>,
>(): T => ({}) as T;

export const useSelectedLayoutSegment = (): string | null => null;
export const useSelectedLayoutSegments = (): string[] => [];

export const redirect = (_url: string): never => {
  throw new Error("redirect called in chat-ui shim — no-op");
};

export const notFound = (): never => {
  throw new Error("notFound called in chat-ui shim — no-op");
};

export const permanentRedirect = (_url: string): never => {
  throw new Error("permanentRedirect called in chat-ui shim — no-op");
};
