-- 1) 새 테이블 생성
create table if not exists public.emotion_alternative_details (
  id bigserial primary key,
  note_id bigint not null references public.emotion_notes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  alternative text not null default '',
  created_at timestamptz not null default now()
);

alter table public.emotion_alternative_details alter column user_id set default auth.uid();
create index if not exists emotion_alternative_details_note_id_idx on public.emotion_alternative_details (note_id);
create index if not exists emotion_alternative_details_user_id_idx on public.emotion_alternative_details (user_id);

-- 2) 기존 emotion_note_details.alternative 데이터를 이전
insert into public.emotion_alternative_details (note_id, user_id, alternative, created_at)
select
  note_id,
  user_id,
  alternative,
  created_at
from public.emotion_note_details
where coalesce(alternative, '') <> '';

-- 3) emotion_note_details에서 alternative 컬럼 제거
alter table public.emotion_note_details drop column if exists alternative;

-- 4) RLS 설정
alter table public.emotion_alternative_details enable row level security;
alter table public.emotion_alternative_details force row level security;

revoke all on table public.emotion_alternative_details from anon, authenticated;
grant select, insert, update, delete on table public.emotion_alternative_details to authenticated;

drop policy if exists emotion_alternative_details_select_own on public.emotion_alternative_details;
create policy emotion_alternative_details_select_own
on public.emotion_alternative_details
for select
using (auth.uid() = user_id);

drop policy if exists emotion_alternative_details_insert_own on public.emotion_alternative_details;
create policy emotion_alternative_details_insert_own
on public.emotion_alternative_details
for insert
with check (auth.uid() = user_id);

drop policy if exists emotion_alternative_details_update_own on public.emotion_alternative_details;
create policy emotion_alternative_details_update_own
on public.emotion_alternative_details
for update
using (auth.uid() = user_id);

drop policy if exists emotion_alternative_details_delete_own on public.emotion_alternative_details;
create policy emotion_alternative_details_delete_own
on public.emotion_alternative_details
for delete
using (auth.uid() = user_id);
