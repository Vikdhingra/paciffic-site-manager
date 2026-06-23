import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { fetchMyProfile } from '../lib/db'

// Manages the logged-in user + their profile.
// Returns { user, profile, loading } where loading stays true
// until BOTH the session and (if logged in) the profile are resolved.
export function useAuth() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    // Get the current session (reads from localStorage, near-instant)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return
      if (session?.user) {
        setUser(session.user)
        // profile loads in its own effect below
      } else {
        setLoading(false)
      }
    })

    // React to login / logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      if (session?.user) {
        setUser(session.user)
      } else {
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  // Load the profile whenever the user changes
  useEffect(() => {
    if (!user) return
    let active = true
    fetchMyProfile(user.id)
      .then((prof) => {
        if (!active) return
        setProfile(
          prof || {
            id: user.id,
            email: user.email,
            full_name: user.email,
            role: 'supervisor',
          }
        )
        setLoading(false)
      })
      .catch(() => {
        if (!active) return
        // On error default to a safe profile so the app still renders
        setProfile({
          id: user.id,
          email: user.email,
          full_name: user.email,
          role: 'supervisor',
        })
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [user])

  return { user, profile, loading, setProfile }
}
