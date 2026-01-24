-- Remove stored verse text; verses are fetched on demand
alter table public.prayer_notes
  drop column if exists verse;
