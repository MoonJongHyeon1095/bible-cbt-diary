-- supabase/migrations/20260116125100_session_history_policies.sql
-- 로그인한 사용자가 자신의 세션 기록만 CRUD 가능

drop policy if exists session_history_select_own on public.session_history;
create policy session_history_select_own
on public.session_history
for select
using (auth.uid() = user_id);

drop policy if exists session_history_insert_own on public.session_history;
create policy session_history_insert_own
on public.session_history
for insert
with check (auth.uid() = user_id);

drop policy if exists session_history_update_own on public.session_history;
create policy session_history_update_own
on public.session_history
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists session_history_delete_own on public.session_history;
create policy session_history_delete_own
on public.session_history
for delete
using (auth.uid() = user_id);
