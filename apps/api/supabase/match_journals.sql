CREATE OR REPLACE FUNCTION match_journals(query_embedding vector(384), user_uuid uuid, match_count int)
RETURNS TABLE(id uuid, similarity float)
LANGUAGE sql AS
$$ SELECT id, 1-(embedding<=>query_embedding) AS similarity
   FROM journal_entries
   WHERE user_id=user_uuid AND deleted_at IS NULL AND embedding IS NOT NULL
   ORDER BY embedding<=>query_embedding LIMIT match_count; $$;
