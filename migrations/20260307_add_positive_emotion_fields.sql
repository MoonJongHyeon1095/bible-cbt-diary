ALTER TABLE IF EXISTS public.emotion_notes
  ADD COLUMN IF NOT EXISTS emotion_type text NOT NULL DEFAULT 'negative'::text,
  ADD COLUMN IF NOT EXISTS sdt_type text NULL,
  ADD COLUMN IF NOT EXISTS sdt_empathy_text text NOT NULL DEFAULT ''::text,
  ADD COLUMN IF NOT EXISTS reflection_question text NOT NULL DEFAULT ''::text,
  ADD COLUMN IF NOT EXISTS is_history_represent boolean NOT NULL DEFAULT true;

ALTER TABLE IF EXISTS public.emotion_notes
  ALTER COLUMN error_label SET DEFAULT ''::text,
  ALTER COLUMN error_description SET DEFAULT ''::text,
  ALTER COLUMN alternative SET DEFAULT ''::text;

CREATE INDEX IF NOT EXISTS emotion_notes_emotion_type_idx
  ON public.emotion_notes USING btree (emotion_type);
