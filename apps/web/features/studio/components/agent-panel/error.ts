/**
 * Walk the error.cause chain and return the deepest informative
 * message. AI-SDK and OpenAI both wrap errors in generic outer
 * messages ("Error in input stream") with the real cause nested.
 */
export function humanizeAgentError(err: unknown): string {
  const visited = new Set<unknown>();
  let cur: unknown = err;
  const layers: string[] = [];
  while (cur && !visited.has(cur)) {
    visited.add(cur);
    if (cur instanceof Error) {
      if (cur.message) layers.push(cur.message);
      cur = (cur as { cause?: unknown }).cause;
    } else if (typeof cur === "string") {
      layers.push(cur);
      cur = undefined;
    } else if (cur && typeof cur === "object") {
      const obj = cur as Record<string, unknown>;
      if (typeof obj.message === "string") layers.push(obj.message);
      else if (typeof obj.error === "string") layers.push(obj.error);
      cur = obj.cause;
    } else {
      cur = undefined;
    }
  }
  if (layers.length === 0) return "Something went wrong talking to the agent.";
  const deepest = layers[layers.length - 1]!;
  // Generic outer + specific inner → prefer the inner.
  if (/input stream|stream.*error/i.test(deepest) && layers.length > 1) {
    return layers[layers.length - 2]!;
  }
  return deepest;
}
