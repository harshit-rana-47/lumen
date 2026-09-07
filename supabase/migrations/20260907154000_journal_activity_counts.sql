-- One grouped read for the activity calendar / You journey line.
-- Replaces paging every journal row through PostgREST (1000 at a time).

CREATE OR REPLACE FUNCTION public.journal_activity_counts(
  p_user_id uuid,
  p_from date,
  p_to date
)
RETURNS TABLE(entry_date date, entry_count bigint)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT je.entry_date, count(*)::bigint AS entry_count
  FROM public.journal_entries AS je
  WHERE je.user_id = p_user_id
    AND je.deleted_at IS NULL
    AND je.entry_date >= p_from
    AND je.entry_date <= p_to
  GROUP BY je.entry_date
  ORDER BY je.entry_date;
$$;

REVOKE ALL ON FUNCTION public.journal_activity_counts(uuid, date, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.journal_activity_counts(uuid, date, date) FROM anon;
REVOKE ALL ON FUNCTION public.journal_activity_counts(uuid, date, date) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.journal_activity_counts(uuid, date, date) TO service_role;
