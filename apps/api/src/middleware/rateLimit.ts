import rateLimit from "express-rate-limit";

/**
 * In-process rate limiting. Sufficient for a single API instance;
 * revisit if the API is horizontally scaled.
 */
function createLimiter(prefix: string, limit: number, windowMs: number) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
      success: false,
      error: "Too many requests. Please try again later."
    },
    // Distinct keys per limiter via prefix in keyGenerator default path + skip
    keyGenerator: (request) => `${prefix}:${request.ip ?? "unknown"}`
  });
}

const fifteenMinutes = 15 * 60 * 1000;
const oneHour = 60 * 60 * 1000;
const oneDay = 24 * oneHour;

export const authLimiter = createLimiter("auth", 10, fifteenMinutes);
export const registerLimiter = createLimiter("register", 5, fifteenMinutes);
export const apiLimiter = createLimiter("api", 100, fifteenMinutes);
export const chatLimiter = createLimiter("chat", 30, oneHour);
export const exportLimiter = createLimiter("export", 1, oneDay);
