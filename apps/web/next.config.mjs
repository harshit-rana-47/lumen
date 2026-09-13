import path from "node:path";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
const appDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(appDirectory, "../..");

/**
 * Local source of truth is the monorepo root `.env`.
 * Next caches loadEnvConfig from apps/web first (empty); forceReload so root wins.
 * Copy non-empty values into process.env so Next's built-in NEXT_PUBLIC_* inlining
 * works. Never set nextConfig.env to "" — that overrides Vercel build env.
 */
const { combinedEnv } = loadEnvConfig(
  repoRoot,
  process.env.NODE_ENV !== "production",
  undefined,
  true
);

const PUBLIC_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_API_URL"
];

for (const key of PUBLIC_KEYS) {
  const current = process.env[key]?.trim();
  if (current) {
    continue;
  }
  const fromFile = combinedEnv[key]?.trim();
  if (fromFile) {
    process.env[key] = fromFile;
  }
}

if (!process.env.NEXT_PUBLIC_API_URL?.trim() && !process.env.VERCEL) {
  process.env.NEXT_PUBLIC_API_URL = "http://localhost:4000/api/v1";
}

if (process.env.VERCEL) {
  const missing = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"].filter(
    (key) => !process.env[key]?.trim()
  );
  if (missing.length > 0) {
    throw new Error(
      `Missing ${missing.join(" and ")} at build time. Add them in Vercel → Project Settings → Environment Variables for Production and Preview, then redeploy.`
    );
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@lumen/shared"],
  // Local preview often uses 127.0.0.1 while Next prints localhost — allow both in dev.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  turbopack: {
    root: repoRoot
  }
};

export default nextConfig;
