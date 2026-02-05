create table public.share_snap_shots (
  id bigserial not null,
  public_id uuid not null default gen_random_uuid (),
  note_id bigint not null,
  user_id uuid not null default auth.uid (),
  title text not null,
  trigger_text text not null,
  sections jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  expires_at timestamp with time zone null,
  constraint share_snap_shots_pkey primary key (id),
  constraint share_snap_shots_public_id_key unique (public_id),
  constraint share_snap_shots_note_id_fkey foreign KEY (note_id) references emotion_notes (id) on delete CASCADE,
  constraint share_snap_shots_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists share_snap_shots_note_id_idx on public.share_snap_shots using btree (note_id) TABLESPACE pg_default;

create index IF not exists share_snap_shots_user_id_idx on public.share_snap_shots using btree (user_id) TABLESPACE pg_default;

create index IF not exists share_snap_shots_expires_at_idx on public.share_snap_shots using btree (expires_at) TABLESPACE pg_default;