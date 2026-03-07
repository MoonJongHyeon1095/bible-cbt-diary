ALTER TABLE IF EXISTS public.emotion_behavior_details
  ADD COLUMN IF NOT EXISTS note_id bigint NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'emotion_behavior_details_note_id_fkey'
  ) THEN
    ALTER TABLE public.emotion_behavior_details
      ADD CONSTRAINT emotion_behavior_details_note_id_fkey
      FOREIGN KEY (note_id)
      REFERENCES public.emotion_notes (id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS emotion_behavior_details_note_id_idx
  ON public.emotion_behavior_details USING btree (note_id);
