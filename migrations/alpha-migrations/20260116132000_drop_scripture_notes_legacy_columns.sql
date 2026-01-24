-- supabase/migrations/20260116132000_drop_scripture_notes_legacy_columns.sql
alter table public.scripture_notes
  drop column if exists reflection,
  drop column if exists favorite;
