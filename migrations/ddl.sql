create table public.emotion_notes (
  id bigserial not null,
  user_id uuid not null default auth.uid (),
  title text not null,
  trigger_text text not null,
  behavior text null default ''::text,
  frequency integer not null default 1,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint emotion_notes_pkey primary key (id),
  constraint emotion_notes_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create trigger set_emotion_notes_updated_at BEFORE
update on emotion_notes for EACH row
execute FUNCTION set_updated_at ();

create table public.emotion_note_details (
  id bigserial not null,
  note_id bigint not null,
  user_id uuid not null default auth.uid (),
  automatic_thought text not null default ''::text,
  emotion text not null default ''::text,
  created_at timestamp with time zone not null default now(),
  constraint emotion_note_details_pkey primary key (id),
  constraint emotion_note_details_note_id_fkey foreign KEY (note_id) references emotion_notes (id) on delete CASCADE,
  constraint emotion_note_details_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists emotion_note_details_note_id_idx on public.emotion_note_details using btree (note_id) TABLESPACE pg_default;

create index IF not exists emotion_note_details_user_id_idx on public.emotion_note_details using btree (user_id) TABLESPACE pg_default;

create table public.emotion_error_details (
  id bigserial not null,
  note_id bigint not null,
  user_id uuid not null default auth.uid (),
  error_label text not null default ''::text,
  error_description text not null default ''::text,
  created_at timestamp with time zone not null default now(),
  constraint emotion_error_details_pkey primary key (id),
  constraint emotion_error_details_note_id_fkey foreign KEY (note_id) references emotion_notes (id) on delete CASCADE,
  constraint emotion_error_details_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists emotion_error_details_note_id_idx on public.emotion_error_details using btree (note_id) TABLESPACE pg_default;

create index IF not exists emotion_error_details_user_id_idx on public.emotion_error_details using btree (user_id) TABLESPACE pg_default;

create table public.emotion_behavior_details (
  id bigserial not null,
  note_id bigint not null,
  user_id uuid not null default auth.uid (),
  behavior_label text not null default ''::text,
  behavior_description text not null default ''::text,
  created_at timestamp with time zone not null default now(),
  error_tags text[] null default '{}'::text[],
  constraint emotion_behavior_details_pkey primary key (id),
  constraint emotion_behavior_details_note_id_fkey foreign KEY (note_id) references emotion_notes (id) on delete CASCADE,
  constraint emotion_behavior_details_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists emotion_behavior_details_note_id_idx on public.emotion_behavior_details using btree (note_id) TABLESPACE pg_default;

create index IF not exists emotion_behavior_details_user_id_idx on public.emotion_behavior_details using btree (user_id) TABLESPACE pg_default;

create table public.emotion_alternative_details (
  id bigserial not null,
  note_id bigint not null,
  user_id uuid not null default auth.uid (),
  alternative text not null default ''::text,
  created_at timestamp with time zone not null default now(),
  constraint emotion_alternative_details_pkey primary key (id),
  constraint emotion_alternative_details_note_id_fkey foreign KEY (note_id) references emotion_notes (id) on delete CASCADE,
  constraint emotion_alternative_details_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists emotion_alternative_details_note_id_idx on public.emotion_alternative_details using btree (note_id) TABLESPACE pg_default;

create index IF not exists emotion_alternative_details_user_id_idx on public.emotion_alternative_details using btree (user_id) TABLESPACE pg_default;

create table public.share_snap_shots (
  id bigserial not null,
  public_id uuid not null default gen_random_uuid(),
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

alter table public.share_snap_shots enable row level security;

drop policy if exists share_snap_shots_select_public on public.share_snap_shots;
create policy share_snap_shots_select_public
on public.share_snap_shots
for select
using (
  public_id is not null
  and (expires_at is null or expires_at > now())
);

drop policy if exists share_snap_shots_insert_own on public.share_snap_shots;
create policy share_snap_shots_insert_own
on public.share_snap_shots
for insert
with check (auth.uid() = user_id);

drop policy if exists share_snap_shots_update_own on public.share_snap_shots;
create policy share_snap_shots_update_own
on public.share_snap_shots
for update
using (auth.uid() = user_id);

drop policy if exists share_snap_shots_delete_own on public.share_snap_shots;
create policy share_snap_shots_delete_own
on public.share_snap_shots
for delete
using (auth.uid() = user_id);

create table public.prayer_notes (
  id bigserial not null,
  user_id uuid not null,
  title text not null,
  content text not null,
  tags text[] not null default '{}'::text[],
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  book text null,
  chapter integer null,
  start_verse integer null,
  end_verse integer null,
  emotion_note_id bigint null,
  constraint prayer_notes_pkey primary key (id),
  constraint prayer_notes_emotion_note_id_fkey foreign KEY (emotion_note_id) references emotion_notes (id) on delete set null,
  constraint prayer_notes_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists prayer_notes_emotion_note_id_idx on public.prayer_notes using btree (emotion_note_id) TABLESPACE pg_default;

create trigger set_prayer_notes_updated_at BEFORE
update on prayer_notes for EACH row
execute FUNCTION set_updated_at ();

create table public.prayer_note_responses (
  id bigserial not null,
  user_id uuid not null default auth.uid (),
  prayer_note_id bigint not null,
  content text not null,
  created_at timestamp with time zone not null default now(),
  constraint prayer_note_responses_pkey primary key (id),
  constraint prayer_note_responses_prayer_note_id_fkey foreign KEY (prayer_note_id) references prayer_notes (id) on delete CASCADE,
  constraint prayer_note_responses_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists prayer_note_responses_note_id_idx on public.prayer_note_responses using btree (prayer_note_id) TABLESPACE pg_default;

create table public.session_history (
  id bigserial not null,
  user_id uuid not null default auth.uid (),
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
  constraint session_history_pkey primary key (id),
  constraint session_history_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists session_history_soft_deleted_at_idx on public.session_history using btree (soft_deleted_at) TABLESPACE pg_default;

create trigger set_session_history_updated_at BEFORE
update on session_history for EACH row
execute FUNCTION set_updated_at ();

create table public.token_usages (
  id bigserial not null,
  user_id uuid null,
  device_id text null,
  year integer not null,
  month integer not null,
  day integer not null,
  monthly_usage bigint not null default 0,
  daily_usage bigint not null default 0,
  request_count bigint not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  input_tokens bigint not null default 0,
  output_tokens bigint not null default 0,
  session_count bigint not null default 0,
  note_proposal_count bigint not null default 0,
  constraint token_usages_pkey primary key (id),
  constraint token_usages_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint token_usages_owner_check check (
    (
      (user_id is not null)
      or (device_id is not null)
    )
  )
) TABLESPACE pg_default;

create unique INDEX IF not exists token_usages_user_month_key on public.token_usages using btree (user_id, year, month) TABLESPACE pg_default
where
  (user_id is not null);

create unique INDEX IF not exists token_usages_device_month_key on public.token_usages using btree (device_id, year, month) TABLESPACE pg_default
where
  (device_id is not null);

create trigger set_token_usages_updated_at BEFORE
update on token_usages for EACH row
execute FUNCTION set_updated_at ();
