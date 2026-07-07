-- ═══════════════════════════════════════════════════════════
-- PACIFFIC SITE MANAGER — Site requests table (run once)
-- Supabase → SQL Editor → New query → paste → Run
-- ═══════════════════════════════════════════════════════════

create table if not exists sc_requests (
  id text primary key,
  project_id text not null,
  title text not null,
  details text default '',
  type text default 'other',            -- order | provide | question | other
  priority text default 'medium',       -- high | medium | low
  needed_by date,
  status text default 'open',           -- open | in_progress | done
  created_by uuid,
  created_by_name text default '',
  admin_note text default '',
  done_by_name text default '',
  done_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists sc_requests_project_idx on sc_requests (project_id, created_at desc);
create index if not exists sc_requests_status_idx on sc_requests (status, created_at desc);

alter table sc_requests enable row level security;

drop policy if exists "requests read" on sc_requests;
create policy "requests read" on sc_requests for select to authenticated using (true);

drop policy if exists "requests insert" on sc_requests;
create policy "requests insert" on sc_requests for insert to authenticated with check (true);

drop policy if exists "requests update" on sc_requests;
create policy "requests update" on sc_requests for update to authenticated using (true);

drop policy if exists "requests delete" on sc_requests;
create policy "requests delete" on sc_requests for delete to authenticated using (true);
