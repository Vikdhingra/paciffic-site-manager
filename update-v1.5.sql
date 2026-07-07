-- ═══════════════════════════════════════════════════════════
-- PACIFFIC SUPERVISORS — v1.5 UPDATE (run once in Supabase SQL Editor)
-- Adds: project file attachments (plans, permits, contracts, etc.)
-- ═══════════════════════════════════════════════════════════

-- Metadata table
create table if not exists pm_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references pm_projects(id) on delete cascade,
  name text not null,
  size bigint default 0,
  mime text default '',
  storage_path text not null,
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
