-- supabase/migrations/20260116132000_create_prayer_note_responses.sql
create table if not exists public.prayer_note_responses (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  prayer_note_id bigint not null references public.prayer_notes (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists prayer_note_responses_note_id_idx
  on public.prayer_note_responses (prayer_note_id);

-- RLS 설정
alter table public.prayer_note_responses enable row level security;
alter table public.prayer_note_responses force row level security;

revoke all on table public.prayer_note_responses from anon, authenticated;
grant select, insert, update, delete on table public.prayer_note_responses to authenticated;

-- 기본 user_id는 현재 토큰 사용자로 지정
alter table public.prayer_note_responses alter column user_id set default auth.uid();
