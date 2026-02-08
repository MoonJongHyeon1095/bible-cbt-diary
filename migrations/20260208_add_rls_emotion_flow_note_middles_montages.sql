-- Migration: add RLS policies for emotion_flow_note_middles & emotion_montages

ALTER TABLE IF EXISTS public.emotion_flow_note_middles
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.emotion_montages
  ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policy
    WHERE polname = 'emotion_flow_note_middles_select_own'
      AND polrelid = 'public.emotion_flow_note_middles'::regclass
  ) THEN
    CREATE POLICY emotion_flow_note_middles_select_own
      ON public.emotion_flow_note_middles
      FOR SELECT
      TO PUBLIC
      USING (
        EXISTS (
          SELECT 1
          FROM emotion_flows flows
          WHERE flows.id = emotion_flow_note_middles.flow_id
            AND flows.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policy
    WHERE polname = 'emotion_flow_note_middles_insert_own'
      AND polrelid = 'public.emotion_flow_note_middles'::regclass
  ) THEN
    CREATE POLICY emotion_flow_note_middles_insert_own
      ON public.emotion_flow_note_middles
      FOR INSERT
      TO PUBLIC
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM emotion_flows flows
          WHERE flows.id = emotion_flow_note_middles.flow_id
            AND flows.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policy
    WHERE polname = 'emotion_flow_note_middles_update_own'
      AND polrelid = 'public.emotion_flow_note_middles'::regclass
  ) THEN
    CREATE POLICY emotion_flow_note_middles_update_own
      ON public.emotion_flow_note_middles
      FOR UPDATE
      TO PUBLIC
      USING (
        EXISTS (
          SELECT 1
          FROM emotion_flows flows
          WHERE flows.id = emotion_flow_note_middles.flow_id
            AND flows.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM emotion_flows flows
          WHERE flows.id = emotion_flow_note_middles.flow_id
            AND flows.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policy
    WHERE polname = 'emotion_flow_note_middles_delete_own'
      AND polrelid = 'public.emotion_flow_note_middles'::regclass
  ) THEN
    CREATE POLICY emotion_flow_note_middles_delete_own
      ON public.emotion_flow_note_middles
      FOR DELETE
      TO PUBLIC
      USING (
        EXISTS (
          SELECT 1
          FROM emotion_flows flows
          WHERE flows.id = emotion_flow_note_middles.flow_id
            AND flows.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policy
    WHERE polname = 'emotion_montages_select_own'
      AND polrelid = 'public.emotion_montages'::regclass
  ) THEN
    CREATE POLICY emotion_montages_select_own
      ON public.emotion_montages
      FOR SELECT
      TO PUBLIC
      USING (
        EXISTS (
          SELECT 1
          FROM emotion_flows flows
          WHERE flows.id = emotion_montages.flow_id
            AND flows.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policy
    WHERE polname = 'emotion_montages_insert_own'
      AND polrelid = 'public.emotion_montages'::regclass
  ) THEN
    CREATE POLICY emotion_montages_insert_own
      ON public.emotion_montages
      FOR INSERT
      TO PUBLIC
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM emotion_flows flows
          WHERE flows.id = emotion_montages.flow_id
            AND flows.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policy
    WHERE polname = 'emotion_montages_update_own'
      AND polrelid = 'public.emotion_montages'::regclass
  ) THEN
    CREATE POLICY emotion_montages_update_own
      ON public.emotion_montages
      FOR UPDATE
      TO PUBLIC
      USING (
        EXISTS (
          SELECT 1
          FROM emotion_flows flows
          WHERE flows.id = emotion_montages.flow_id
            AND flows.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM emotion_flows flows
          WHERE flows.id = emotion_montages.flow_id
            AND flows.user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policy
    WHERE polname = 'emotion_montages_delete_own'
      AND polrelid = 'public.emotion_montages'::regclass
  ) THEN
    CREATE POLICY emotion_montages_delete_own
      ON public.emotion_montages
      FOR DELETE
      TO PUBLIC
      USING (
        EXISTS (
          SELECT 1
          FROM emotion_flows flows
          WHERE flows.id = emotion_montages.flow_id
            AND flows.user_id = auth.uid()
        )
      );
  END IF;
END $$;
