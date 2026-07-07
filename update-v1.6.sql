-- ═══════════════════════════════════════════════════════════
-- PACIFFIC SUPERVISORS — v1.6 UPDATE (run once in Supabase SQL Editor)
-- Project files: categories, external links, descriptions
-- (Run update-v1.5.sql first if you haven't yet.)
-- ═══════════════════════════════════════════════════════════
alter table pm_files add column if not exists category text default '';
alter table pm_files add column if not exists link_url text default '';
alter table pm_files add column if not exists description text default '';
alter table pm_files alter column storage_path drop not null;

drop policy if exists "files assigned update" on pm_files;
create policy "files assigned update" on pm_files for update to authenticated
  using (pm_is_assigned(project_id));
