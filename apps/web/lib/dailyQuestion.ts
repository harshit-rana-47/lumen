/**
 * Local daily questions for Today’s Thread.
 *
 * Chosen only from this list, keyed to the viewer’s local YYYY-MM-DD.
 * Same day → same question. No network, no Groq, no quotes library.
 */

export const DAILY_QUESTIONS = [
  "What happened today that you would want to recognize a year from now?",
  "What did you almost say out loud, and didn’t?",
  "Where did your attention actually go, not where you meant it to go?",
  "What is unfinished, and what would “enough for today” look like?",
  "What did you notice about yourself that you usually skip past?",
  "Who or what asked something of you today, and how did you answer?",
  "What would you like to remember about how this day felt, not only what filled it?",
  "What are you carrying that does not belong to this evening?",
  "If you told the truth in one sentence, what would it be?",
  "What did you avoid looking at, and what would it cost to look once?",
  "What small thing went right that you have already discounted?",
  "What conversation is still sitting with you?",
  "What did you need today that you did not ask for?",
  "Where were you kind, and where were you only efficient?",
  "What changed your mind, even slightly?",
  "What do you know now that this morning you did not?",
  "What would you keep from today if the rest could fade?",
  "What are you pretending is fine?",
  "What did you give your time to, and was that the trade you meant to make?",
  "What would future-you thank you for writing down tonight?",
  "What pattern showed up again, and did you meet it differently?",
  "What are you grateful for that has nothing to prove?",
  "What felt heavy, and what actually belonged to you?",
  "What did you start and not finish — and does it still matter?",
  "Who did you become for a few hours today?",
  "What do you wish someone had asked you?",
  "What would you like to put down before tomorrow begins?",
  "What surprised you, even if it was small?",
  "What are you waiting for permission to admit?",
  "If today had a title, what would you refuse to call it?",
  "What did you protect, and was it worth protecting?",
  "What would you tell yesterday’s you, without correcting them?",
  "What remained unsaid that still wants a page?",
  "Where did you feel most like yourself?",
  "What should not be forgotten just because it was ordinary?"
] as const;

/** Stable index from a date-only key. Does not parse as UTC. */
export function questionIndexForDate(key: string): number {
  let hash = 0;

  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 33 + key.charCodeAt(index)) >>> 0;
  }

  return hash % DAILY_QUESTIONS.length;
}

export function dailyQuestionForDate(key: string): string {
  return DAILY_QUESTIONS[questionIndexForDate(key)] ?? DAILY_QUESTIONS[0];
}
