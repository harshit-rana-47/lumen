import Groq from "groq-sdk";
import { env } from "./env";

export const CHAT_MODEL = "llama-3.3-70b-versatile";
export const WORKER_MODEL = "llama-3.1-8b-instant";

export const groqClient = new Groq({
  apiKey: env.GROQ_API_KEY
});
