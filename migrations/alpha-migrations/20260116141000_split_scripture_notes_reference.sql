-- supabase/migrations/20260116141000_split_scripture_notes_reference.sql
alter table public.scripture_notes
  add column if not exists book text,
  add column if not exists chapter integer,
  add column if not exists verse_range text;

update public.scripture_notes
set
  book = nullif(split_part(btrim(reference), ' ', 1), ''),
  chapter = nullif(split_part(split_part(btrim(reference), ' ', 2), ':', 1), '')::int,
  verse_range = nullif(split_part(split_part(btrim(reference), ' ', 2), ':', 2), '')
where reference is not null and reference <> '';

alter table public.scripture_notes
  drop column if exists reference;
