-- Prepare behavior details for standalone behavior tab
-- - Keep behavior records even if emotion_notes are deleted
-- - Remove deprecated error_tags column

ALTER TABLE IF EXISTS public.emotion_behavior_details
  DROP COLUMN IF EXISTS error_tags;

ALTER TABLE IF EXISTS public.emotion_behavior_details
  ALTER COLUMN note_id DROP NOT NULL;

ALTER TABLE IF EXISTS public.emotion_behavior_details
  DROP CONSTRAINT IF EXISTS emotion_behavior_details_note_id_fkey;

ALTER TABLE IF EXISTS public.emotion_behavior_details
  ADD CONSTRAINT emotion_behavior_details_note_id_fkey
  FOREIGN KEY (note_id)
  REFERENCES public.emotion_notes (id)
  ON DELETE SET NULL;
