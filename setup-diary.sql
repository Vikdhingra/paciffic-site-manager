-- ═══════════════════════════════════════════════════════════
-- PACIFFIC SITE MANAGER — Daily site diary table (run once)
-- Supabase → SQL Editor → New query → paste → Run
-- ═══════════════════════════════════════════════════════════

create table if not exists sc_diary (
  id text primary key,
  project_id text not null,
  entry_date date not null,
  supervisor_id uuid,
  supervisor_name text default '',
  data jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (project_id, entry_date)
);

create index if not exists sc_diary_project_idx on sc_diary (project_id, entry_date desc);

alter table sc_diary enable row level security;

-- Any signed-in user (supervisor/admin) can read and write diaries,
-- matching how sc_projects and sc_photos work.
drop policy if exists "diary read" on sc_diary;
create policy "diary read" on sc_diary for select to authenticated using (true);

drop policy if exists "diary insert" on sc_diary;
create policy "diary insert" on sc_diary for insert to authenticated with check (true);

drop policy if exists "diary update" on sc_diary;
create policy "diary update" on sc_diary for update to authenticated using (true);

drop policy if exists "diary delete" on sc_diary;
create policy "diary delete" on sc_diary for delete to authenticated using (true);
