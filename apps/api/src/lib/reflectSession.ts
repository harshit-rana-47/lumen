export const REFLECT_SESSION_TITLE_PREFIX = "reflect:";

export function reflectSessionTitle(entryId: string): string {
  return `${REFLECT_SESSION_TITLE_PREFIX}${entryId}`;
}

export function entryIdFromReflectTitle(title: string | null | undefined): string | null {
  if (!title?.startsWith(REFLECT_SESSION_TITLE_PREFIX)) {
    return null;
  }
  const id = title.slice(REFLECT_SESSION_TITLE_PREFIX.length).trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    ? id
    : null;
}

/** Session title is the source of truth so a client cannot pin a different entry. */
export function resolveReflectionPinnedEntryId(
  sessionTitle: string | null | undefined,
  requestedPinnedEntryId?: string
): string | undefined {
  return entryIdFromReflectTitle(sessionTitle) ?? requestedPinnedEntryId;
}
