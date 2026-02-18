create table public.emotion_behavior_details (
  id bigserial not null,
  user_id uuid null default auth.uid (),
  behavior_label text not null default ''::text,
  behavior_description text not null default ''::text,
  is_pinned boolean not null default false,
  latest_tracked_on date null,
  created_at timestamp with time zone not null default now(),
  device_id text null,
  constraint emotion_behavior_details_pkey primary key (id),
  constraint emotion_behavior_details_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint emotion_behavior_details_owner_check check (
    (
      (user_id is not null)
      or (device_id is not null)
    )
  )
) TABLESPACE pg_default;

create index IF not exists emotion_behavior_details_latest_tracked_on_idx on public.emotion_behavior_details using btree (latest_tracked_on) TABLESPACE pg_default;
create index IF not exists emotion_behavior_details_is_pinned_idx on public.emotion_behavior_details using btree (is_pinned) TABLESPACE pg_default;

create index IF not exists emotion_behavior_details_user_id_idx on public.emotion_behavior_details using btree (user_id) TABLESPACE pg_default;

create index IF not exists emotion_behavior_details_device_id_idx on public.emotion_behavior_details using btree (device_id) TABLESPACE pg_default;
