import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useProjects } from './hooks/useProjects'
import { isAdminRole } from './lib/constants'
import { CONFIG_OK } from './lib/supabase'
import { FullSplash } from './components/ui'
import AuthScreen from './pages/AuthScreen'
import AdminApp from './pages/AdminApp'
import SupervisorApp from './pages/SupervisorApp'

function ConfigError() {
  return (
    <div className="auth-wrap">
      <div className="card" style={{ width: '100%', maxWidth: 460, padding: '28px 26px' }}>
        <div className="eyebrow" style={{ color: 'var(--red)', marginBottom: 4 }}>Configuration needed</div>
        <div className="h-page" style={{ fontSize: 22, marginBottom: 12 }}>App isn't connected yet</div>
        <div style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.65 }}>
          The build is missing its database settings. In Netlify go to
          <b> Site configuration → Environment variables</b> and make sure
          <b> VITE_SUPABASE_URL</b> and <b>VITE_SUPABASE_ANON_KEY</b> are set
          (values are in the project README), then trigger a new deploy —
          env changes only apply on the next build.
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const { user, profile, loading } = useAuth()
  const [forceSupervisor, setForceSupervisor] = useState(false)

  // Projects load only once we have a logged-in user
  const projectsApi = useProjects(!!user)

  // Build was deployed without Supabase env vars — show instructions, not a blank page.
  if (!CONFIG_OK) return <ConfigError />

  // Not logged in
  if (!user && !loading) return <AuthScreen />

  // Logged in but profile / data still loading → single splash, no flicker
  if (loading || !profile) return <FullSplash label="Loading your workspace…" />

  const admin = isAdminRole(profile.role)
  // Admins see the admin portal unless they tap "Supervisor View"
  const showAdmin = admin && !forceSupervisor

  const shared = {
    user,
    profile,
    ...projectsApi,
    isAdmin: admin,
  }

  if (showAdmin) {
    return <AdminApp {...shared} onSwitchView={() => setForceSupervisor(true)} />
  }
  return (
    <SupervisorApp
      {...shared}
      onSwitchView={admin ? () => setForceSupervisor(false) : null}
    />
  )
}
