-- Optional IANA timezone for local-day jobs (nightly insights).
-- Null means the worker keeps UTC, which matches previous behavior.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS timezone text;
