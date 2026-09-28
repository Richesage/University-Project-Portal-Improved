-- ============================================================
-- UniManage — Migration 002: Additional columns and RPC functions
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── Profiles: extended lecturer fields ───────────────────────
alter table public.profiles
  add column if not exists bio            text,
  add column if not exists title          text,
  add column if not exists awards         text[]  default '{}',
  add column if not exists certifications text[]  default '{}',
  add column if not exists specializations text[] default '{}',
  add column if not exists allow_students_see_capacity  boolean default true,
  add column if not exists require_plagiarism_check     boolean default true,
  add column if not exists plagiarism_threshold         integer default 20,
  add column if not exists avatar_url     text;

-- ── Topics: support student proposals ────────────────────────
-- Make lecturer_id nullable so students can propose topics
-- without requiring a lecturer assigned upfront.
alter table public.topics
  alter column lecturer_id drop not null,
  add column if not exists proposed_by uuid references public.profiles(id),
  add column if not exists admin_note  text;

-- ── Supervisor requests: richer fields ───────────────────────
alter table public.supervisor_requests
  add column if not exists topic_interest   text,
  add column if not exists deny_reason      text,
  add column if not exists admin_note       text,
  add column if not exists resolution_type  text check (resolution_type in ('special_approval','recommend_alternative') or resolution_type is null),
  add column if not exists resolved_at      timestamptz;

-- ── RPC: increment enrolled students and mark full ───────────
create or replace function public.increment_enrolled_students(topic_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.topics
    set enrolled_students = enrolled_students + 1
  where id = topic_id;

  update public.topics
    set status = 'full'
  where id = topic_id and enrolled_students >= max_students;
end;
$$;

-- ── RLS addendum: supervisor requests for admins ─────────────
-- Admins need to see all denied requests for resolution
drop policy if exists "supervisor_requests: involved parties read" on public.supervisor_requests;

create policy "supervisor_requests: involved parties read"
  on public.supervisor_requests for select
  using (
    student_id  = auth.uid() or
    lecturer_id = auth.uid() or
    public.current_role() = 'admin'
  );

-- ── RLS addendum: students can propose topics ─────────────────
create policy "topics: student propose"
  on public.topics for insert
  with check (
    public.current_role() = 'student' and
    lecturer_id is null and
    proposed_by = auth.uid()
  );

-- ── Notifications: lecturers and students can read their own ─
drop policy if exists "notifications: own or broadcast read" on public.notifications;

create policy "notifications: own or broadcast read"
  on public.notifications for select
  using (
    user_id = auth.uid() or
    (user_id is null and public.current_role() in ('admin','lecturer','student'))
  );

-- ── Broadcasts: all authenticated users can read ─────────────
-- (already covered but ensure it exists)
