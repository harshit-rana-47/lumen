import type { Request } from "express";
import rateLimit, { type RateLimitRequestHandler } from "express-rate-limit";

/**
 * In-process rate limiting. Sufficient for a single API instance;
 * revisit if the API is horizontally scaled.
 *
 * Export is keyed per authenticated user (auth runs first on that route).
 * An IP key behind a proxy or on localhost is shared by everyone, so a
 * 1/day export cap made "Take a copy" return 429 after a single try.
 */
export const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
export const ONE_HOUR_MS = 60 * 60 * 1000;
export const EXPORT_LIMIT = 10;
export const EXPORT_WINDOW_MS = FIFTEEN_MINUTES_MS;

const tooManyRequests = {
  success: false as const,
  error: "Too many requests. Please try again later."
};

function clientIp(request: Request): string {
  return request.ip ?? "unknown";
}

function authenticatedUserId(request: Request): string | null {
  const id = request.user?.id;
  return typeof id === "string" && id.length > 0 ? id : null;
}

export function limiterKey(prefix: string, request: Request, perUser: boolean): string {
  if (perUser) {
    const userId = authenticatedUserId(request);
    if (userId) {
      return `${prefix}:user:${userId}`;
    }
  }
  return `${prefix}:ip:${clientIp(request)}`;
}

function createLimiter(
  prefix: string,
  limit: number,
  windowMs: number,
  perUser = false
): RateLimitRequestHandler {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: tooManyRequests,
    // Custom keys are not IPs; skip IP/proxy validations that throw on first request.
    validate: false,
    keyGenerator: (request) => limiterKey(prefix, request, perUser)
  });
}

export const authLimiter = createLimiter("auth", 10, FIFTEEN_MINUTES_MS);
export const registerLimiter = createLimiter("register", 5, FIFTEEN_MINUTES_MS);
export const apiLimiter = createLimiter("api", 100, FIFTEEN_MINUTES_MS);
export const chatLimiter = createLimiter("chat", 30, ONE_HOUR_MS);
export const exportLimiter = createLimiter("export", EXPORT_LIMIT, EXPORT_WINDOW_MS, true);
