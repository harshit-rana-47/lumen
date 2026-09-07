const inflight = new Map<string, Promise<unknown>>();

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
