-- supabase/migrations/20260116120000_create_comments_table.sql
create table if not exists public.comments (
  id text primary key,
  rating int not null check (rating between 1 and 5),
  comment text not null,
  nickname text not null default 'anonymous',
  timestamp bigint not null,
  created_at timestamptz not null default now()
);
