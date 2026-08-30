-- Fix match_* RPCs for service-role workers + memory versioning/supersession.
--
-- Problem: Phase 1 RLS migration used SECURITY INVOKER with `auth.uid()` checks.
-- Express workers and context assembly call match_* via the service role, where
-- auth.uid() is NULL — retrieval would return zero rows after RLS apply.
--
-- Fix: SECURITY DEFINER with explicit tenancy:
--   service_role may query any user_uuid (trusted server)
--   authenticated may only query user_uuid = auth.uid()

ALTER TABLE public.memory_items
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS superseded_by uuid REFERENCES public.memory_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'memory_items_status_check'
  ) THEN
    ALTER TABLE public.memory_items
      ADD CONSTRAINT memory_items_status_check
      CHECK (status IN ('active', 'superseded'));
  END IF;
END $$;

-- Replace hard unique with partial unique on active rows only (allows history).
ALTER TABLE public.memory_items
  DROP CONSTRAINT IF EXISTS memory_items_user_id_category_key_key;

DROP INDEX IF EXISTS memory_items_active_unique;
CREATE UNIQUE INDEX memory_items_active_unique
  ON public.memory_items (user_id, category, key)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS memory_items_user_status_idx
  ON public.memory_items (user_id, status);

CREATE OR REPLACE FUNCTION public.match_journals(
  query_embedding vector(384),
  user_uuid uuid,
  match_count int
)
RETURNS TABLE(id uuid, similarity float)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    journal_entries.id,
    1 - (journal_entries.embedding <=> query_embedding) AS similarity
  FROM public.journal_entries
  WHERE journal_entries.user_id = user_uuid
    AND journal_entries.deleted_at IS NULL
    AND journal_entries.embedding IS NOT NULL
    AND (
      auth.role() = 'service_role'
      OR journal_entries.user_id = auth.uid()
    )
  ORDER BY journal_entries.embedding <=> query_embedding
  LIMIT match_count;
$$;

CREATE OR REPLACE FUNCTION public.match_memories(
  query_embedding vector(384),
  user_uuid uuid,
  match_count int
)
RETURNS TABLE(id uuid, similarity float)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    memory_items.id,
    1 - (memory_items.embedding <=> query_embedding) AS similarity
  FROM public.memory_items
  WHERE memory_items.user_id = user_uuid
    AND memory_items.status = 'active'
    AND memory_items.embedding IS NOT NULL
    AND (
      auth.role() = 'service_role'
      OR memory_items.user_id = auth.uid()
    )
  ORDER BY memory_items.embedding <=> query_embedding
  LIMIT match_count;
$$;

REVOKE ALL ON FUNCTION public.match_journals(vector, uuid, int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.match_memories(vector, uuid, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.match_journals(vector, uuid, int) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.match_memories(vector, uuid, int) TO authenticated, service_role;
