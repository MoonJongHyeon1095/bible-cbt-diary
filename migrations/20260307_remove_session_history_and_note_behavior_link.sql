ALTER TABLE IF EXISTS public.emotion_notes
  ADD COLUMN IF NOT EXISTS is_history_represent boolean NOT NULL DEFAULT true,
  DROP CONSTRAINT IF EXISTS emotion_notes_behavior_detail_id_fkey,
  DROP COLUMN IF EXISTS behavior_detail_id;

DROP TABLE IF EXISTS public.session_history CASCADE;
