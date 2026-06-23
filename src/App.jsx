import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useProjects } from './hooks/useProjects'
import { isAdminRole } from './lib/constants'
import { FullSplash } from './components/ui'
import AuthScreen from './pages/AuthScreen'
import AdminApp from './pages/AdminApp'
import SupervisorApp from './pages/SupervisorApp'

export default function App() {
  const { user, profile, loading } = useAuth()
  const [forceSupervisor, setForceSupervisor] = useState(false)

  // Projects load only once we have a logged-in user
  const projectsApi = useProjects(!!user)

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
