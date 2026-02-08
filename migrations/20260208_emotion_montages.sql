CREATE TABLE IF NOT EXISTS public.emotion_montages (
  id bigserial NOT NULL,
  user_id uuid NULL DEFAULT auth.uid (),
  device_id text NULL,
  flow_id bigint NOT NULL,
  main_note_id bigint NOT NULL,
  sub_note_ids bigint[] NOT NULL DEFAULT '{}'::bigint[],
  atoms_jsonb jsonb NOT NULL DEFAULT '[]'::jsonb,
  montage_caption text NOT NULL DEFAULT '',
  montage_jsonb jsonb NOT NULL DEFAULT '{}'::jsonb,
  freeze_frames_jsonb jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT emotion_montages_pkey PRIMARY KEY (id),
  CONSTRAINT emotion_montages_flow_id_fkey
    FOREIGN KEY (flow_id) REFERENCES emotion_flows (id) ON DELETE CASCADE,
  CONSTRAINT emotion_montages_owner_check CHECK (
    (user_id IS NOT NULL) OR (device_id IS NOT NULL)
  )
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS emotion_montages_flow_id_idx
  ON public.emotion_montages USING btree (flow_id) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS emotion_montages_device_id_idx
  ON public.emotion_montages USING btree (device_id) TABLESPACE pg_default;

DROP TRIGGER IF EXISTS set_emotion_montages_updated_at ON public.emotion_montages;
CREATE TRIGGER set_emotion_montages_updated_at BEFORE
UPDATE ON public.emotion_montages FOR EACH ROW
EXECUTE FUNCTION set_updated_at ();
