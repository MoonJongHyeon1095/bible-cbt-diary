create table public.emotion_notes (
  id bigserial not null,
  user_id uuid null default auth.uid (),
  title text not null,
  trigger_text text not null,
  frequency integer not null default 1,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  device_id text null,
  constraint emotion_notes_pkey primary key (id),
  constraint emotion_notes_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint emotion_notes_owner_check check (
    (
      (user_id is not null)
      or (device_id is not null)
    )
  )
) TABLESPACE pg_default;

create index IF not exists emotion_notes_device_id_idx on public.emotion_notes using btree (device_id) TABLESPACE pg_default;

create trigger set_emotion_notes_updated_at BEFORE
update on emotion_notes for EACH row
execute FUNCTION set_updated_at ();
