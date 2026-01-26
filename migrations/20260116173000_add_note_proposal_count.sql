alter table public.token_usages
  add column if not exists note_proposal_count bigint not null default 0;

create or replace function public.increment_token_usages(
  p_user_id uuid,
  p_device_id text,
  p_year integer,
  p_month integer,
  p_day integer,
  p_total_tokens bigint,
  p_input_tokens bigint,
  p_output_tokens bigint,
  p_request_count bigint,
  p_session_count bigint default 0,
  p_note_proposal_count bigint default 0
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
      input_tokens,
      output_tokens,
      request_count,
      session_count,
      note_proposal_count
    ) values (
      p_user_id,
      p_device_id,
      p_year,
      p_month,
      p_day,
      p_total_tokens,
      p_total_tokens,
      p_input_tokens,
      p_output_tokens,
      p_request_count,
      p_session_count,
      p_note_proposal_count
    )
    on conflict (user_id, year, month) where user_id is not null do update
    set monthly_usage = public.token_usages.monthly_usage + excluded.monthly_usage,
        daily_usage = case
          when public.token_usages.day = excluded.day
            then public.token_usages.daily_usage + excluded.daily_usage
          else excluded.daily_usage
        end,
        input_tokens = public.token_usages.input_tokens + excluded.input_tokens,
        output_tokens = public.token_usages.output_tokens + excluded.output_tokens,
        day = excluded.day,
        device_id = coalesce(excluded.device_id, public.token_usages.device_id),
        request_count = public.token_usages.request_count + excluded.request_count,
        session_count = public.token_usages.session_count + excluded.session_count,
        note_proposal_count = public.token_usages.note_proposal_count + excluded.note_proposal_count,
        updated_at = now();
  else
    insert into public.token_usages (
      device_id,
      year,
      month,
      day,
      monthly_usage,
      daily_usage,
      input_tokens,
      output_tokens,
      request_count,
      session_count,
      note_proposal_count
    ) values (
      p_device_id,
      p_year,
      p_month,
      p_day,
      p_total_tokens,
      p_total_tokens,
      p_input_tokens,
      p_output_tokens,
      p_request_count,
      p_session_count,
      p_note_proposal_count
    )
    on conflict (device_id, year, month) where device_id is not null do update
    set monthly_usage = public.token_usages.monthly_usage + excluded.monthly_usage,
        daily_usage = case
          when public.token_usages.day = excluded.day
            then public.token_usages.daily_usage + excluded.daily_usage
          else excluded.daily_usage
        end,
        input_tokens = public.token_usages.input_tokens + excluded.input_tokens,
        output_tokens = public.token_usages.output_tokens + excluded.output_tokens,
        day = excluded.day,
        request_count = public.token_usages.request_count + excluded.request_count,
        session_count = public.token_usages.session_count + excluded.session_count,
        note_proposal_count = public.token_usages.note_proposal_count + excluded.note_proposal_count,
        updated_at = now();
  end if;
end;
$$;
