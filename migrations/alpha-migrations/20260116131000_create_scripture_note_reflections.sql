-- supabase/migrations/20260116131000_create_scripture_note_reflections.sql
create table if not exists public.scripture_note_reflections (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  scripture_note_id bigint not null references public.scripture_notes (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists scripture_note_reflections_note_id_idx
  on public.scripture_note_reflections (scripture_note_id);

-- RLS 설정
alter table public.scripture_note_reflections enable row level security;
alter table public.scripture_note_reflections force row level security;

revoke all on table public.scripture_note_reflections from anon, authenticated;
grant select, insert, update, delete on table public.scripture_note_reflections to authenticated;

-- 기본 user_id는 현재 토큰 사용자로 지정
alter table public.scripture_note_reflections alter column user_id set default auth.uid();
