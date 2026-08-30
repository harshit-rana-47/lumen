-- Row Level Security policies for Lumen.
-- NOTE: The current Express API still uses the service role key and bypasses RLS.
-- These policies prepare the target architecture (anon/authenticated client access).
-- Do not enable client-side writes until server actions migrate away from service role.

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper predicate: authenticated owner
-- Policies use auth.uid() = user_id (or users.id)

DROP POLICY IF EXISTS users_select_own ON public.users;
CREATE POLICY users_select_own ON public.users
  FOR SELECT TO authenticated
  USING (id = auth.uid() AND deleted_at IS NULL);

DROP POLICY IF EXISTS users_update_own ON public.users;
CREATE POLICY users_update_own ON public.users
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS journal_select_own ON public.journal_entries;
CREATE POLICY journal_select_own ON public.journal_entries
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND deleted_at IS NULL);

DROP POLICY IF EXISTS journal_insert_own ON public.journal_entries;
CREATE POLICY journal_insert_own ON public.journal_entries
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS journal_update_own ON public.journal_entries;
CREATE POLICY journal_update_own ON public.journal_entries
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS journal_delete_own ON public.journal_entries;
CREATE POLICY journal_delete_own ON public.journal_entries
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS memory_all_own ON public.memory_items;
CREATE POLICY memory_all_own ON public.memory_items
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS memory_settings_all_own ON public.memory_settings;
CREATE POLICY memory_settings_all_own ON public.memory_settings
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS chat_sessions_all_own ON public.chat_sessions;
CREATE POLICY chat_sessions_all_own ON public.chat_sessions
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS chat_messages_all_own ON public.chat_messages;
CREATE POLICY chat_messages_all_own ON public.chat_messages
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS insights_all_own ON public.insights;
CREATE POLICY insights_all_own ON public.insights
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS goals_all_own ON public.goals;
CREATE POLICY goals_all_own ON public.goals
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS daily_logs_all_own ON public.daily_logs;
CREATE POLICY daily_logs_all_own ON public.daily_logs
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS media_all_own ON public.media_attachments;
CREATE POLICY media_all_own ON public.media_attachments
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can read their own audit rows; inserts remain service-role only for now.
DROP POLICY IF EXISTS audit_select_own ON public.audit_logs;
CREATE POLICY audit_select_own ON public.audit_logs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- RPC security: SECURITY DEFINER with tenancy gate.
-- service_role (workers/API today) may query by explicit user_uuid.
-- authenticated clients may only query their own user_uuid.
-- (Further hardened in 20260830153000_memory_versioning_and_match_rpc_fix.sql)
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
