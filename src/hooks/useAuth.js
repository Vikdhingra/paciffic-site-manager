import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { fetchMyProfile } from '../lib/api'

// Single loading flag: no admin/supervisor flicker on boot.
export function useAuth() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let live = true

    const boot = async (session) => {
      const u = session?.user || null
      if (!live) return
      setUser(u)
      if (u) {
        const p = await fetchMyProfile(u.id).catch(() => null)
        if (!live) return
        setProfile(p || { id: u.id, email: u.email, role: 'supervisor', full_name: u.user_metadata?.full_name || '' })
      } else {
        setProfile(null)
      }
      setLoading(false)
    }

    supabase.auth.getSession().then(({ data }) => boot(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => boot(session))
    return () => {
      live = false
      sub.subscription.unsubscribe()
    }
  }, [])

  return { user, profile, loading }
}
