# Paciffic Homes Site Manager — v3 (Vite + React)

A clean rebuild. No more in-browser Babel, no more emoji-crashes, fast loads,
proper mobile layout. Same Supabase backend and data as before.

## What changed from the old version
- **Pre-compiled** — the browser no longer compiles 2,900 lines of JSX on every load.
  Loads in a fraction of the time.
- **No emoji-in-string crashes** — the whole class of "Script error. Line: 0" bugs is gone.
- **Clean auth + data loading** — one loading splash, no admin/supervisor toggling.
- **Real build pipeline** — every git push auto-deploys via Netlify.
- **Organised code** — small files instead of one 2,900-line monster.

## Backend (unchanged)
- Supabase URL: https://uwlkthiqarhdupvxypnq.supabase.co
- Same tables: `profiles`, `sc_projects`, `sc_photos`, `sc_templates`
- Your existing projects and data load straight in.

---

## HOW TO DEPLOY (GitHub → Netlify, no command line)

### 1. Create the GitHub repo
1. Go to https://github.com/new
2. Name it `paciffic-site-manager`, set to Private, click **Create repository**
3. On the next page click **uploading an existing file**
4. Unzip `paciffic-site-manager.zip` on your computer, then drag **all the files
   and folders inside it** into the upload box (NOT the `node_modules` or `dist`
   folders — those aren't in the zip anyway)
5. Click **Commit changes**

### 2. Connect Netlify
1. Go to https://app.netlify.com → **Add new site → Import an existing project**
2. Choose **GitHub**, authorise, pick `paciffic-site-manager`
3. Netlify auto-detects the settings from `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Click **Deploy**

### 3. Point the domain
1. In the new site → **Domain management → Add a domain**
2. Add `supervisors.paciffic.builders`
3. Since it's on Netlify DNS it auto-configures + SSL.

That's it. From now on, when I give you updated files, you upload them to GitHub
(or I can guide you) and Netlify rebuilds automatically — usually live in ~60 seconds.

---

## Optional: environment variables (more secure)
The Supabase keys are currently baked into the code as fallbacks (fine for an
anon key — it's safe to expose). If you'd rather keep them in Netlify:
1. Netlify → Site configuration → Environment variables
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

---

## What's included in this v3
- Login / signup / forgot-password
- Admin portal: dashboard (stats, reminders, activity, recent projects, notes),
  projects list, create project, project detail (stages, tasks, notes), users page
- Supervisor portal: assigned projects, project detail
- Mobile responsive (sidebar → bottom nav)
- Version stamp in header

## Still to add (from the old backlog)
- Photo gallery + upload (sc_photos wiring)
- Templates editor
- Archive / trash
- Reports
- Per-task supplier / delivery date / action-required fields
- Stage auto-advance when all tasks done

These are straightforward to add now that the foundation is clean — we'll layer
them in one at a time.
