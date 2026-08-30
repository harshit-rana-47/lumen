import pino from "pino";
import { env } from "./env";

export const logger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
    redact: {
      paths: [
        "SUPABASE_SERVICE_ROLE_KEY",
        "SUPABASE_ANON_KEY",
        "DATABASE_URL",
        "GROQ_API_KEY",
        "MASTER_ENCRYPTION_KEY"
      ],
      remove: true
    }
});
