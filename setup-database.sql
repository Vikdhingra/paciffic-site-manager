-- ═══════════════════════════════════════════════════════════════
-- PACIFFIC SITE CRM — DATABASE SETUP (run once)
-- Supabase → SQL Editor → New query → paste everything → Run
--
-- Proper relational schema. Old sc_* tables are left untouched.
-- Uses the existing `profiles` table (id, full_name, email, role).
-- ═══════════════════════════════════════════════════════════════

-- ── PROJECTS ──────────────────────────────────────────────────
create table if not exists pm_projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text default '',
  client text default '',
  status text not null default 'active',        -- active | complete
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── STAGES (ordered build sequence per project) ───────────────
create table if not exists pm_stages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references pm_projects(id) on delete cascade,
  name text not null,
  sort_order int not null,
  status text not null default 'pending',       -- pending | active | complete
  completed_at timestamptz,
  notes text default ''
);
create index if not exists pm_stages_project_idx on pm_stages (project_id, sort_order);

-- ── TASKS ─────────────────────────────────────────────────────
create table if not exists pm_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references pm_projects(id) on delete cascade,
  stage_id uuid not null references pm_stages(id) on delete cascade,
  title text not null,
  priority text not null default 'medium',      -- high | medium | low
  status text not null default 'todo',          -- todo | done
  due_date date,
  done_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists pm_tasks_project_idx on pm_tasks (project_id);
create index if not exists pm_tasks_stage_idx on pm_tasks (stage_id);

-- ── SUPERVISOR ASSIGNMENTS ────────────────────────────────────
create table if not exists pm_assignments (
  project_id uuid not null references pm_projects(id) on delete cascade,
  user_id uuid not null,
  primary key (project_id, user_id)
);
create index if not exists pm_assignments_user_idx on pm_assignments (user_id);

-- ── SITE PHOTOS ───────────────────────────────────────────────
create table if not exists pm_photos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references pm_projects(id) on delete cascade,
  stage_id uuid references pm_stages(id) on delete set null,
  data_url text not null,
  caption text default '',
  archived boolean not null default false,
  taken_at timestamptz default now(),
  created_by uuid
);
create index if not exists pm_photos_project_idx on pm_photos (project_id, taken_at desc);

-- ── DAILY SITE DIARY (one entry per project per day) ──────────
create table if not exists pm_diary (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references pm_projects(id) on delete cascade,
  entry_date date not null,
  supervisor_id uuid,
  supervisor_name text default '',
  weather text default '',
  trades text default '',
  deliveries text default '',
  delays text default '',
  safety text default '',
  summary text default '',
  jobs jsonb not null default '[]',   -- snapshot of the day's planned jobs [{taskId,title,done}]
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (project_id, entry_date)
);
create index if not exists pm_diary_project_idx on pm_diary (project_id, entry_date desc);

-- ── SITE REQUESTS (supervisor → admin support) ────────────────
create table if not exists pm_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references pm_projects(id) on delete cascade,
  title text not null,
  details text default '',
  type text not null default 'other',           -- order | provide | question | other
  priority text not null default 'medium',
  needed_by date,
  status text not null default 'open',          -- open | in_progress | done
  created_by uuid,
  created_by_name text default '',
  admin_note text default '',
  done_by_name text default '',
  done_at timestamptz,
  site_ack boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists pm_requests_project_idx on pm_requests (project_id, created_at desc);
create index if not exists pm_requests_status_idx on pm_requests (status, created_at desc);

-- Helper: is the signed-in user an admin?
create or replace function pm_is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('admin', 'super_admin')
  );
$$;

-- Helper: is the signed-in user assigned to a project?
create or replace function pm_is_assigned(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from pm_assignments
    where project_id = pid and user_id = auth.uid()
  );
$$;

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- Admins: everything. Supervisors: only projects they're assigned to.
-- ═══════════════════════════════════════════════════════════════

alter table pm_projects enable row level security;
alter table pm_stages enable row level security;
alter table pm_tasks enable row level security;
alter table pm_assignments enable row level security;
alter table pm_photos enable row level security;
alter table pm_diary enable row level security;
alter table pm_requests enable row level security;

-- Projects: admins full access; supervisors read their assigned projects
drop policy if exists "projects admin all" on pm_projects;
create policy "projects admin all" on pm_projects for all to authenticated
  using (pm_is_admin()) with check (pm_is_admin());
drop policy if exists "projects assigned read" on pm_projects;
create policy "projects assigned read" on pm_projects for select to authenticated
  using (pm_is_assigned(id));

-- Stages: admins all; supervisors read + update (stage completion) on assigned
drop policy if exists "stages admin all" on pm_stages;
create policy "stages admin all" on pm_stages for all to authenticated
  using (pm_is_admin()) with check (pm_is_admin());
drop policy if exists "stages assigned read" on pm_stages;
create policy "stages assigned read" on pm_stages for select to authenticated
  using (pm_is_assigned(project_id));
drop policy if exists "stages assigned update" on pm_stages;
create policy "stages assigned update" on pm_stages for update to authenticated
  using (pm_is_assigned(project_id));

-- Tasks: admins all; supervisors read/insert/update on assigned
drop policy if exists "tasks admin all" on pm_tasks;
create policy "tasks admin all" on pm_tasks for all to authenticated
  using (pm_is_admin()) with check (pm_is_admin());
