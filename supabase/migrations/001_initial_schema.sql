-- ============================================================
-- UniManage — Initial Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Profiles ─────────────────────────────────────────────────
-- One row per auth.users entry; role determines portal access.
create table public.profiles (
  id             uuid        primary key references auth.users(id) on delete cascade,
  email          text        not null,
  name           text        not null,
  role           text        not null check (role in ('student', 'lecturer', 'admin')),
  department     text,
  matric_number  text        unique,   -- students only
  staff_id       text        unique,   -- lecturers + admins
  specialization text,                 -- lecturers
  capacity       integer     default 5,
  plagiarism_enabled boolean default true,
  created_at     timestamptz default now()
);

-- Auto-create profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, role, department, matric_number, staff_id, specialization)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    new.raw_user_meta_data->>'department',
    new.raw_user_meta_data->>'matric_number',
    new.raw_user_meta_data->>'staff_id',
    new.raw_user_meta_data->>'specialization'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Lookup email by matric/staff ID — used for ID-based login (bypasses RLS)
create or replace function public.get_email_by_identifier(p_identifier text)
returns text language sql security definer set search_path = public as $$
  select email from public.profiles
  where matric_number = p_identifier or staff_id = p_identifier
  limit 1;
$$;

-- ── Topics ───────────────────────────────────────────────────
create table public.topics (
  id               uuid        primary key default uuid_generate_v4(),
  title            text        not null,
  description      text        not null,
  lecturer_id      uuid        not null references public.profiles(id) on delete cascade,
  department       text        not null,
  research_area    text        not null,
  max_students     integer     not null default 1,
  enrolled_students integer    not null default 0,
  status           text        not null default 'pending_approval'
                               check (status in ('available','full','pending_approval','approved','rejected')),
  created_at       timestamptz default now()
);

-- ── Projects ─────────────────────────────────────────────────
-- One active project per student.
create table public.projects (
  id                       uuid        primary key default uuid_generate_v4(),
  student_id               uuid        not null unique references public.profiles(id) on delete cascade,
  topic_id                 uuid        not null references public.topics(id) on delete cascade,
  supervisor_id            uuid        references public.profiles(id),
  status                   text        not null default 'active'
                                       check (status in ('active','completed','suspended')),
  overall_progress         integer     not null default 0 check (overall_progress between 0 and 100),
  supervisor_approval_status text      default 'pending',
  file_url                 text,
  created_at               timestamptz default now()
);

-- ── Milestones ───────────────────────────────────────────────
create table public.milestones (
  id          uuid        primary key default uuid_generate_v4(),
  project_id  uuid        not null references public.projects(id) on delete cascade,
  label       text        not null,
  status      text        not null default 'pending'
                          check (status in ('completed','in_progress','pending')),
  percentage  integer     not null default 0,
  due_date    date
);

-- ── Submissions ──────────────────────────────────────────────
create table public.submissions (
  id            uuid        primary key default uuid_generate_v4(),
  project_id    uuid        not null references public.projects(id) on delete cascade,
  student_id    uuid        not null references public.profiles(id) on delete cascade,
  chapter_label text        not null,
  file_name     text        not null,
  file_url      text        not null,
  file_size     text,
  status        text        not null default 'pending_review'
                            check (status in ('pending_review','reviewed','approved','rejected')),
  feedback      text,
  uploaded_at   timestamptz default now()
);

-- ── Conversations + Messages ──────────────────────────────────
create table public.conversations (
  id          uuid        primary key default uuid_generate_v4(),
  student_id  uuid        not null references public.profiles(id) on delete cascade,
  lecturer_id uuid        not null references public.profiles(id) on delete cascade,
  project_id  uuid        references public.projects(id),
  created_at  timestamptz default now(),
  unique(student_id, lecturer_id)
);

create table public.messages (
  id              uuid        primary key default uuid_generate_v4(),
  conversation_id uuid        not null references public.conversations(id) on delete cascade,
  sender_id       uuid        not null references public.profiles(id) on delete cascade,
  type            text        not null default 'text' check (type in ('text','image','video')),
  content         text        not null,
  media_url       text,
  sent_at         timestamptz default now()
);

-- ── Supervisor Requests ──────────────────────────────────────
create table public.supervisor_requests (
  id          uuid        primary key default uuid_generate_v4(),
  student_id  uuid        not null references public.profiles(id) on delete cascade,
  lecturer_id uuid        not null references public.profiles(id) on delete cascade,
  status      text        not null default 'pending'
                          check (status in ('pending','accepted','rejected')),
  message     text,
  created_at  timestamptz default now()
);

-- ── Notifications ────────────────────────────────────────────
-- user_id = null means broadcast to all admin users.
create table public.notifications (
  id         uuid        primary key default uuid_generate_v4(),
  user_id    uuid        references public.profiles(id) on delete cascade,
  type       text        not null check (type in ('warning','info','success','error')),
  title      text        not null,
  message    text        not null,
  read       boolean     not null default false,
  created_at timestamptz default now()
);

