create table public.session_history (
  id bigserial not null,
  user_id uuid null default auth.uid (),
  timestamp timestamp with time zone not null,
  user_input text not null,
  emotion_thought_pairs jsonb not null default '[]'::jsonb,
  selected_cognitive_errors text[] not null default '{}'::text[],
  selected_alternative_thought text null default ''::text,
  bible_verse jsonb null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  soft_deleted_at timestamp with time zone null,
  selected_behavior jsonb null,
  device_id text null,
  constraint session_history_pkey primary key (id),
  constraint session_history_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint session_history_owner_check check (
    (
      (user_id is not null)
      or (device_id is not null)
    )
  )
) TABLESPACE pg_default;

create index IF not exists session_history_soft_deleted_at_idx on public.session_history using btree (soft_deleted_at) TABLESPACE pg_default;

create index IF not exists session_history_device_id_idx on public.session_history using btree (device_id) TABLESPACE pg_default;

create trigger set_session_history_updated_at BEFORE
update on session_history for EACH row
execute FUNCTION set_updated_at ();