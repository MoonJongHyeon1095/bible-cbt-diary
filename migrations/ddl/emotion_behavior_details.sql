create table public.emotion_behavior_details (
  id bigserial not null,
  note_id bigint not null,
  user_id uuid null default auth.uid (),
  behavior_label text not null default ''::text,
  behavior_description text not null default ''::text,
  created_at timestamp with time zone not null default now(),
  error_tags text[] null default '{}'::text[],
  device_id text null,
  constraint emotion_behavior_details_pkey primary key (id),
  constraint emotion_behavior_details_note_id_fkey foreign KEY (note_id) references emotion_notes (id) on delete CASCADE,
  constraint emotion_behavior_details_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint emotion_behavior_details_owner_check check (
    (
      (user_id is not null)
      or (device_id is not null)
    )
  )
) TABLESPACE pg_default;

create index IF not exists emotion_behavior_details_note_id_idx on public.emotion_behavior_details using btree (note_id) TABLESPACE pg_default;

create index IF not exists emotion_behavior_details_user_id_idx on public.emotion_behavior_details using btree (user_id) TABLESPACE pg_default;

create index IF not exists emotion_behavior_details_device_id_idx on public.emotion_behavior_details using btree (device_id) TABLESPACE pg_default;