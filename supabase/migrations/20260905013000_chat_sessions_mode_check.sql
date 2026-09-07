-- Live DB rejected product modes `general` and `reflection` (Postgres 23514,
-- constraint chat_sessions_mode_check). Baseline had `mode text DEFAULT 'general'`
-- with no check. Align the live check with chat.schema.ts (product + legacy).

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.chat_sessions'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%mode%'
  LOOP
    EXECUTE format('ALTER TABLE public.chat_sessions DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE public.chat_sessions
  ADD CONSTRAINT chat_sessions_mode_check
  CHECK (
    mode IN (
      'general',
      'reflection',
      'friend',
      'therapist',
      'coach',
      'mentor',
      'devils_advocate',
      'hypothetical',
      'future_self'
    )
  );
