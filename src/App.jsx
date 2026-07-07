import { useAuth } from './hooks/useAuth'
import { useProjects } from './hooks/useProjects'
import { isAdminRole } from './lib/helpers'
import { CONFIG_OK } from './lib/supabase'
import { Splash, Card } from './components/ui'
import Auth from './pages/Auth'
import Shell from './pages/Shell'

function ConfigError() {
  return (
    <div className="auth">
      <Card style={{ maxWidth: 440, width: '100%', padding: 24 }}>
        <div className="overline" style={{ color: 'var(--red)', marginBottom: 4 }}>Configuration needed</div>
        <div className="h1" style={{ marginBottom: 10 }}>App isn't connected yet</div>
        <div style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.65 }}>
          The build is missing its database settings. In Netlify go to
          <b> Site configuration → Environment variables</b>, set
          <b> VITE_SUPABASE_URL</b> and <b>VITE_SUPABASE_ANON_KEY</b>, then trigger a new deploy.
        </div>
      </Card>
    </div>
  )
}

export default function App() {
  const { user, profile, loading } = useAuth()
  const projectsApi = useProjects(!!user)

  if (!CONFIG_OK) return <ConfigError />
  if (!user && !loading) return <Auth />
  if (loading || !profile) return <Splash label="Loading your workspace…" />

  return <Shell user={user} profile={profile} isAdmin={isAdminRole(profile.role)} {...projectsApi} />
}
