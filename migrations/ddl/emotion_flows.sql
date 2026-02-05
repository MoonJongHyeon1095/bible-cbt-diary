create table public.emotion_flows (
  id bigserial not null,
  user_id uuid null default auth.uid (),
  title text not null,
  description text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  device_id text null,
  constraint emotion_flows_pkey primary key (id),
  constraint emotion_flows_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint emotion_flows_owner_check check (
    (
      (user_id is not null)
      or (device_id is not null)
    )
  )
) TABLESPACE pg_default;

create index IF not exists emotion_flows_device_id_idx on public.emotion_flows using btree (device_id) TABLESPACE pg_default;

create trigger set_emotion_flows_updated_at BEFORE
update on emotion_flows for EACH row
execute FUNCTION set_updated_at ();
