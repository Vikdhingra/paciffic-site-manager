# Paciffic Homes Site Manager — Vite + React

This is the rebuilt version of the Site Manager. Same app, same Supabase backend,
same UI — but it now compiles with a **real build step** instead of in-browser Babel.

**What changed vs the old single HTML file:**
- No more in-browser Babel → loads are fast (no 1–3s recompile on every page load).
- The "emoji in single-quoted string crashes the whole app" bug is **gone permanently.**
  (All 71 emoji string literals were converted to double-quotes, and the build
  toolchain handles them regardless.)
- Deploys happen automatically from GitHub — no more drag-and-drop.
- A JSX typo now fails the **build** with a real line number instead of white-screening
  your live site.

Your Supabase URL, anon key, tables, and roles are **unchanged.** Nothing on the
database side needs to be touched.

---

## ONE-TIME SETUP (browser only — no terminal needed)

### Step 1 — Put this project on GitHub
1. Go to https://github.com and sign in (or create a free account).
2. Click the **+** in the top-right → **New repository.**
3. Name it `paciffic-site-manager`. Leave it **Private.** Click **Create repository.**
4. On the next page, click **"uploading an existing file"** (a link in the middle).
5. Drag in **all** the files and the `src` folder from this project
   (`index.html`, `package.json`, `vite.config.js`, `netlify.toml`, `.gitignore`,
   and the whole `src/` folder).  **Do NOT upload `node_modules` or `dist`** —
   they aren't here and shouldn't be.
6. Click **Commit changes.**

### Step 2 — Connect GitHub to Netlify
1. Go to https://app.netlify.com and sign in.
2. **Add new site → Import an existing project.**
3. Choose **GitHub**, authorize it, and pick your `paciffic-site-manager` repo.
4. Netlify auto-detects Vite. Confirm these settings (they should already be filled in
   from `netlify.toml`):
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Click **Deploy.** First build takes ~1 minute. When it's green, you'll get a
   temporary `*.netlify.app` URL — test it there first.

### Step 3 — Point your domain at the new site
1. In the new site: **Domain management → Add a domain →** `supervisors.paciffic.builders`.
2. Since the domain is already on Netlify DNS, it'll attach and re-issue SSL automatically.
   (If it complains the domain is in use by the old site, remove it from the OLD site's
   domain settings first, then add it here.)

**That's the whole one-time setup.** From now on, every change auto-deploys.

---

## THE NEW WORKFLOW (how we work together going forward)

When Claude makes a change:
1. Claude gives you the updated file(s).
2. In your GitHub repo, open the file → pencil **(Edit)** icon → paste the new content →
   **Commit changes.** (Or use "Add file → Upload files" to replace.)
3. Netlify rebuilds and redeploys automatically in ~30–60s.
4. Refresh `supervisors.paciffic.builders`. Done. No dragging, no manual deploy.

If a change has a typo, the Netlify build goes **red** and the live site stays on the
last working version — it can't white-screen anymore. You just paste the error back to
Claude.

---

## VERSION STAMP
Still lives in `src/App.jsx` as `const APP_VERSION`. Bump it on every change and tell
Vikkas the number, same as before.

---

## RUNNING IT LOCALLY (optional — only if you ever install Node)
```
npm install
npm run dev      # local preview at http://localhost:5173
npm run build    # produces the dist/ folder Netlify makes
```
You do **not** need to do this. Netlify runs the build for you in the cloud.
