-- supabase/migrations/20260116170000_create_token_usage.sql
create table if not exists public.token_usages (
  id bigserial primary key,
  user_id uuid references auth.users (id) on delete cascade,
  device_id text,
  year integer not null,
  month integer not null,
  day integer not null,
  monthly_usage bigint not null default 0,
  daily_usage bigint not null default 0,
  request_count bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint token_usages_owner_check check (user_id is not null or device_id is not null)
);

create unique index token_usages_user_month_key
  on public.token_usages (user_id, year, month)
  where user_id is not null;

create unique index token_usages_device_month_key
  on public.token_usages (device_id, year, month)
  where device_id is not null;

drop trigger if exists set_token_usages_updated_at on public.token_usages;
create trigger set_token_usages_updated_at
before update on public.token_usages
for each row execute function public.set_updated_at();

create or replace function public.increment_token_usages(
  p_user_id uuid,
  p_device_id text,
  p_year integer,
  p_month integer,
  p_day integer,
  p_total_tokens bigint,
  p_request_count bigint
)
returns void
language plpgsql
as $$
begin
  if p_user_id is null and (p_device_id is null or length(trim(p_device_id)) = 0) then
    raise exception 'user_id or device_id is required';
  end if;

  if p_user_id is not null then
    insert into public.token_usages (
      user_id,
      device_id,
      year,
      month,
      day,
      monthly_usage,
      daily_usage,
      request_count
    ) values (
      p_user_id,
      p_device_id,
      p_year,
      p_month,
      p_day,
      p_total_tokens,
      p_total_tokens,
      p_request_count
    )
    on conflict (user_id, year, month) where user_id is not null do update
    set monthly_usage = public.token_usages.monthly_usage + excluded.monthly_usage,
        daily_usage = case
          when public.token_usages.day = excluded.day
            then public.token_usages.daily_usage + excluded.daily_usage
          else excluded.daily_usage
        end,
        day = excluded.day,
        device_id = coalesce(excluded.device_id, public.token_usages.device_id),
        request_count = public.token_usages.request_count + excluded.request_count,
        updated_at = now();
  else
    insert into public.token_usages (
      device_id,
      year,
      month,
      day,
      monthly_usage,
      daily_usage,
      request_count
    ) values (
      p_device_id,
      p_year,
      p_month,
      p_day,
      p_total_tokens,
      p_total_tokens,
      p_request_count
    )
    on conflict (device_id, year, month) where device_id is not null do update
    set monthly_usage = public.token_usages.monthly_usage + excluded.monthly_usage,
        daily_usage = case
          when public.token_usages.day = excluded.day
            then public.token_usages.daily_usage + excluded.daily_usage
          else excluded.daily_usage
        end,
        day = excluded.day,
        request_count = public.token_usages.request_count + excluded.request_count,
        updated_at = now();
  end if;
end;
$$;

alter table public.token_usages enable row level security;
alter table public.token_usages force row level security;

revoke all on table public.token_usages from anon, authenticated;
