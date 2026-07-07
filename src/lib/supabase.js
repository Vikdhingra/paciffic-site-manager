import { createClient } from '@supabase/supabase-js'

// Configuration comes from Vite environment variables.
// Set these in Netlify → Site configuration → Environment variables:
//   VITE_SUPABASE_URL
//   VITE_SUPABASE_ANON_KEY
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Helpful console message if env vars are missing during local dev
  console.error(
    'Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  )
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

export const APP_VERSION = 'v3.5.0'
