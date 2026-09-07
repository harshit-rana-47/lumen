import { createRequire } from "node:module";
import cors from "cors";
import express, { type RequestHandler } from "express";
import helmet from "helmet";
import { env } from "../config/env";

const nodeRequire = createRequire(__filename);
const morgan = nodeRequire("morgan") as (format: string) => RequestHandler;

export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", env.APP_URL, env.API_URL]
    }
  },
  frameguard: {
    action: "deny"
  },
  hsts: {
    maxAge: 31_536_000,
    includeSubDomains: true,
    preload: true
  }
});

export const corsMiddleware = cors({
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    const allowed = new Set([env.APP_URL]);
    if (env.NODE_ENV !== "production") {
      allowed.add("http://localhost:3000");
      allowed.add("http://127.0.0.1:3000");
      allowed.add("http://localhost:3001");
      allowed.add("http://127.0.0.1:3001");
    }

    if (allowed.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked origin ${origin}`));
  },
  credentials: true
});

export const jsonMiddleware = express.json({
  limit: "1mb"
});

export const morganMiddleware = morgan("combined");
