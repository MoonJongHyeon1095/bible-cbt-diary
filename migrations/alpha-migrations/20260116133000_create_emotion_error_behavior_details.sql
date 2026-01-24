-- Create emotion_error_details and emotion_behavior_details tables

create table if not exists public.emotion_error_details (
  id bigserial primary key,
  note_id bigint not null references public.emotion_notes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  error_label text not null default '',
  error_description text not null default '',
  created_at timestamptz not null default now()
);

alter table public.emotion_error_details alter column user_id set default auth.uid();
create index if not exists emotion_error_details_note_id_idx on public.emotion_error_details (note_id);
create index if not exists emotion_error_details_user_id_idx on public.emotion_error_details (user_id);

create table if not exists public.emotion_behavior_details (
  id bigserial primary key,
  note_id bigint not null references public.emotion_notes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  behavior_label text not null default '',
  behavior_description text not null default '',
  created_at timestamptz not null default now()
);

alter table public.emotion_behavior_details alter column user_id set default auth.uid();
create index if not exists emotion_behavior_details_note_id_idx on public.emotion_behavior_details (note_id);
create index if not exists emotion_behavior_details_user_id_idx on public.emotion_behavior_details (user_id);

-- RLS 설정: emotion_error_details
alter table public.emotion_error_details enable row level security;
alter table public.emotion_error_details force row level security;

revoke all on table public.emotion_error_details from anon, authenticated;
grant select, insert, update, delete on table public.emotion_error_details to authenticated;

drop policy if exists emotion_error_details_select_own on public.emotion_error_details;
create policy emotion_error_details_select_own
on public.emotion_error_details
for select
using (auth.uid() = user_id);

drop policy if exists emotion_error_details_insert_own on public.emotion_error_details;
create policy emotion_error_details_insert_own
on public.emotion_error_details
for insert
with check (auth.uid() = user_id);

drop policy if exists emotion_error_details_update_own on public.emotion_error_details;
create policy emotion_error_details_update_own
on public.emotion_error_details
for update
using (auth.uid() = user_id);

drop policy if exists emotion_error_details_delete_own on public.emotion_error_details;
create policy emotion_error_details_delete_own
on public.emotion_error_details
for delete
using (auth.uid() = user_id);

-- RLS 설정: emotion_behavior_details
alter table public.emotion_behavior_details enable row level security;
alter table public.emotion_behavior_details force row level security;

revoke all on table public.emotion_behavior_details from anon, authenticated;
grant select, insert, update, delete on table public.emotion_behavior_details to authenticated;

drop policy if exists emotion_behavior_details_select_own on public.emotion_behavior_details;
create policy emotion_behavior_details_select_own
on public.emotion_behavior_details
for select
using (auth.uid() = user_id);

drop policy if exists emotion_behavior_details_insert_own on public.emotion_behavior_details;
create policy emotion_behavior_details_insert_own
on public.emotion_behavior_details
for insert
with check (auth.uid() = user_id);

drop policy if exists emotion_behavior_details_update_own on public.emotion_behavior_details;
create policy emotion_behavior_details_update_own
on public.emotion_behavior_details
for update
using (auth.uid() = user_id);

drop policy if exists emotion_behavior_details_delete_own on public.emotion_behavior_details;
create policy emotion_behavior_details_delete_own
on public.emotion_behavior_details
for delete
using (auth.uid() = user_id);