-- ── Broadcasts ───────────────────────────────────────────────
create table public.broadcasts (
  id         uuid        primary key default uuid_generate_v4(),
  sender_id  uuid        not null references public.profiles(id) on delete cascade,
  subject    text        not null,
  body       text        not null,
  audience   text        not null check (audience in ('all_students','my_students','department')),
  created_at timestamptz default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles          enable row level security;
alter table public.topics            enable row level security;
alter table public.projects          enable row level security;
alter table public.milestones        enable row level security;
alter table public.submissions       enable row level security;
alter table public.conversations     enable row level security;
alter table public.messages          enable row level security;
alter table public.supervisor_requests enable row level security;
alter table public.notifications     enable row level security;
alter table public.broadcasts        enable row level security;

-- Helper: current user's role
create or replace function public.current_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

-- ── profiles policies ────────────────────────────────────────
create policy "profiles: own read"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles: lecturers read supervised students"
  on public.profiles for select
  using (
    public.current_role() = 'lecturer' and
    role = 'student' and
    exists (
      select 1 from public.projects p
      where p.student_id = profiles.id and p.supervisor_id = auth.uid()
    )
  );

create policy "profiles: admins read all"
  on public.profiles for select
  using (public.current_role() = 'admin');

create policy "profiles: lecturers readable for topic display"
  on public.profiles for select
  using (role = 'lecturer');

create policy "profiles: own update"
  on public.profiles for update
  using (id = auth.uid());

-- ── topics policies ──────────────────────────────────────────
create policy "topics: authenticated read approved"
  on public.topics for select
  using (auth.uid() is not null and status in ('available','full','approved'));

create policy "topics: lecturer reads own"
  on public.topics for select
  using (lecturer_id = auth.uid());

create policy "topics: admins read all"
  on public.topics for select
  using (public.current_role() = 'admin');

create policy "topics: lecturer insert"
  on public.topics for insert
  with check (lecturer_id = auth.uid() and public.current_role() = 'lecturer');

create policy "topics: lecturer update own"
  on public.topics for update
  using (lecturer_id = auth.uid());

create policy "topics: admin update all"
  on public.topics for update
  using (public.current_role() = 'admin');

-- ── projects policies ────────────────────────────────────────
create policy "projects: student reads own"
  on public.projects for select
  using (student_id = auth.uid());

create policy "projects: supervisor reads assigned"
  on public.projects for select
  using (supervisor_id = auth.uid());

create policy "projects: admins read all"
  on public.projects for select
  using (public.current_role() = 'admin');

create policy "projects: student insert own"
  on public.projects for insert
  with check (student_id = auth.uid() and public.current_role() = 'student');

create policy "projects: supervisor/admin update"
  on public.projects for update
  using (supervisor_id = auth.uid() or public.current_role() = 'admin');

-- ── milestones policies ──────────────────────────────────────
create policy "milestones: project participants"
  on public.milestones for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = milestones.project_id
        and (p.student_id = auth.uid() or p.supervisor_id = auth.uid())
    ) or public.current_role() = 'admin'
  );

create policy "milestones: supervisor/admin write"
  on public.milestones for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = milestones.project_id and p.supervisor_id = auth.uid()
    ) or public.current_role() = 'admin'
  );

-- ── submissions policies ─────────────────────────────────────
create policy "submissions: student reads own"
  on public.submissions for select
  using (student_id = auth.uid());

create policy "submissions: supervisor reads assigned"
  on public.submissions for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = submissions.project_id and p.supervisor_id = auth.uid()
    )
  );

create policy "submissions: admins read all"
  on public.submissions for select
  using (public.current_role() = 'admin');

create policy "submissions: student insert own"
  on public.submissions for insert
  with check (student_id = auth.uid() and public.current_role() = 'student');

create policy "submissions: supervisor update feedback"
  on public.submissions for update
  using (
    exists (
      select 1 from public.projects p
      where p.id = submissions.project_id and p.supervisor_id = auth.uid()
    )
  );

-- ── conversations policies ───────────────────────────────────
create policy "conversations: participant read"
  on public.conversations for select
  using (student_id = auth.uid() or lecturer_id = auth.uid());

create policy "conversations: student/lecturer insert"
  on public.conversations for insert
  with check (student_id = auth.uid() or lecturer_id = auth.uid());

-- ── messages policies ────────────────────────────────────────
create policy "messages: conversation participant read"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.student_id = auth.uid() or c.lecturer_id = auth.uid())
    )
  );

create policy "messages: sender insert"
  on public.messages for insert
  with check (sender_id = auth.uid());

-- ── supervisor_requests policies ─────────────────────────────
create policy "supervisor_requests: involved parties read"
  on public.supervisor_requests for select
  using (student_id = auth.uid() or lecturer_id = auth.uid() or public.current_role() = 'admin');

create policy "supervisor_requests: student insert"
  on public.supervisor_requests for insert
  with check (student_id = auth.uid() and public.current_role() = 'student');

create policy "supervisor_requests: lecturer/admin update"
  on public.supervisor_requests for update
  using (lecturer_id = auth.uid() or public.current_role() = 'admin');

-- ── notifications policies ───────────────────────────────────
create policy "notifications: own or broadcast read"
  on public.notifications for select
  using (user_id = auth.uid() or (user_id is null and public.current_role() = 'admin'));

create policy "notifications: own update (mark read)"
  on public.notifications for update
  using (user_id = auth.uid() or public.current_role() = 'admin');

create policy "notifications: admin insert"
  on public.notifications for insert
  with check (public.current_role() = 'admin');

-- ── broadcasts policies ──────────────────────────────────────
create policy "broadcasts: all authenticated read"
  on public.broadcasts for select
  using (auth.uid() is not null);

create policy "broadcasts: lecturer/admin insert"
  on public.broadcasts for insert
  with check (sender_id = auth.uid() and public.current_role() in ('lecturer','admin'));

-- ============================================================
-- Storage Bucket
-- Run these in the Supabase Dashboard → Storage section,
-- OR execute via the Storage API.
-- Bucket name: project-files  (public = false)
-- ============================================================

-- insert into storage.buckets (id, name, public)
-- values ('project-files', 'project-files', false);

-- create policy "storage: authenticated upload"
--   on storage.objects for insert
--   with check (bucket_id = 'project-files' and auth.uid() is not null);

-- create policy "storage: participant read"
--   on storage.objects for select
--   using (bucket_id = 'project-files' and auth.uid() is not null);
