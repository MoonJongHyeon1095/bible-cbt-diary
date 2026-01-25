-- supabase/migrations/20260117121000_emotion_note_groups_middles_policies.sql
-- 로그인한 사용자가 자신의 그룹/연결만 CRUD 가능

alter table public.emotion_note_groups enable row level security;
alter table public.emotion_note_groups force row level security;

revoke all on table public.emotion_note_groups from anon, authenticated;
grant select, insert, update, delete on table public.emotion_note_groups to authenticated;

alter table public.emotion_note_groups alter column user_id set default auth.uid();

drop policy if exists unrestricted on public.emotion_note_groups;
drop policy if exists emotion_note_groups_select_own on public.emotion_note_groups;
create policy emotion_note_groups_select_own
on public.emotion_note_groups
for select
using (auth.uid() = user_id);

drop policy if exists emotion_note_groups_insert_own on public.emotion_note_groups;
create policy emotion_note_groups_insert_own
on public.emotion_note_groups
for insert
with check (auth.uid() = user_id);

drop policy if exists emotion_note_groups_update_own on public.emotion_note_groups;
create policy emotion_note_groups_update_own
on public.emotion_note_groups
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists emotion_note_groups_delete_own on public.emotion_note_groups;
create policy emotion_note_groups_delete_own
on public.emotion_note_groups
for delete
using (auth.uid() = user_id);

alter table public.emotion_note_middles enable row level security;
alter table public.emotion_note_middles force row level security;

revoke all on table public.emotion_note_middles from anon, authenticated;
grant select, insert, update, delete on table public.emotion_note_middles to authenticated;

drop policy if exists unrestricted on public.emotion_note_middles;
drop policy if exists emotion_note_middles_select_own on public.emotion_note_middles;
create policy emotion_note_middles_select_own
on public.emotion_note_middles
for select
using (
  exists (
    select 1
    from public.emotion_note_groups as groups
    where groups.id = emotion_note_middles.group_id
      and groups.user_id = auth.uid()
  )
);

drop policy if exists emotion_note_middles_insert_own on public.emotion_note_middles;
create policy emotion_note_middles_insert_own
on public.emotion_note_middles
for insert
with check (
  exists (
    select 1
    from public.emotion_note_groups as groups
    where groups.id = emotion_note_middles.group_id
      and groups.user_id = auth.uid()
  )
);

drop policy if exists emotion_note_middles_update_own on public.emotion_note_middles;
create policy emotion_note_middles_update_own
on public.emotion_note_middles
for update
using (
  exists (
    select 1
    from public.emotion_note_groups as groups
    where groups.id = emotion_note_middles.group_id
      and groups.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.emotion_note_groups as groups
    where groups.id = emotion_note_middles.group_id
      and groups.user_id = auth.uid()
  )
);

drop policy if exists emotion_note_middles_delete_own on public.emotion_note_middles;
create policy emotion_note_middles_delete_own
on public.emotion_note_middles
for delete
using (
  exists (
    select 1
    from public.emotion_note_groups as groups
    where groups.id = emotion_note_middles.group_id
      and groups.user_id = auth.uid()
  )
);
