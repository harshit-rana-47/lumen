import type { User } from "@supabase/supabase-js";
import type { NextFunction, Request, Response } from "express";
import { createUserScopedClient, supabaseAdmin, type DbClient } from "../config/supabase";
import { parseTimeZoneHeader, persistUserTimeZone } from "../lib/userTimeZone";

declare global {
  namespace Express {
    interface Request {
      user?: User;
      accessToken?: string;
      /** RLS-scoped Supabase client for the authenticated user (when token present). */
      db?: DbClient;
    }
  }
}

const AUTH_CACHE_TTL_MS = 30_000;

type CachedAuthUser = {
  user: User;
  expiresAt: number;
};

const authUserCache = new Map<string, CachedAuthUser>();

function extractBearerToken(header: string | undefined): string | undefined {
  if (!header) {
    return undefined;
  }

  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return undefined;
  }

  return token;
}

export async function authMiddleware(
  request: Request,
  response: Response,
  next: NextFunction
): Promise<void> {
  const token = extractBearerToken(request.headers.authorization);

  if (!token) {
    response.status(401).json({
      success: false,
      error: "Missing bearer token"
    });
    return;
  }

  const cached = authUserCache.get(token);
  let user = cached && cached.expiresAt > Date.now() ? cached.user : undefined;

  if (!user) {
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      authUserCache.delete(token);
      response.status(401).json({
        success: false,
        error: "Invalid bearer token"
      });
      return;
    }

    user = data.user;
    authUserCache.set(token, { user, expiresAt: Date.now() + AUTH_CACHE_TTL_MS });
  }

  request.user = user;
  request.accessToken = token;
  request.db = createUserScopedClient(token);

  const timeZone = parseTimeZoneHeader(request.headers["x-lumen-timezone"]);
  if (timeZone) {
    persistUserTimeZone(user.id, timeZone);
  }

  next();
}
