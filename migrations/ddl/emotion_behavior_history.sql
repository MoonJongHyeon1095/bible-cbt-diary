create table public.emotion_behavior_history (
  id bigserial not null,
  tracked_on date not null default CURRENT_DATE,
  comments text not null default ''::text,
  created_at timestamp with time zone not null default now(),
  user_id uuid null default auth.uid (),
  device_id text null,
  constraint emotion_behavior_history_pkey primary key (id),
  constraint emotion_behavior_history_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade,
  constraint emotion_behavior_history_owner_check check (
    (
      (user_id is not null)
      or (device_id is not null)
    )
  )
) tablespace pg_default;

create index if not exists emotion_behavior_history_tracked_on_idx on public.emotion_behavior_history using btree (tracked_on) tablespace pg_default;
create index if not exists emotion_behavior_history_user_id_idx on public.emotion_behavior_history using btree (user_id) tablespace pg_default;
create index if not exists emotion_behavior_history_device_id_idx on public.emotion_behavior_history using btree (device_id) tablespace pg_default;
create unique index if not exists emotion_behavior_history_user_tracked_on_key on public.emotion_behavior_history using btree (user_id, tracked_on) tablespace pg_default where (user_id is not null);
create unique index if not exists emotion_behavior_history_device_tracked_on_key on public.emotion_behavior_history using btree (device_id, tracked_on) tablespace pg_default where ((user_id is null) and (device_id is not null));
