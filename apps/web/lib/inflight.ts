const inflight = new Map<string, Promise<unknown>>();
const remembered = new Map<string, { value: unknown; expiresAt: number }>();

/** Share one in-flight promise so React Strict Mode double-mount does not double the HTTP. */
export function shareInflight<T>(key: string, run: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = run().finally(() => {
    inflight.delete(key);
  });
  inflight.set(key, promise);
  return promise;
}

export function getRemembered<T>(key: string): T | undefined {
  const hit = remembered.get(key);
  if (!hit || hit.expiresAt <= Date.now()) {
    return undefined;
  }
  return hit.value as T;
}

export function forgetRemembered(key: string): void {
  remembered.delete(key);
}

export function forgetRememberedPrefix(prefix: string): void {
  for (const key of remembered.keys()) {
    if (key.startsWith(prefix)) {
      remembered.delete(key);
    }
  }
}

/** Share in-flight work and reuse a successful result for `ttlMs`. */
export function rememberInflight<T>(key: string, ttlMs: number, run: () => Promise<T>): Promise<T> {
  const hit = getRemembered<T>(key);
  if (hit !== undefined) {
    return Promise.resolve(hit);
  }

  return shareInflight(key, async () => {
    const value = await run();
    remembered.set(key, { value, expiresAt: Date.now() + ttlMs });
    return value;
  });
}

export const READ_CACHE_TTL_MS = 120_000;
