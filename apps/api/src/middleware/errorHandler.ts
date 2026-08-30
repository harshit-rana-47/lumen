import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  response.status(500).json({
    success: false,
    error: error instanceof Error ? error.message : "Internal server error"
  });
};
