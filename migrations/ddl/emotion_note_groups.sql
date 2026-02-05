create table public.emotion_note_groups (
  id bigserial not null,
  user_id uuid null default auth.uid (),
  created_at timestamp with time zone not null default now(),
  device_id text null,
  constraint emotion_note_groups_pkey primary key (id),
  constraint emotion_note_groups_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint emotion_note_groups_owner_check check (
    (
      (user_id is not null)
      or (device_id is not null)
    )
  )
) TABLESPACE pg_default;

create index IF not exists emotion_note_groups_device_id_idx on public.emotion_note_groups using btree (device_id) TABLESPACE pg_default;