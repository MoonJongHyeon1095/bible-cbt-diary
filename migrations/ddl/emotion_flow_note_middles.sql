create table public.emotion_flow_note_middles (
  id bigserial not null,
  flow_id bigint not null,
  note_id bigint not null,
  created_at timestamp with time zone not null default now(),
  constraint emotion_flow_note_middles_pkey primary key (id),
  constraint emotion_flow_note_middles_flow_id_fkey foreign KEY (flow_id) references emotion_flows (id) on delete CASCADE,
  constraint emotion_flow_note_middles_note_id_fkey foreign KEY (note_id) references emotion_notes (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists emotion_flow_note_middles_flow_id_idx on public.emotion_flow_note_middles using btree (flow_id) TABLESPACE pg_default;

create index IF not exists emotion_flow_note_middles_note_id_idx on public.emotion_flow_note_middles using btree (note_id) TABLESPACE pg_default;

create unique INDEX IF not exists emotion_flow_note_middles_unique_idx on public.emotion_flow_note_middles using btree (flow_id, note_id) TABLESPACE pg_default;
