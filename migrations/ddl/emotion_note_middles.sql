create table public.emotion_note_middles (
  id bigserial not null,
  flow_id bigint not null,
  from_note_id bigint not null,
  to_note_id bigint not null,
  created_at timestamp with time zone not null default now(),
  constraint emotion_note_middles_pkey primary key (id),
  constraint emotion_note_middles_flow_id_fkey foreign KEY (flow_id) references emotion_flows (id) on delete CASCADE,
  constraint emotion_note_middles_from_note_fkey foreign KEY (from_note_id) references emotion_notes (id) on delete CASCADE,
  constraint emotion_note_middles_to_note_fkey foreign KEY (to_note_id) references emotion_notes (id) on delete CASCADE,
  constraint emotion_note_middles_no_self check ((from_note_id <> to_note_id))
) TABLESPACE pg_default;

create index IF not exists emotion_note_middles_flow_id_idx on public.emotion_note_middles using btree (flow_id) TABLESPACE pg_default;

create index IF not exists emotion_note_middles_from_note_id_idx on public.emotion_note_middles using btree (from_note_id) TABLESPACE pg_default;

create index IF not exists emotion_note_middles_to_note_id_idx on public.emotion_note_middles using btree (to_note_id) TABLESPACE pg_default;

create unique INDEX IF not exists emotion_note_middles_pair_idx on public.emotion_note_middles using btree (flow_id, from_note_id, to_note_id) TABLESPACE pg_default;
