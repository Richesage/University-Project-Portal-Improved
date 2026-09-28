-- ============================================================
-- UniManage — Migration 003: Allow lecturers to read profiles
-- of students who have a supervision request with them.
--
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Without this policy, the PostgREST join
--   student:profiles!supervisor_requests_student_id_fkey(...)
-- silently returns null for any student who doesn't yet have a
-- project row linking them to the lecturer, causing blank names
-- and avatars in the Supervision Requests screen.

create policy "profiles: lecturers read request students"
  on public.profiles for select
  using (
    public.current_role() = 'lecturer' and
    role = 'student' and
    exists (
      select 1 from public.supervisor_requests sr
      where sr.student_id = profiles.id
        and sr.lecturer_id = auth.uid()
    )
  );
