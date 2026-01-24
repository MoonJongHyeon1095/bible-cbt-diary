-- supabase/migrations/20260116124000_create_emotion_notes.sql
create table if not exists public.emotion_notes (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  trigger_text text not null,
  automatic_thought text default '',
  emotion text default '',
  behavior text default '',
  alternative text default '',
  frequency int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at 자동 갱신 트리거 (재사용)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_emotion_notes_updated_at on public.emotion_notes;
create trigger set_emotion_notes_updated_at
before update on public.emotion_notes
for each row execute function public.set_updated_at();

-- RLS 설정
alter table public.emotion_notes enable row level security;
alter table public.emotion_notes force row level security;

revoke all on table public.emotion_notes from anon, authenticated;
grant select, insert, update, delete on table public.emotion_notes to authenticated;

-- 기본 user_id는 현재 토큰 사용자로 지정
alter table public.emotion_notes alter column user_id set default auth.uid();
