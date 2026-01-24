-- supabase/migrations/20260116124500_add_emotion_note_details.sql
-- 1) 새 테이블 생성
create table if not exists public.emotion_note_details (
  id bigserial primary key,
  note_id bigint not null references public.emotion_notes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  automatic_thought text not null default '',
  emotion text not null default '',
  alternative text not null default '',
  created_at timestamptz not null default now()
);

alter table public.emotion_note_details alter column user_id set default auth.uid();

create index if not exists emotion_note_details_note_id_idx on public.emotion_note_details (note_id);
create index if not exists emotion_note_details_user_id_idx on public.emotion_note_details (user_id);

-- 2) 기존 데이터 마이그레이션
insert into public.emotion_note_details (note_id, user_id, automatic_thought, emotion, alternative, created_at)
select
  id,
  user_id,
  coalesce(automatic_thought, ''),
  coalesce(emotion, ''),
  coalesce(alternative, ''),
  created_at
from public.emotion_notes
where coalesce(automatic_thought, '') <> ''
   or coalesce(emotion, '') <> ''
   or coalesce(alternative, '') <> '';

-- 3) emotion_notes에서 세부 칼럼 제거
alter table public.emotion_notes drop column if exists automatic_thought;
alter table public.emotion_notes drop column if exists emotion;
alter table public.emotion_notes drop column if exists alternative;

-- 4) RLS 설정
alter table public.emotion_note_details enable row level security;
alter table public.emotion_note_details force row level security;

revoke all on table public.emotion_note_details from anon, authenticated;
grant select, insert, update, delete on table public.emotion_note_details to authenticated;

drop policy if exists emotion_note_details_select_own on public.emotion_note_details;
create policy emotion_note_details_select_own
on public.emotion_note_details
for select
using (auth.uid() = user_id);

drop policy if exists emotion_note_details_insert_own on public.emotion_note_details;
create policy emotion_note_details_insert_own
on public.emotion_note_details
for insert
with check (auth.uid() = user_id);

drop policy if exists emotion_note_details_update_own on public.emotion_note_details;
create policy emotion_note_details_update_own
on public.emotion_note_details
for update
using (auth.uid() = user_id);

drop policy if exists emotion_note_details_delete_own on public.emotion_note_details;
create policy emotion_note_details_delete_own
on public.emotion_note_details
for delete
using (auth.uid() = user_id);
