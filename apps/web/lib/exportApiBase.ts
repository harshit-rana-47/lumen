/**
 * Server-side URL for the Express export API.
 * Node 20 prefers IPv6 for `localhost`, which fails locally while hosted HTTPS is fine.
 */
export function resolveExportApiBaseUrl(raw: string | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed);
    if (url.hostname === "localhost") {
      url.hostname = "127.0.0.1";
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    return trimmed.replace(/\/$/, "");
  }
}
