-- Add relation from prayer_notes to emotion_notes (N:1)
alter table public.prayer_notes
  add column if not exists emotion_note_id bigint references public.emotion_notes (id) on delete set null;

create index if not exists prayer_notes_emotion_note_id_idx
  on public.prayer_notes (emotion_note_id);
