-- supabase/migrations/20260116124100_emotion_notes_policies.sql
-- 로그인한 사용자가 자신의 감정 노트만 CRUD 가능

drop policy if exists emotion_notes_select_own on public.emotion_notes;
create policy emotion_notes_select_own
on public.emotion_notes
for select
using (auth.uid() = user_id);

drop policy if exists emotion_notes_insert_own on public.emotion_notes;
create policy emotion_notes_insert_own
on public.emotion_notes
for insert
with check (auth.uid() = user_id);

drop policy if exists emotion_notes_update_own on public.emotion_notes;
create policy emotion_notes_update_own
on public.emotion_notes
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists emotion_notes_delete_own on public.emotion_notes;
create policy emotion_notes_delete_own
on public.emotion_notes
for delete
using (auth.uid() = user_id);
