-- Cache latest tracked date on behavior detail for fast sorting

alter table if exists public.emotion_behavior_details
  add column if not exists latest_tracked_on date null;

create index if not exists emotion_behavior_details_latest_tracked_on_idx
  on public.emotion_behavior_details using btree (latest_tracked_on);

update public.emotion_behavior_details d
set latest_tracked_on = h.latest_tracked_on
from (
  select
    behavior_detail_id,
    max(tracked_on) as latest_tracked_on
  from public.emotion_behavior_history
  group by behavior_detail_id
) h
where h.behavior_detail_id = d.id;

create or replace function public.refresh_behavior_latest_tracked_on(
  p_behavior_detail_id bigint
)
returns void
language plpgsql
as $$
begin
  update public.emotion_behavior_details d
  set latest_tracked_on = (
    select max(h.tracked_on)
    from public.emotion_behavior_history h
    where h.behavior_detail_id = p_behavior_detail_id
  )
  where d.id = p_behavior_detail_id;
end;
$$;

create or replace function public.trg_refresh_behavior_latest_tracked_on()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'DELETE' then
    perform public.refresh_behavior_latest_tracked_on(old.behavior_detail_id);
    return old;
  end if;

  perform public.refresh_behavior_latest_tracked_on(new.behavior_detail_id);

  if tg_op = 'UPDATE' and old.behavior_detail_id is distinct from new.behavior_detail_id then
    perform public.refresh_behavior_latest_tracked_on(old.behavior_detail_id);
  end if;

  return new;
end;
$$;

drop trigger if exists emotion_behavior_history_refresh_latest_tracked_on
on public.emotion_behavior_history;

create trigger emotion_behavior_history_refresh_latest_tracked_on
after insert or update or delete
on public.emotion_behavior_history
for each row
execute function public.trg_refresh_behavior_latest_tracked_on();
