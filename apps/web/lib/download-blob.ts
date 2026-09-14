/**
 * Trigger a browser download of an in-memory Blob under the given filename.
 * The object URL is revoked shortly after the click so the download can start
 * before the reference disappears.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
