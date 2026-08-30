import type { User } from "@supabase/supabase-js";
import type { NextFunction, Request, Response } from "express";
import { supabaseAdmin } from "../config/supabase";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

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

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data.user) {
    response.status(401).json({
      success: false,
      error: "Invalid bearer token"
    });
    return;
  }

  request.user = data.user;
  next();
}
