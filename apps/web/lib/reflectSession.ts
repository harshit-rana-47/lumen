/**
 * Reflection sessions reuse `chat_sessions` with mode=`reflection`.
 * Title encodes the journal entry association without a schema migration.
 */
export const REFLECT_SESSION_TITLE_PREFIX = "reflect:";

export function reflectSessionTitle(entryId: string): string {
  return `${REFLECT_SESSION_TITLE_PREFIX}${entryId}`;
}

export function entryIdFromReflectTitle(title: string | null | undefined): string | null {
  if (!title?.startsWith(REFLECT_SESSION_TITLE_PREFIX)) {
    return null;
  }
  const id = title.slice(REFLECT_SESSION_TITLE_PREFIX.length).trim();
  return id || null;
}
