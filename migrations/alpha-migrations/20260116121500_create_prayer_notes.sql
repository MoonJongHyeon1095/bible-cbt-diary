-- supabase/migrations/20260116121500_create_prayer_notes.sql
create table if not exists public.prayer_notes (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  content text not null,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at 자동 갱신 트리거
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_prayer_notes_updated_at on public.prayer_notes;
create trigger set_prayer_notes_updated_at
before update on public.prayer_notes
for each row execute function public.set_updated_at();

-- RLS 설정
alter table public.prayer_notes enable row level security;
alter table public.prayer_notes force row level security;

revoke all on table public.prayer_notes from anon, authenticated;

-- 인증된 사용자만 CRUD 허용 (행 단위 제어는 정책에서 처리)
grant select, insert, update, delete on table public.prayer_notes to authenticated;
