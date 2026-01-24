-- supabase/migrations/20260116130000_add_session_history_soft_deleted_at.sql
alter table public.session_history
  add column if not exists soft_deleted_at timestamptz;

create index if not exists session_history_soft_deleted_at_idx
  on public.session_history (soft_deleted_at);
