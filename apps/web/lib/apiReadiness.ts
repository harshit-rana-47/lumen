const DEFAULT_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export function healthReadyUrl(apiBaseUrl: string = DEFAULT_API_BASE_URL): string {
  const trimmed = apiBaseUrl.replace(/\/$/, "");
  if (trimmed.endsWith("/api/v1")) {
    return `${trimmed.slice(0, -"/api/v1".length)}/health/ready`;
  }
  return `${trimmed}/health/ready`;
}

export type ApiReadyStatus = "starting" | "ready" | "unreachable";

const POLL_MS = 400;
const GIVE_UP_MS = 90_000;

/**
 * Wait until the API can accept auth and data requests.
 * Embeddings/Groq warmup is intentionally not part of this gate.
 */
export async function waitForApiReady(signal?: AbortSignal): Promise<void> {
  const url = healthReadyUrl();
  const started = Date.now();
  let lastError: Error | null = null;

  while (!signal?.aborted) {
    try {
      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
        ...(signal ? { signal } : {})
      });
      if (response.ok) {
        return;
      }
      lastError = new Error("Lumen API is still starting.");
    } catch (caught) {
      if (signal?.aborted) {
        throw caught;
      }
      lastError = caught instanceof Error ? caught : new Error("Unable to reach the Lumen API.");
    }

    if (Date.now() - started >= GIVE_UP_MS) {
      throw lastError ?? new Error("Unable to reach the Lumen API.");
    }

    await new Promise<void>((resolve, reject) => {
      const timer = globalThis.setTimeout(resolve, POLL_MS);
      signal?.addEventListener(
        "abort",
        () => {
          globalThis.clearTimeout(timer);
          reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
        },
        { once: true }
      );
    });
  }

  throw signal.reason ?? new DOMException("Aborted", "AbortError");
}
