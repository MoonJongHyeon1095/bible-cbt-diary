-- supabase/migrations/20260116160000_drop_session_history_positive_reframes.sql
alter table public.session_history
drop column if exists positive_reframes;
