-- supabase/migrations/20260117120000_create_emotion_note_groups_and_middles.sql
create table if not exists public.emotion_note_groups (
  id bigserial primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.emotion_notes
  add column if not exists group_id bigint;

alter table public.emotion_notes
  add constraint emotion_notes_group_id_fkey
  foreign key (group_id) references public.emotion_note_groups (id) on delete cascade;

alter table public.emotion_notes
  add constraint emotion_notes_id_group_id_key unique (id, group_id);

create index if not exists emotion_notes_group_id_idx
  on public.emotion_notes using btree (group_id);

create table if not exists public.emotion_note_middles (
  id bigserial primary key,
  group_id bigint not null,
  from_note_id bigint not null,
  to_note_id bigint not null,
  created_at timestamptz not null default now(),
  constraint emotion_note_middles_group_id_fkey
    foreign key (group_id)
    references public.emotion_note_groups (id)
    on delete cascade,
  constraint emotion_note_middles_from_note_fkey
    foreign key (from_note_id, group_id)
    references public.emotion_notes (id, group_id)
    on delete cascade,
  constraint emotion_note_middles_to_note_fkey
    foreign key (to_note_id, group_id)
    references public.emotion_notes (id, group_id)
    on delete cascade,
  constraint emotion_note_middles_no_self
    check (from_note_id <> to_note_id)
);

create index if not exists emotion_note_middles_group_id_idx
  on public.emotion_note_middles using btree (group_id);

create index if not exists emotion_note_middles_from_note_id_idx
  on public.emotion_note_middles using btree (from_note_id);

create index if not exists emotion_note_middles_to_note_id_idx
  on public.emotion_note_middles using btree (to_note_id);

create unique index if not exists emotion_note_middles_pair_idx
  on public.emotion_note_middles (group_id, from_note_id, to_note_id);
