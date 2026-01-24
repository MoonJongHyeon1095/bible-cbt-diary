-- Move scripture reference fields into prayer_notes and drop scripture note tables
alter table public.prayer_notes
  add column if not exists book text,
  add column if not exists chapter integer,
  add column if not exists start_verse integer,
  add column if not exists end_verse integer,
  add column if not exists verse text;

drop table if exists public.scripture_note_reflections;
drop table if exists public.scripture_notes;
