import path from "node:path";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
const appDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(appDirectory, "../..");

/**
 * Single source of truth: monorepo root `.env`.
 * Next caches loadEnvConfig from apps/web first (empty); forceReload so root wins.
 * Explicit `env` ensures NEXT_PUBLIC_* are inlined into the Turbopack client bundle.
 */
const { combinedEnv } = loadEnvConfig(
  repoRoot,
  process.env.NODE_ENV !== "production",
  undefined,
  true
);

const publicEnv = {
  NEXT_PUBLIC_SUPABASE_URL: combinedEnv.NEXT_PUBLIC_SUPABASE_URL ?? "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: combinedEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  NEXT_PUBLIC_API_URL: combinedEnv.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1"
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@lumen/shared"],
  env: publicEnv,
  // Local preview often uses 127.0.0.1 while Next prints localhost — allow both in dev.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  turbopack: {
    root: repoRoot
  }
};

export default nextConfig;
