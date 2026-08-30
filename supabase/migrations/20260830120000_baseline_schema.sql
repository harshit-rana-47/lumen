-- Lumen schema baseline (inferred from application code + audit)
-- Apply via Supabase SQL editor or `supabase db push` once linked.
-- This migration is additive/idempotent where practical for an existing project.

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Core tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  encrypted_dek jsonb,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  journal_type text NOT NULL DEFAULT 'free',
  title_encrypted text,
  body_encrypted text NOT NULL,
  iv text,
  auth_tag text,
  mood_score integer CHECK (mood_score IS NULL OR (mood_score BETWEEN 1 AND 10)),
  energy_score integer CHECK (energy_score IS NULL OR (energy_score BETWEEN 1 AND 10)),
  word_count integer,
  reading_time_sec integer,
  is_pinned boolean DEFAULT false,
  is_favorite boolean DEFAULT false,
  tags text[] DEFAULT '{}',
  entry_date date NOT NULL DEFAULT (CURRENT_DATE),
  embedding vector(384),
  embedding_status text DEFAULT 'pending',
  memory_status text DEFAULT 'pending',
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS journal_entries_user_entry_date_idx
  ON public.journal_entries (user_id, entry_date DESC);

-- Vector indexes (ivfflat/hnsw) should be created after enough rows exist.
-- Example (run manually once data is present):
-- CREATE INDEX journal_entries_embedding_idx ON public.journal_entries
--   USING hnsw (embedding vector_cosine_ops);

CREATE TABLE IF NOT EXISTS public.memory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  key text NOT NULL,
  value_encrypted text NOT NULL,
  iv text NOT NULL,
  auth_tag text NOT NULL,
  confidence numeric,
  importance integer DEFAULT 5,
  source_entry_id uuid REFERENCES public.journal_entries(id) ON DELETE SET NULL,
  embedding vector(384),
  user_edited boolean DEFAULT false,
  last_confirmed timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, category, key)
);

CREATE INDEX IF NOT EXISTS memory_items_user_category_idx
  ON public.memory_items (user_id, category);

-- Vector index example (create after data exists):
-- CREATE INDEX memory_items_embedding_idx ON public.memory_items
--   USING hnsw (embedding vector_cosine_ops);

CREATE TABLE IF NOT EXISTS public.memory_settings (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  enabled boolean DEFAULT true,
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, category)
);

CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  mode text NOT NULL DEFAULT 'general',
  title text,
  is_archived boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content_encrypted text NOT NULL,
  iv text NOT NULL,
  auth_tag text NOT NULL,
  tokens_used integer,
  model_used text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_messages_session_created_idx
  ON public.chat_messages (session_id, created_at);

CREATE TABLE IF NOT EXISTS public.insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  insight_type text NOT NULL,
  summary_encrypted text NOT NULL,
  iv text NOT NULL,
  auth_tag text NOT NULL,
  period_start date,
  period_end date,
  confidence numeric,
  is_dismissed boolean DEFAULT false,
  seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title_encrypted text NOT NULL,
  iv text NOT NULL,
  auth_tag text NOT NULL,
  category text,
  status text DEFAULT 'active',
  target_date date,
  progress_pct integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.daily_logs (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  log_date date NOT NULL,
  mood integer CHECK (mood IS NULL OR (mood BETWEEN 1 AND 10)),
  energy integer CHECK (energy IS NULL OR (energy BETWEEN 1 AND 10)),
  anxiety integer CHECK (anxiety IS NULL OR (anxiety BETWEEN 1 AND 10)),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, log_date)
);

CREATE TABLE IF NOT EXISTS public.media_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  entry_id uuid NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  s3_key text NOT NULL,
  media_type text NOT NULL,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Canonical audit table (replaces inconsistent audit_log / audit_logs usage)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  resource text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_user_created_idx
  ON public.audit_logs (user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Vector RPCs
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.match_journals(
  query_embedding vector(384),
  user_uuid uuid,
  match_count int
)
RETURNS TABLE(id uuid, similarity float)
LANGUAGE sql
STABLE
AS $$
  SELECT
    journal_entries.id,
    1 - (journal_entries.embedding <=> query_embedding) AS similarity
  FROM public.journal_entries
  WHERE journal_entries.user_id = user_uuid
    AND journal_entries.deleted_at IS NULL
    AND journal_entries.embedding IS NOT NULL
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
AS $$
  SELECT
    memory_items.id,
    1 - (memory_items.embedding <=> query_embedding) AS similarity
  FROM public.memory_items
  WHERE memory_items.user_id = user_uuid
    AND memory_items.embedding IS NOT NULL
  ORDER BY memory_items.embedding <=> query_embedding
  LIMIT match_count;
$$;
