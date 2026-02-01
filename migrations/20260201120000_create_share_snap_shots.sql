-- supabase/migrations/20260201120000_create_share_snap_shots.sql
create extension if not exists pgcrypto;
create extension if not exists pg_cron with schema extensions;

create table if not exists public.share_snap_shots (
  id bigserial primary key,
  public_id uuid not null default gen_random_uuid(),
  note_id bigint not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  trigger_text text not null,
  sections jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  expires_at timestamptz null,
  constraint share_snap_shots_public_id_key unique (public_id),
  constraint share_snap_shots_note_id_fkey foreign key (note_id) references public.emotion_notes (id) on delete cascade
);

create index if not exists share_snap_shots_note_id_idx
  on public.share_snap_shots using btree (note_id);

create index if not exists share_snap_shots_user_id_idx
  on public.share_snap_shots using btree (user_id);

create index if not exists share_snap_shots_expires_at_idx
  on public.share_snap_shots using btree (expires_at);

alter table public.share_snap_shots enable row level security;

drop policy if exists share_snap_shots_select_public on public.share_snap_shots;
create policy share_snap_shots_select_public
on public.share_snap_shots
for select
using (
  public_id is not null
  and (expires_at is null or expires_at > now())
);

drop policy if exists share_snap_shots_insert_own on public.share_snap_shots;
create policy share_snap_shots_insert_own
on public.share_snap_shots
for insert
with check (auth.uid() = user_id);

drop policy if exists share_snap_shots_update_own on public.share_snap_shots;
create policy share_snap_shots_update_own
on public.share_snap_shots
for update
using (auth.uid() = user_id);

drop policy if exists share_snap_shots_delete_own on public.share_snap_shots;
create policy share_snap_shots_delete_own
on public.share_snap_shots
for delete
using (auth.uid() = user_id);

do $$
begin
  if not exists (select 1 from cron.job where jobname = 'cleanup_share_snap_shots') then
    perform cron.schedule(
      'cleanup_share_snap_shots',
      '0 3 * * *',
      $job$delete from public.share_snap_shots where expires_at is not null and expires_at <= now();$job$
    );
  end if;
end$$;
