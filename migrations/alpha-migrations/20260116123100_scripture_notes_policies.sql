-- supabase/migrations/20260116123100_scripture_notes_policies.sql
-- 로그인한 사용자가 자신의 말씀 노트만 CRUD 가능

drop policy if exists scripture_notes_select_own on public.scripture_notes;
create policy scripture_notes_select_own
on public.scripture_notes
for select
using (auth.uid() = user_id);

drop policy if exists scripture_notes_insert_own on public.scripture_notes;
create policy scripture_notes_insert_own
on public.scripture_notes
for insert
with check (auth.uid() = user_id);

drop policy if exists scripture_notes_update_own on public.scripture_notes;
create policy scripture_notes_update_own
on public.scripture_notes
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists scripture_notes_delete_own on public.scripture_notes;
create policy scripture_notes_delete_own
on public.scripture_notes
for delete
using (auth.uid() = user_id);
