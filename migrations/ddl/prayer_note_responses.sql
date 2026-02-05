create table public.prayer_note_responses (
  id bigserial not null,
  user_id uuid not null default auth.uid (),
  prayer_note_id bigint not null,
  content text not null,
  created_at timestamp with time zone not null default now(),
  constraint prayer_note_responses_pkey primary key (id),
  constraint prayer_note_responses_prayer_note_id_fkey foreign KEY (prayer_note_id) references prayer_notes (id) on delete CASCADE,
  constraint prayer_note_responses_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists prayer_note_responses_note_id_idx on public.prayer_note_responses using btree (prayer_note_id) TABLESPACE pg_default;