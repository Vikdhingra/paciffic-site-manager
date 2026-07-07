# Paciffic Site CRM v1.0.0

Construction project CRM for Paciffic Homes — projects, stages, tasks,
daily site diaries, photos, and site-to-office requests.

## Stack
Vite + React · Supabase (relational pm_* tables + RLS) · Netlify

## First-time setup
1. Supabase → SQL Editor → run `setup-database.sql` once.
2. Netlify env vars (already set if reusing the existing site):
   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
3. Push to GitHub → Netlify auto-deploys.

## Roles
- super_admin / admin — dashboard, all projects, team management
- supervisor — Today board with only their assigned projects
