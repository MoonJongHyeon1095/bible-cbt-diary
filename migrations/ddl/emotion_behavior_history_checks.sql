create table public.emotion_behavior_history_checks (
  id bigserial not null,
  history_id bigint not null,
  check_id bigint not null,
  is_done boolean not null default false,
  created_at timestamp with time zone not null default now(),
  constraint emotion_behavior_history_checks_pkey primary key (id),
  constraint emotion_behavior_history_checks_history_id_fkey foreign key (history_id) references public.emotion_behavior_history (id) on delete cascade,
  constraint emotion_behavior_history_checks_check_id_fkey foreign key (check_id) references public.emotion_behavior_checks (id) on delete cascade,
  constraint emotion_behavior_history_checks_unique unique (history_id, check_id)
) tablespace pg_default;

create index if not exists emotion_behavior_history_checks_history_id_idx on public.emotion_behavior_history_checks using btree (history_id) tablespace pg_default;
create index if not exists emotion_behavior_history_checks_check_id_idx on public.emotion_behavior_history_checks using btree (check_id) tablespace pg_default;
