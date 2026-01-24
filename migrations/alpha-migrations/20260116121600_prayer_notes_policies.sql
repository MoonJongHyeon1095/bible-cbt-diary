-- supabase/migrations/20260116121600_prayer_notes_policies.sql
-- RLS 정책: 로그인한 사용자가 자신의 기도 노트만 CRUD 가능

drop policy if exists prayer_notes_select_own on public.prayer_notes;
create policy prayer_notes_select_own
on public.prayer_notes
for select
using (auth.uid() = user_id);

drop policy if exists prayer_notes_insert_own on public.prayer_notes;
create policy prayer_notes_insert_own
on public.prayer_notes
for insert
with check (auth.uid() = user_id);

drop policy if exists prayer_notes_update_own on public.prayer_notes;
create policy prayer_notes_update_own
on public.prayer_notes
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists prayer_notes_delete_own on public.prayer_notes;
create policy prayer_notes_delete_own
on public.prayer_notes
for delete
using (auth.uid() = user_id);
