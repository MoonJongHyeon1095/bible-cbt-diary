alter table public.emotion_behavior_details
add column if not exists error_tags text[] default '{}'::text[];