drop policy if exists "tasks assigned read" on pm_tasks;
create policy "tasks assigned read" on pm_tasks for select to authenticated
  using (pm_is_assigned(project_id));
drop policy if exists "tasks assigned insert" on pm_tasks;
create policy "tasks assigned insert" on pm_tasks for insert to authenticated
  with check (pm_is_assigned(project_id));
drop policy if exists "tasks assigned update" on pm_tasks;
create policy "tasks assigned update" on pm_tasks for update to authenticated
  using (pm_is_assigned(project_id));

-- Assignments: admins manage; users can read their own
drop policy if exists "assignments admin all" on pm_assignments;
create policy "assignments admin all" on pm_assignments for all to authenticated
  using (pm_is_admin()) with check (pm_is_admin());
drop policy if exists "assignments own read" on pm_assignments;
create policy "assignments own read" on pm_assignments for select to authenticated
  using (user_id = auth.uid());

-- Photos: admins all; supervisors read/insert on assigned
drop policy if exists "photos admin all" on pm_photos;
create policy "photos admin all" on pm_photos for all to authenticated
  using (pm_is_admin()) with check (pm_is_admin());
drop policy if exists "photos assigned read" on pm_photos;
create policy "photos assigned read" on pm_photos for select to authenticated
  using (pm_is_assigned(project_id));
drop policy if exists "photos assigned insert" on pm_photos;
create policy "photos assigned insert" on pm_photos for insert to authenticated
  with check (pm_is_assigned(project_id));

-- Diary: admins all; supervisors read/insert/update on assigned
drop policy if exists "diary admin all" on pm_diary;
create policy "diary admin all" on pm_diary for all to authenticated
  using (pm_is_admin()) with check (pm_is_admin());
drop policy if exists "diary assigned read" on pm_diary;
create policy "diary assigned read" on pm_diary for select to authenticated
  using (pm_is_assigned(project_id));
drop policy if exists "diary assigned insert" on pm_diary;
create policy "diary assigned insert" on pm_diary for insert to authenticated
  with check (pm_is_assigned(project_id));
drop policy if exists "diary assigned update" on pm_diary;
create policy "diary assigned update" on pm_diary for update to authenticated
  using (pm_is_assigned(project_id));

-- Requests: admins all; supervisors read/insert/update on assigned
drop policy if exists "requests admin all" on pm_requests;
create policy "requests admin all" on pm_requests for all to authenticated
  using (pm_is_admin()) with check (pm_is_admin());
drop policy if exists "requests assigned read" on pm_requests;
create policy "requests assigned read" on pm_requests for select to authenticated
  using (pm_is_assigned(project_id));
drop policy if exists "requests assigned insert" on pm_requests;
create policy "requests assigned insert" on pm_requests for insert to authenticated
  with check (pm_is_assigned(project_id));
drop policy if exists "requests assigned update" on pm_requests;
create policy "requests assigned update" on pm_requests for update to authenticated
  using (pm_is_assigned(project_id));

-- Keep updated_at fresh on projects
create or replace function pm_touch_project() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update pm_projects set updated_at = now()
  where id = coalesce(new.project_id, old.project_id);
  return coalesce(new, old);
end;
$$;

drop trigger if exists pm_tasks_touch on pm_tasks;
create trigger pm_tasks_touch after insert or update or delete on pm_tasks
  for each row execute function pm_touch_project();
drop trigger if exists pm_stages_touch on pm_stages;
create trigger pm_stages_touch after update on pm_stages
  for each row execute function pm_touch_project();

-- Metadata table
create table if not exists pm_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references pm_projects(id) on delete cascade,
  name text not null,
  category text default '',
  link_url text default '',
  description text default '',
  size bigint default 0,
  mime text default '',
  storage_path text,
  uploaded_by uuid,
  uploaded_by_name text default '',
  created_at timestamptz default now()
);
create index if not exists pm_files_project_idx on pm_files (project_id, created_at desc);

alter table pm_files enable row level security;

drop policy if exists "files admin all" on pm_files;
create policy "files admin all" on pm_files for all to authenticated
  using (pm_is_admin()) with check (pm_is_admin());
drop policy if exists "files assigned read" on pm_files;
create policy "files assigned read" on pm_files for select to authenticated
  using (pm_is_assigned(project_id));
drop policy if exists "files assigned insert" on pm_files;
create policy "files assigned insert" on pm_files for insert to authenticated
  with check (pm_is_assigned(project_id));

-- Storage bucket for the actual files
insert into storage.buckets (id, name, public)
values ('pm-files', 'pm-files', true)
on conflict (id) do nothing;

drop policy if exists "pm-files auth insert" on storage.objects;
create policy "pm-files auth insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'pm-files');
drop policy if exists "pm-files auth read" on storage.objects;
create policy "pm-files auth read" on storage.objects for select to authenticated
  using (bucket_id = 'pm-files');
drop policy if exists "pm-files auth delete" on storage.objects;
create policy "pm-files auth delete" on storage.objects for delete to authenticated
  using (bucket_id = 'pm-files');

drop policy if exists "files assigned update" on pm_files;
create policy "files assigned update" on pm_files for update to authenticated
  using (pm_is_assigned(project_id));
