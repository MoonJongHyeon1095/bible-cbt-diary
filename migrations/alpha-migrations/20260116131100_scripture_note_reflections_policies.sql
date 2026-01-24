-- supabase/migrations/20260116131100_scripture_note_reflections_policies.sql
-- RLS 정책: 로그인한 사용자가 자신의 말씀 노트 묵상만 CRUD 가능

drop policy if exists scripture_note_reflections_select_own on public.scripture_note_reflections;
create policy scripture_note_reflections_select_own
on public.scripture_note_reflections
for select
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.scripture_notes sn
    where sn.id = scripture_note_id
      and sn.user_id = auth.uid()
  )
);

drop policy if exists scripture_note_reflections_insert_own on public.scripture_note_reflections;
create policy scripture_note_reflections_insert_own
on public.scripture_note_reflections
for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.scripture_notes sn
    where sn.id = scripture_note_id
      and sn.user_id = auth.uid()
  )
);

drop policy if exists scripture_note_reflections_update_own on public.scripture_note_reflections;
create policy scripture_note_reflections_update_own
on public.scripture_note_reflections
for update
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.scripture_notes sn
    where sn.id = scripture_note_id
      and sn.user_id = auth.uid()
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.scripture_notes sn
    where sn.id = scripture_note_id
      and sn.user_id = auth.uid()
  )
);

drop policy if exists scripture_note_reflections_delete_own on public.scripture_note_reflections;
create policy scripture_note_reflections_delete_own
on public.scripture_note_reflections
for delete
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.scripture_notes sn
    where sn.id = scripture_note_id
      and sn.user_id = auth.uid()
  )
);
