import { createClient } from '@supabase/supabase-js'

// Configuration comes from Vite environment variables.
// Set these in Netlify → Site configuration → Environment variables:
//   VITE_SUPABASE_URL
//   VITE_SUPABASE_ANON_KEY
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// True when the build received its Supabase configuration.
export const CONFIG_OK = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

if (!CONFIG_OK) {
  console.error(
    'Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Netlify, then redeploy.'
  )
}

// Use placeholders when unconfigured so the module never throws —
// App.jsx shows a configuration screen instead of a blank page.
export const supabase = createClient(
  SUPABASE_URL || 'https://not-configured.supabase.co',
  SUPABASE_ANON_KEY || 'not-configured',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
)

export const APP_VERSION = 'v3.7.0'
