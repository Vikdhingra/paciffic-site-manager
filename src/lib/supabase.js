import { createClient } from '@supabase/supabase-js'

// These come from environment variables in production (Netlify),
// with fallback to the known values for convenience.
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://uwlkthiqarhdupvxypnq.supabase.co'

const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3bGt0aGlxYXJoZHVwdnh5cG5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1MTk1ODcsImV4cCI6MjA5NTA5NTU4N30.irKa_YvMNuxuj7JBt2sJsuZ7s8Xcu20-Tp4OLeE89gI'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

export const APP_VERSION = 'v3.4.0'
