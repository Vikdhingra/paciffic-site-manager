import { createClient } from '@supabase/supabase-js'

const URL = import.meta.env.VITE_SUPABASE_URL
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const CONFIG_OK = Boolean(URL && KEY)

if (!CONFIG_OK) {
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — set them in Netlify and redeploy.')
}

export const supabase = createClient(
  URL || 'https://not-configured.supabase.co',
  KEY || 'not-configured',
  { auth: { persistSession: true, autoRefreshToken: true } }
)

export const APP_VERSION = 'v1.2.0'
