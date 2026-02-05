-- Migration: emotion_note_groups -> emotion_flows, introduce N:N flow-note mapping

ALTER TABLE IF EXISTS public.emotion_note_groups
  RENAME TO emotion_flows;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'emotion_note_groups_pkey'
      AND conrelid = 'public.emotion_flows'::regclass
  ) THEN
    ALTER TABLE public.emotion_flows
      RENAME CONSTRAINT emotion_note_groups_pkey TO emotion_flows_pkey;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'emotion_note_groups_user_id_fkey'
      AND conrelid = 'public.emotion_flows'::regclass
  ) THEN
    ALTER TABLE public.emotion_flows
      RENAME CONSTRAINT emotion_note_groups_user_id_fkey TO emotion_flows_user_id_fkey;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'emotion_note_groups_owner_check'
      AND conrelid = 'public.emotion_flows'::regclass
  ) THEN
    ALTER TABLE public.emotion_flows
      RENAME CONSTRAINT emotion_note_groups_owner_check TO emotion_flows_owner_check;
  END IF;
END $$;

ALTER INDEX IF EXISTS emotion_note_groups_device_id_idx
  RENAME TO emotion_flows_device_id_idx;

ALTER TABLE IF EXISTS public.emotion_flows
  ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT 'Flow',
  ADD COLUMN IF NOT EXISTS description text NULL,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS set_emotion_flows_updated_at ON public.emotion_flows;
CREATE TRIGGER set_emotion_flows_updated_at BEFORE
update on emotion_flows for EACH row
execute FUNCTION set_updated_at ();

CREATE TABLE IF NOT EXISTS public.emotion_flow_note_middles (
  id bigserial not null,
  flow_id bigint not null,
  note_id bigint not null,
  created_at timestamp with time zone not null default now(),
  constraint emotion_flow_note_middles_pkey primary key (id),
  constraint emotion_flow_note_middles_flow_id_fkey foreign KEY (flow_id) references emotion_flows (id) on delete CASCADE,
  constraint emotion_flow_note_middles_note_id_fkey foreign KEY (note_id) references emotion_notes (id) on delete CASCADE
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS emotion_flow_note_middles_flow_id_idx
  ON public.emotion_flow_note_middles using btree (flow_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS emotion_flow_note_middles_note_id_idx
  ON public.emotion_flow_note_middles using btree (note_id) TABLESPACE pg_default;

CREATE UNIQUE INDEX IF NOT EXISTS emotion_flow_note_middles_unique_idx
  ON public.emotion_flow_note_middles using btree (flow_id, note_id) TABLESPACE pg_default;

INSERT INTO public.emotion_flow_note_middles (flow_id, note_id, created_at)
SELECT group_id, id, created_at
FROM public.emotion_notes
WHERE group_id IS NOT NULL
ON CONFLICT DO NOTHING;

ALTER TABLE IF EXISTS public.emotion_note_middles
  RENAME COLUMN group_id TO flow_id;

ALTER TABLE IF EXISTS public.emotion_note_middles
  DROP CONSTRAINT IF EXISTS emotion_note_middles_from_note_fkey,
  DROP CONSTRAINT IF EXISTS emotion_note_middles_group_id_fkey,
  DROP CONSTRAINT IF EXISTS emotion_note_middles_to_note_fkey;

ALTER TABLE IF EXISTS public.emotion_note_middles
  ADD CONSTRAINT emotion_note_middles_flow_id_fkey
    FOREIGN KEY (flow_id) references emotion_flows (id) on delete CASCADE,
  ADD CONSTRAINT emotion_note_middles_from_note_fkey
    FOREIGN KEY (from_note_id) references emotion_notes (id) on delete CASCADE,
  ADD CONSTRAINT emotion_note_middles_to_note_fkey
    FOREIGN KEY (to_note_id) references emotion_notes (id) on delete CASCADE;

DROP INDEX IF EXISTS emotion_note_middles_group_id_idx;
CREATE INDEX IF NOT EXISTS emotion_note_middles_flow_id_idx
  ON public.emotion_note_middles using btree (flow_id) TABLESPACE pg_default;

DROP INDEX IF EXISTS emotion_note_middles_pair_idx;
CREATE UNIQUE INDEX IF NOT EXISTS emotion_note_middles_pair_idx
  ON public.emotion_note_middles using btree (flow_id, from_note_id, to_note_id) TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.emotion_notes
  DROP CONSTRAINT IF EXISTS emotion_notes_id_group_id_key,
  DROP CONSTRAINT IF EXISTS emotion_notes_group_id_fkey;

DROP INDEX IF EXISTS emotion_notes_group_id_idx;

ALTER TABLE IF EXISTS public.emotion_notes
  DROP COLUMN IF EXISTS group_id;
