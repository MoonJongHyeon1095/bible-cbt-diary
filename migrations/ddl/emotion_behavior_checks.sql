create table public.emotion_behavior_checks (
  id bigserial not null,
  behavior_detail_id bigint not null,
  user_id uuid null default auth.uid (),
  check_label text not null default ''::text,
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default now(),
  device_id text null,
  constraint emotion_behavior_checks_pkey primary key (id),
  constraint emotion_behavior_checks_behavior_detail_id_fkey foreign key (behavior_detail_id) references public.emotion_behavior_details (id) on delete cascade,
  constraint emotion_behavior_checks_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade,
  constraint emotion_behavior_checks_owner_check check (
    (
      (user_id is not null)
      or (device_id is not null)
    )
  )
) tablespace pg_default;

create index if not exists emotion_behavior_checks_behavior_detail_id_idx on public.emotion_behavior_checks using btree (behavior_detail_id) tablespace pg_default;
create index if not exists emotion_behavior_checks_user_id_idx on public.emotion_behavior_checks using btree (user_id) tablespace pg_default;
create index if not exists emotion_behavior_checks_device_id_idx on public.emotion_behavior_checks using btree (device_id) tablespace pg_default;
