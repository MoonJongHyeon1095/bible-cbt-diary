create index if not exists emotion_notes_user_id_created_at_idx
  on public.emotion_notes using btree (user_id, created_at desc);

create index if not exists emotion_behavior_details_user_id_created_at_auto_idx
  on public.emotion_behavior_details using btree (user_id, created_at)
  where is_pinned = false;

create or replace function public.get_behavior_suggestion_note_candidates(
  p_last_sign_in_since timestamptz,
  p_day_start timestamptz,
  p_day_end timestamptz
)
returns table (
  id bigint,
  user_id uuid,
  title text,
  trigger_text text,
  inner_belief text,
  alternative text,
  error_label text,
  emotion_tags text[],
  emotion_type text,
  created_at timestamptz
)
language sql
security definer
set search_path = public, auth
as $$
  with recent_users as (
    select u.id
    from auth.users u
    where u.last_sign_in_at is not null
      and u.last_sign_in_at >= p_last_sign_in_since
  ),
  latest_negative_notes as (
    select
      n.id,
      n.user_id,
      n.title,
      n.trigger_text,
      n.inner_belief,
      n.alternative,
      n.error_label,
      n.emotion_tags,
      n.emotion_type,
      n.created_at,
      row_number() over (
        partition by n.user_id
        order by n.created_at desc, n.id desc
      ) as rn
    from public.emotion_notes n
    inner join recent_users u
      on u.id = n.user_id
    where coalesce(n.emotion_type, 'negative') <> 'positive'
  )
  select
    n.id,
    n.user_id,
    n.title,
    n.trigger_text,
    n.inner_belief,
    n.alternative,
    n.error_label,
    n.emotion_tags,
    n.emotion_type,
    n.created_at
  from latest_negative_notes n
  where n.rn = 1
    and not exists (
      select 1
      from public.emotion_behavior_details d
      where d.user_id = n.user_id
        and d.is_pinned = false
        and d.created_at >= p_day_start
        and d.created_at < p_day_end
    );
$$;
