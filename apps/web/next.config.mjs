import path from "node:path";
import { fileURLToPath } from "node:url";

const appDirectory = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@lumen/shared"],
  turbopack: {
    root: path.resolve(appDirectory, "../..")
  }
};

export default nextConfig;
