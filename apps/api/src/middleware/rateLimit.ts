import rateLimit, { type IncrementResponse, type Store } from "express-rate-limit";
import { redis } from "../config/redis";

type UpstashRateLimitStoreOptions = {
  prefix: string;
};

class UpstashRateLimitStore implements Store {
  localKeys = false;
  prefix: string;

  private windowMs = 60_000;

  constructor(options: UpstashRateLimitStoreOptions) {
    this.prefix = `lumen:rate-limit:${options.prefix}`;
  }

  init(options: { windowMs: number }): void {
    this.windowMs = options.windowMs;
  }

  async increment(key: string): Promise<IncrementResponse> {
    const redisKey = this.redisKey(key);
    const totalHits = await redis.incr(redisKey);
    let ttl = await redis.pttl(redisKey);

    if (totalHits === 1 || ttl < 0) {
      await redis.pexpire(redisKey, this.windowMs);
      ttl = this.windowMs;
    }

    return {
      totalHits,
      resetTime: new Date(Date.now() + ttl)
    };
  }

  async decrement(key: string): Promise<void> {
    const redisKey = this.redisKey(key);
    const totalHits = await redis.decr(redisKey);

    if (totalHits <= 0) {
      await redis.del(redisKey);
    }
  }

  async resetKey(key: string): Promise<void> {
    await redis.del(this.redisKey(key));
  }

  private redisKey(key: string): string {
    return `${this.prefix}:${key}`;
  }
}

function createLimiter(prefix: string, limit: number, windowMs: number) {
  return rateLimit({
    windowMs,
    limit,
    store: new UpstashRateLimitStore({ prefix }),
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
      success: false,
      error: "Too many requests. Please try again later."
    }
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
