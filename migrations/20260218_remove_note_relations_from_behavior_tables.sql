-- Remove emotion_notes relation from behavior tables.
-- behavior details/history are now managed independently of individual notes.

alter table if exists public.emotion_behavior_history
  drop constraint if exists emotion_behavior_history_note_id_fkey;

alter table if exists public.emotion_behavior_details
  drop constraint if exists emotion_behavior_details_note_id_fkey;

drop index if exists public.emotion_behavior_details_note_id_idx;

alter table if exists public.emotion_behavior_history
  drop column if exists note_id;

alter table if exists public.emotion_behavior_details
  drop column if exists note_id;
