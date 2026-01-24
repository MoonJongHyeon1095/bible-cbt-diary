-- supabase/migrations/20260116133000_add_session_history_selected_behavior.sql
alter table public.session_history
add column if not exists selected_behavior jsonb;
