let cachedToken: { token: string; at: number } | null = null;

export function invalidateApiAuthCache(): void {
  cachedToken = null;
}

export function readCachedApiToken(ttlMs = 10_000): string | null {
  if (!cachedToken || Date.now() - cachedToken.at >= ttlMs) {
    return null;
  }
  return cachedToken.token;
}

export function writeCachedApiToken(token: string): void {
  cachedToken = { token, at: Date.now() };
}
