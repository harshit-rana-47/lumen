-- One active Reflect conversation per journal entry (title = reflect:<entryId>).
-- Archive older duplicates first so the unique index can be added without dropping messages.

WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY user_id, title
      ORDER BY updated_at DESC, created_at DESC
    ) AS rn
  FROM public.chat_sessions
  WHERE mode = 'reflection'
    AND COALESCE(is_archived, false) = false
    AND title IS NOT NULL
)
UPDATE public.chat_sessions AS sessions
SET
  is_archived = true,
  updated_at = now()
FROM ranked
WHERE sessions.id = ranked.id
  AND ranked.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS chat_sessions_one_active_reflect_per_entry
  ON public.chat_sessions (user_id, title)
  WHERE mode = 'reflection'
    AND COALESCE(is_archived, false) = false
    AND title IS NOT NULL;
