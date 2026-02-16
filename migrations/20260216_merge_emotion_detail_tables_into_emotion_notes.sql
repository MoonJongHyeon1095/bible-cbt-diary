-- Merge legacy 1:N detail tables into emotion_notes (1:1)

ALTER TABLE IF EXISTS public.emotion_notes
  ADD COLUMN IF NOT EXISTS emotion_tags text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS inner_belief text NOT NULL DEFAULT ''::text,
  ADD COLUMN IF NOT EXISTS error_label text NOT NULL DEFAULT ''::text,
  ADD COLUMN IF NOT EXISTS error_description text NOT NULL DEFAULT ''::text,
  ADD COLUMN IF NOT EXISTS alternative text NOT NULL DEFAULT ''::text;

ALTER TABLE IF EXISTS public.emotion_notes
  DROP COLUMN IF EXISTS frequency;

DO $$
BEGIN
  IF to_regclass('public.emotion_auto_thought_details') IS NOT NULL THEN
    WITH thought_rollup AS (
      SELECT
        d.note_id,
        COALESCE(
          array_remove(array_agg(DISTINCT NULLIF(btrim(d.emotion), '')), NULL),
          '{}'::text[]
        ) AS emotion_tags,
        (
          array_agg(NULLIF(btrim(d.automatic_thought), '') ORDER BY d.created_at DESC, d.id DESC)
        )[1] AS inner_belief
      FROM public.emotion_auto_thought_details d
      GROUP BY d.note_id
    )
    UPDATE public.emotion_notes n
    SET
      emotion_tags = CASE
        WHEN COALESCE(array_length(n.emotion_tags, 1), 0) = 0 THEN thought_rollup.emotion_tags
        ELSE n.emotion_tags
      END,
      inner_belief = CASE
        WHEN btrim(COALESCE(n.inner_belief, '')) = '' THEN COALESCE(thought_rollup.inner_belief, '')
        ELSE n.inner_belief
      END
    FROM thought_rollup
    WHERE thought_rollup.note_id = n.id;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.emotion_error_details') IS NOT NULL THEN
    WITH error_latest AS (
      SELECT DISTINCT ON (d.note_id)
        d.note_id,
        NULLIF(btrim(d.error_label), '') AS error_label,
        NULLIF(btrim(d.error_description), '') AS error_description
      FROM public.emotion_error_details d
      ORDER BY d.note_id, d.created_at DESC, d.id DESC
    )
    UPDATE public.emotion_notes n
    SET
      error_label = CASE
        WHEN btrim(COALESCE(n.error_label, '')) = '' THEN COALESCE(error_latest.error_label, '')
        ELSE n.error_label
      END,
      error_description = CASE
        WHEN btrim(COALESCE(n.error_description, '')) = '' THEN COALESCE(error_latest.error_description, '')
        ELSE n.error_description
      END
    FROM error_latest
    WHERE error_latest.note_id = n.id;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.emotion_alternative_details') IS NOT NULL THEN
    WITH alternative_latest AS (
      SELECT DISTINCT ON (d.note_id)
        d.note_id,
        NULLIF(btrim(d.alternative), '') AS alternative
      FROM public.emotion_alternative_details d
      ORDER BY d.note_id, d.created_at DESC, d.id DESC
    )
    UPDATE public.emotion_notes n
    SET
      alternative = CASE
        WHEN btrim(COALESCE(n.alternative, '')) = '' THEN COALESCE(alternative_latest.alternative, '')
        ELSE n.alternative
      END
    FROM alternative_latest
    WHERE alternative_latest.note_id = n.id;
  END IF;
END $$;

DROP TABLE IF EXISTS public.emotion_auto_thought_details CASCADE;
DROP TABLE IF EXISTS public.emotion_error_details CASCADE;
DROP TABLE IF EXISTS public.emotion_alternative_details CASCADE;

CREATE INDEX IF NOT EXISTS emotion_notes_emotion_tags_gin_idx
  ON public.emotion_notes USING gin (emotion_tags);
