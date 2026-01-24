-- supabase/migrations/20260116132100_prayer_note_responses_policies.sql
-- RLS 정책: 로그인한 사용자가 자신의 기도 노트 응답만 CRUD 가능

drop policy if exists prayer_note_responses_select_own on public.prayer_note_responses;
create policy prayer_note_responses_select_own
on public.prayer_note_responses
for select
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.prayer_notes pn
    where pn.id = prayer_note_id
      and pn.user_id = auth.uid()
  )
);

drop policy if exists prayer_note_responses_insert_own on public.prayer_note_responses;
create policy prayer_note_responses_insert_own
on public.prayer_note_responses
for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.prayer_notes pn
    where pn.id = prayer_note_id
      and pn.user_id = auth.uid()
  )
);

drop policy if exists prayer_note_responses_update_own on public.prayer_note_responses;
create policy prayer_note_responses_update_own
on public.prayer_note_responses
for update
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.prayer_notes pn
    where pn.id = prayer_note_id
      and pn.user_id = auth.uid()
  )
)
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.prayer_notes pn
    where pn.id = prayer_note_id
      and pn.user_id = auth.uid()
  )
);

drop policy if exists prayer_note_responses_delete_own on public.prayer_note_responses;
create policy prayer_note_responses_delete_own
on public.prayer_note_responses
for delete
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.prayer_notes pn
    where pn.id = prayer_note_id
      and pn.user_id = auth.uid()
  )
);
