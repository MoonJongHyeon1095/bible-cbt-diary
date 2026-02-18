-- Ensure one tracking history per owner + date.
-- Keep the latest row per key and drop older duplicates before adding unique indexes.

with ranked_user_rows as (
  select
    id,
    row_number() over (
      partition by user_id, tracked_on
      order by created_at desc, id desc
    ) as rn
  from public.emotion_behavior_history
  where user_id is not null
)
delete from public.emotion_behavior_history h
using ranked_user_rows r
where h.id = r.id
  and r.rn > 1;

with ranked_device_rows as (
  select
    id,
    row_number() over (
      partition by device_id, tracked_on
      order by created_at desc, id desc
    ) as rn
  from public.emotion_behavior_history
  where user_id is null
    and device_id is not null
)
delete from public.emotion_behavior_history h
using ranked_device_rows r
where h.id = r.id
  and r.rn > 1;

drop index if exists public.emotion_behavior_history_user_detail_tracked_on_key;
drop index if exists public.emotion_behavior_history_device_detail_tracked_on_key;

create unique index if not exists emotion_behavior_history_user_tracked_on_key
  on public.emotion_behavior_history using btree (user_id, tracked_on)
  where user_id is not null;

create unique index if not exists emotion_behavior_history_device_tracked_on_key
  on public.emotion_behavior_history using btree (device_id, tracked_on)
  where user_id is null
    and device_id is not null;
