create table public.emotion_montages (
  id bigserial not null,
  user_id uuid null default auth.uid (),
  device_id text null,
  flow_id bigint not null,
  main_note_id bigint not null,
  sub_note_ids bigint[] not null default '{}'::bigint[],
  atoms_jsonb jsonb not null default '[]'::jsonb,
  montage_caption text not null default '',
  montage_jsonb jsonb not null default '{}'::jsonb,
  freeze_frames_jsonb jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint emotion_montages_pkey primary key (id),
  constraint emotion_montages_flow_id_fkey foreign KEY (flow_id) references emotion_flows (id) on delete CASCADE,
  constraint emotion_montages_owner_check check (
    (
      (user_id is not null)
      or (device_id is not null)
    )
  )
) TABLESPACE pg_default;

create index IF not exists emotion_montages_flow_id_idx on public.emotion_montages using btree (flow_id) TABLESPACE pg_default;

create index IF not exists emotion_montages_device_id_idx on public.emotion_montages using btree (device_id) TABLESPACE pg_default;

create trigger set_emotion_montages_updated_at BEFORE
update on emotion_montages for EACH row
execute FUNCTION set_updated_at ();
