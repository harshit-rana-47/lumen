import { supabaseAdmin } from "../config/supabase";
import { isIanaTimeZone } from "./dateKey";
import { logger } from "../config/logger";

const lastPersisted = new Map<string, string>();

export function parseTimeZoneHeader(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const timeZone = raw?.trim();
  if (!timeZone || !isIanaTimeZone(timeZone)) {
    return null;
  }
  return timeZone;
}

/** Writes IANA timezone when the client sends a new valid value. Never blocks requests. */
export function persistUserTimeZone(userId: string, timeZone: string): void {
  if (lastPersisted.get(userId) === timeZone) {
    return;
  }

  lastPersisted.set(userId, timeZone);

  void supabaseAdmin
    .from("users")
    .update({ timezone: timeZone })
    .eq("id", userId)
    .is("deleted_at", null)
    .then(({ error }) => {
      if (!error) {
        return;
      }

      const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
      // Missing column / schema cache: do not retry on every authenticated request.
      if (code === "PGRST204" || code === "42703") {
        logger.warn({ userId }, "users.timezone is not available; skipping persist");
        return;
      }

      lastPersisted.delete(userId);
      logger.warn({ err: error, userId }, "failed to persist user timezone");
    });
}
