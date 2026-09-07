import Groq from "groq-sdk";
import { env } from "./env";

/**
 * Groq shut down llama-3.1-8b-instant and llama-3.3-70b-versatile on 2026-08-16
 * (model_not_found). This key's /v1/models list includes the documented replacements.
 */
const RETIRED_GROQ_MODELS = new Set(["llama-3.1-8b-instant", "llama-3.3-70b-versatile"]);
const DEFAULT_CHAT_MODEL = "openai/gpt-oss-120b";
const DEFAULT_WORKER_MODEL = "openai/gpt-oss-20b";

export const CHAT_MODEL = RETIRED_GROQ_MODELS.has(env.GROQ_CHAT_MODEL)
  ? DEFAULT_CHAT_MODEL
  : env.GROQ_CHAT_MODEL;

export const WORKER_MODEL = RETIRED_GROQ_MODELS.has(env.GROQ_WORKER_MODEL)
  ? DEFAULT_WORKER_MODEL
  : env.GROQ_WORKER_MODEL;

export const groqClient = new Groq({
  apiKey: env.GROQ_API_KEY
});
