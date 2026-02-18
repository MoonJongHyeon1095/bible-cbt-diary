-- Detach behavior history from behavior details.

drop trigger if exists emotion_behavior_history_refresh_latest_tracked_on
on public.emotion_behavior_history;

drop function if exists public.trg_refresh_behavior_latest_tracked_on();
drop function if exists public.refresh_behavior_latest_tracked_on(bigint);

drop index if exists public.emotion_behavior_history_user_detail_tracked_on_key;
drop index if exists public.emotion_behavior_history_device_detail_tracked_on_key;
drop index if exists public.emotion_behavior_history_behavior_detail_id_idx;

alter table if exists public.emotion_behavior_history
  drop constraint if exists emotion_behavior_history_behavior_detail_id_fkey;

alter table if exists public.emotion_behavior_history
  drop column if exists behavior_detail_id;
