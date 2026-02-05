create table public.token_usages (
  id bigserial not null,
  user_id uuid null,
  device_id text null,
  year integer not null,
  month integer not null,
  day integer not null,
  monthly_usage bigint not null default 0,
  daily_usage bigint not null default 0,
  request_count bigint not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  input_tokens bigint not null default 0,
  output_tokens bigint not null default 0,
  session_count bigint not null default 0,
  note_proposal_count bigint not null default 0,
  constraint token_usages_pkey primary key (id),
  constraint token_usages_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE,
  constraint token_usages_owner_check check (
    (
      (user_id is not null)
      or (device_id is not null)
    )
  )
) TABLESPACE pg_default;

create unique INDEX IF not exists token_usages_user_month_key on public.token_usages using btree (user_id, year, month) TABLESPACE pg_default
where
  (user_id is not null);

create unique INDEX IF not exists token_usages_device_month_key on public.token_usages using btree (device_id, year, month) TABLESPACE pg_default
where
  (device_id is not null);

create trigger set_token_usages_updated_at BEFORE
update on token_usages for EACH row
execute FUNCTION set_updated_at ();