-- supabase/migrations/20260116123000_create_scripture_notes.sql
create table if not exists public.scripture_notes (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  reference text not null,
  verse text not null,
  reflection text default '',
  favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at 자동 갱신 트리거 (다른 테이블에서도 재사용)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_scripture_notes_updated_at on public.scripture_notes;
create trigger set_scripture_notes_updated_at
before update on public.scripture_notes
for each row execute function public.set_updated_at();

-- RLS 설정
alter table public.scripture_notes enable row level security;
alter table public.scripture_notes force row level security;

revoke all on table public.scripture_notes from anon, authenticated;
grant select, insert, update, delete on table public.scripture_notes to authenticated;

-- 기본 user_id는 현재 토큰 사용자로 지정
alter table public.scripture_notes alter column user_id set default auth.uid();
