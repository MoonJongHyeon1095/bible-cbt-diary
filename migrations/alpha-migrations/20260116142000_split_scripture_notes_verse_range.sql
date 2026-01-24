-- supabase/migrations/20260116142000_split_scripture_notes_verse_range.sql
alter table public.scripture_notes
  add column if not exists start_verse integer,
  add column if not exists end_verse integer;

update public.scripture_notes
set
  start_verse = nullif(
    btrim((regexp_split_to_array(verse_range, '[-~]'))[1]),
    ''
  )::int,
  end_verse = coalesce(
    nullif(
      btrim((regexp_split_to_array(verse_range, '[-~]'))[2]),
      ''
    )::int,
    nullif(
      btrim((regexp_split_to_array(verse_range, '[-~]'))[1]),
      ''
    )::int
  )
where verse_range is not null and verse_range <> '';

alter table public.scripture_notes
  drop column if exists verse_range;
