-- Harden privileges: user-data tables are not for the anon role, and
-- SECURITY DEFINER match_* RPCs must not be executable by PUBLIC/anon.
-- Authenticated access remains owner-only via existing RLS policies.

REVOKE ALL ON FUNCTION public.match_journals(vector, uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.match_journals(vector, uuid, integer) FROM anon;
REVOKE ALL ON FUNCTION public.match_memories(vector, uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.match_memories(vector, uuid, integer) FROM anon;
GRANT EXECUTE ON FUNCTION public.match_journals(vector, uuid, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.match_memories(vector, uuid, integer) TO authenticated, service_role;

REVOKE ALL ON TABLE
  public.users,
  public.journal_entries,
  public.memory_items,
  public.memory_settings,
  public.chat_sessions,
  public.chat_messages,
  public.insights,
  public.goals,
  public.daily_logs,
  public.media_attachments,
  public.audit_logs
FROM anon;

REVOKE TRUNCATE, REFERENCES, TRIGGER ON TABLE
  public.users,
  public.journal_entries,
  public.memory_items,
  public.memory_settings,
  public.chat_sessions,
  public.chat_messages,
  public.insights,
  public.goals,
  public.daily_logs,
  public.media_attachments,
  public.audit_logs
FROM authenticated;
