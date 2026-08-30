import path from "node:path";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "../../.env"), override: false });

const requiredString = z
  .string({
    required_error: "Required environment variable is missing"
  })
  .trim()
  .min(1, "Required environment variable is missing");

const requiredUrl = requiredString.url("Must be a valid URL");

const masterEncryptionKey = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value;
    }

    return value.trim().split(/\s+/)[0];
  },
  z.string().regex(/^[a-f0-9]{64}$/i, "Must be a 64 character hex key")
);

function normalizeSupabaseUrl(url: string): string {
  return url.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  PORT: z.coerce.number().int().positive(),
  APP_URL: requiredUrl,
  API_URL: requiredUrl,

  SUPABASE_URL: requiredUrl.transform(normalizeSupabaseUrl),
  SUPABASE_ANON_KEY: requiredString,
  SUPABASE_SERVICE_ROLE_KEY: requiredString,
  NEXT_PUBLIC_SUPABASE_URL: requiredUrl.transform(normalizeSupabaseUrl),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: requiredString,

  REDIS_URL: requiredString,

  NEO4J_URI: requiredString,
  NEO4J_USERNAME: requiredString,
  NEO4J_PASSWORD: requiredString,

  GROQ_API_KEY: requiredString,
  MASTER_ENCRYPTION_KEY: masterEncryptionKey,

  GROQ_CHAT_MODEL: requiredString.default("llama-3.3-70b-versatile"),
  GROQ_WORKER_MODEL: requiredString.default("llama-3.1-8b-instant"),
  EMBEDDING_MODEL: requiredString.default("Xenova/all-MiniLM-L6-v2"),
  EMBEDDING_DIMENSIONS: z.coerce.number().int().positive().default(384)
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const errors = parsedEnv.error.issues.map((issue) => {
    const key = issue.path.join(".");
    return `${key}: ${issue.message}`;
  });

  throw new Error(`Invalid environment variables:\n${errors.join("\n")}`);
}

export const env = parsedEnv.data;

export type Env = typeof env;
