import { staticFile } from "remotion";
import { proxyExternalImg } from "../proxy-image";

// Remotion's bundle server only serves public/ assets through `staticFile()`
// — literal "/foo.png" strings fail with 404 inside `remotion render`. This
// helper resolves bare paths, and routes absolute http(s) URLs through the
// `/api/img/<encoded>` proxy so the export canvas stays untainted when the
// scenario references third-party avatars.
export function asset(src: string | undefined): string | undefined {
  if (!src) return src;
  if (/^(data:|blob:)/i.test(src)) return src;
  if (/^https?:/i.test(src)) return proxyExternalImg(src);
  return staticFile(src.replace(/^\//, ""));
}
