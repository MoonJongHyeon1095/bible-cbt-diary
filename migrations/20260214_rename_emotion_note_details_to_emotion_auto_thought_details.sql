DO $$
BEGIN
  IF to_regclass('public.emotion_note_details') IS NULL THEN
    RETURN;
  END IF;

  ALTER TABLE public.emotion_note_details
    RENAME TO emotion_auto_thought_details;

  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'emotion_note_details_pkey'
      AND conrelid = 'public.emotion_auto_thought_details'::regclass
  ) THEN
    ALTER TABLE public.emotion_auto_thought_details
      RENAME CONSTRAINT emotion_note_details_pkey TO emotion_auto_thought_details_pkey;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'emotion_note_details_note_id_fkey'
      AND conrelid = 'public.emotion_auto_thought_details'::regclass
  ) THEN
    ALTER TABLE public.emotion_auto_thought_details
      RENAME CONSTRAINT emotion_note_details_note_id_fkey TO emotion_auto_thought_details_note_id_fkey;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'emotion_note_details_user_id_fkey'
      AND conrelid = 'public.emotion_auto_thought_details'::regclass
  ) THEN
    ALTER TABLE public.emotion_auto_thought_details
      RENAME CONSTRAINT emotion_note_details_user_id_fkey TO emotion_auto_thought_details_user_id_fkey;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'emotion_note_details_owner_check'
      AND conrelid = 'public.emotion_auto_thought_details'::regclass
  ) THEN
    ALTER TABLE public.emotion_auto_thought_details
      RENAME CONSTRAINT emotion_note_details_owner_check TO emotion_auto_thought_details_owner_check;
  END IF;

  IF to_regclass('public.emotion_note_details_note_id_idx') IS NOT NULL THEN
    ALTER INDEX public.emotion_note_details_note_id_idx
      RENAME TO emotion_auto_thought_details_note_id_idx;
  END IF;

  IF to_regclass('public.emotion_note_details_user_id_idx') IS NOT NULL THEN
    ALTER INDEX public.emotion_note_details_user_id_idx
      RENAME TO emotion_auto_thought_details_user_id_idx;
  END IF;

  IF to_regclass('public.emotion_note_details_device_id_idx') IS NOT NULL THEN
    ALTER INDEX public.emotion_note_details_device_id_idx
      RENAME TO emotion_auto_thought_details_device_id_idx;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'emotion_auto_thought_details'
      AND policyname = 'emotion_note_details_delete_own'
  ) THEN
    ALTER POLICY emotion_note_details_delete_own
      ON public.emotion_auto_thought_details
      RENAME TO emotion_auto_thought_details_delete_own;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'emotion_auto_thought_details'
      AND policyname = 'emotion_note_details_insert_own'
  ) THEN
    ALTER POLICY emotion_note_details_insert_own
      ON public.emotion_auto_thought_details
      RENAME TO emotion_auto_thought_details_insert_own;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'emotion_auto_thought_details'
      AND policyname = 'emotion_note_details_select_own'
  ) THEN
    ALTER POLICY emotion_note_details_select_own
      ON public.emotion_auto_thought_details
      RENAME TO emotion_auto_thought_details_select_own;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'emotion_auto_thought_details'
      AND policyname = 'emotion_note_details_update_own'
  ) THEN
    ALTER POLICY emotion_note_details_update_own
      ON public.emotion_auto_thought_details
      RENAME TO emotion_auto_thought_details_update_own;
  END IF;
END $$;
