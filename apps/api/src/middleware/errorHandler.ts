import type { ErrorRequestHandler } from "express";
import { logger } from "../config/logger";

function resolveStatus(error: unknown): number {
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status?: unknown }).status;
    if (typeof status === "number" && status >= 400 && status < 600) {
      if (
        status === 404 &&
        error instanceof Error &&
        /model_not_found|model .* not found/i.test(error.message)
      ) {
        return 502;
      }
      return status;
    }
  }

  if (error && typeof error === "object" && "code" in error) {
    const code = String((error as { code?: unknown }).code ?? "");
    // Postgres / PostgREST common client errors
    if (code === "23505") return 409;
    if (code === "PGRST116") return 404;
    if (code.startsWith("PGRST") || code.length === 5) {
      // fall through to message-based mapping
    }
  }

  if (error instanceof Error) {
    if (/invalid login credentials/i.test(error.message)) {
      return 401;
    }
    if (error.message === "fetch failed") {
      return 503;
    }
  }

  return 500;
}

function resolveMessage(error: unknown): string {
  if (typeof error === "string" && error.trim()) {
    return error;
  }

  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    if (typeof record.message === "string" && record.message.trim()) {
      if (record.message === "fetch failed") {
        return "Unable to reach Supabase Auth. Check SUPABASE_URL, DNS, and that the project is not paused.";
      }
      return record.message;
    }
    if (typeof record.error_description === "string" && record.error_description.trim()) {
      return record.error_description;
    }
    if (typeof record.error === "string" && record.error.trim()) {
      return record.error;
    }
  }

  return "Internal server error";
}

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  const status = resolveStatus(error);
  const message = resolveMessage(error);

  if (status >= 500) {
    logger.error({ err: error, status, message }, "Unhandled API error");
  } else {
    logger.warn({ err: error, status, message }, "Request failed");
  }

  response.status(status).json({
    success: false,
    error: message
  });
};
