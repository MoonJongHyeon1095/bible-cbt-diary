create table public.emotion_notes (
  id bigserial not null,
  user_id uuid null default auth.uid (),
  title text not null,
  trigger_text text not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  device_id text null,
  emotion_tags text[] not null default '{}'::text[],
  inner_belief text not null default ''::text,
  error_label text not null default ''::text,
  error_description text not null default ''::text,
  alternative text not null default ''::text,
  emotion_type text not null default 'negative'::text,
  sdt_type text null,
  sdt_empathy_text text not null default ''::text,
  reflection_question text not null default ''::text,
  is_history_represent boolean not null default true,
  constraint emotion_notes_pkey primary key (id),
  constraint emotion_notes_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint emotion_notes_owner_check check (
    (
      (user_id is not null)
      or (device_id is not null)
    )
  )
) TABLESPACE pg_default;

create index IF not exists emotion_notes_emotion_type_idx on public.emotion_notes using btree (emotion_type) TABLESPACE pg_default;

create index IF not exists emotion_notes_emotion_tags_gin_idx on public.emotion_notes using gin (emotion_tags) TABLESPACE pg_default;

create index IF not exists emotion_notes_device_id_idx on public.emotion_notes using btree (device_id) TABLESPACE pg_default;

create trigger set_emotion_notes_updated_at BEFORE
update on emotion_notes for EACH row
execute FUNCTION set_updated_at ();