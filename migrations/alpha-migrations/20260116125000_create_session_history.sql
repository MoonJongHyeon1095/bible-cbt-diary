-- supabase/migrations/20260116125000_create_session_history.sql
create table if not exists public.session_history (
  id bigserial primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  timestamp timestamptz not null,
  user_input text not null,
  emotion_thought_pairs jsonb not null default '[]'::jsonb,
  selected_cognitive_errors text[] not null default '{}',
  selected_alternative_thought text default '',
  positive_reframes jsonb not null default '{}'::jsonb,
  bible_verse jsonb,
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

drop trigger if exists set_session_history_updated_at on public.session_history;
create trigger set_session_history_updated_at
before update on public.session_history
for each row execute function public.set_updated_at();

-- RLS 설정
alter table public.session_history enable row level security;
alter table public.session_history force row level security;

revoke all on table public.session_history from anon, authenticated;
grant select, insert, update, delete on table public.session_history to authenticated;

-- 기본 user_id는 현재 토큰 사용자로 지정
alter table public.session_history alter column user_id set default auth.uid();
