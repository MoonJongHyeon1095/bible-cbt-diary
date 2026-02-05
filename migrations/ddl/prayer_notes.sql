create table public.prayer_notes (
  id bigserial not null,
  user_id uuid not null,
  title text not null,
  content text not null,
  tags text[] not null default '{}'::text[],
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  book text null,
  chapter integer null,
  start_verse integer null,
  end_verse integer null,
  emotion_note_id bigint null,
  constraint prayer_notes_pkey primary key (id),
  constraint prayer_notes_emotion_note_id_fkey foreign KEY (emotion_note_id) references emotion_notes (id) on delete set null,
  constraint prayer_notes_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists prayer_notes_emotion_note_id_idx on public.prayer_notes using btree (emotion_note_id) TABLESPACE pg_default;

create trigger set_prayer_notes_updated_at BEFORE
update on prayer_notes for EACH row
execute FUNCTION set_updated_at ();