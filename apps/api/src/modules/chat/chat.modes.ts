import type { ChatMode } from "./chat.schema";

/** Preferred V1 modes. Legacy personality modes remain for backward compatibility. */
export const chatModes: ChatMode[] = ["general", "reflection"];

export const legacyChatModes: ChatMode[] = [
  "friend",
  "therapist",
  "coach",
  "mentor",
  "devils_advocate",
  "hypothetical",
  "future_self"
];
