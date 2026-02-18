alter table if exists public.emotion_behavior_details
  add column if not exists is_pinned boolean not null default false;

create index if not exists emotion_behavior_details_is_pinned_idx
  on public.emotion_behavior_details using btree (is_pinned);
