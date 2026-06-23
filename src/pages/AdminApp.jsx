import { useState } from 'react'
import { C } from '../lib/constants'
import { APP_VERSION } from '../lib/supabase'
import { signOut } from '../lib/db'
import { LOGO } from '../logo'
import AdminDashboard from './admin/AdminDashboard'
import ProjectsList from './admin/ProjectsList'
import ProjectDetail from './admin/ProjectDetail'
import UsersPage from './admin/UsersPage'
import { Btn } from '../components/ui'

const NAV = [
  { id: 'dashboard', label: 'DASHBOARD', icon: '📊' },
  { id: 'projects', label: 'PROJECTS', icon: '📁' },
  { id: 'users', label: 'USERS', icon: '⚙️' },
]

export default function AdminApp(props) {
  const { profile, projects, onSwitchView } = props
  const [section, setSection] = useState('dashboard')
  const [openProject, setOpenProject] = useState(null)

  const go = (id) => {
    setSection(id)
    setOpenProject(null)
  }

  const NavButton = ({ n, mobile }) => {
    const active = section === n.id && !openProject
    return (
      <button
        onClick={() => go(n.id)}
        style={{
          flex: mobile ? 1 : 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          padding: mobile ? '8px 4px' : '16px 4px',
          border: 'none',
          background: active && !mobile ? '#152C54' : 'transparent',
          borderLeft: !mobile ? '3px solid ' + (active ? C.amber : 'transparent') : 'none',
          cursor: 'pointer',
          color: active ? C.amber : '#64748B',
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: 9,
          letterSpacing: 0.5,
        }}
      >
        <span style={{ fontSize: mobile ? 20 : 24 }}>{n.icon}</span>
        <span>{n.label}</span>
      </button>
    )
  }

  return (
    <div className="app-shell">
      {/* Sidebar (desktop) */}
      <div className="sidebar">
        {NAV.map((n) => (
          <NavButton key={n.id} n={n} />
        ))}
      </div>

      <div className="content">
        {/* Top bar */}
        <div
          className="topbar"
          style={{
            background: C.navy,
            padding: '14px 22px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            flexWrap: 'wrap',
            borderBottom: '3px solid ' + C.amber,
          }}
        >
          <img src={LOGO} alt="Paciffic Homes" style={{ height: 38 }} />
          <div style={{ flex: 1, minWidth: 120 }}>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                color: C.amber,
                letterSpacing: 1,
              }}
            >
              ADMIN PORTAL
            </div>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: 16,
                color: '#fff',
              }}
            >
              {profile.full_name || profile.email}
            </div>
          </div>
          {onSwitchView && (
            <Btn variant="outline" onClick={onSwitchView} style={{ color: C.blue, borderColor: C.blue + '60' }}>
              👷 SUPERVISOR VIEW
            </Btn>
          )}
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              color: '#94A3B8',
              background: '#1E3A5F',
              borderRadius: 4,
              padding: '3px 8px',
            }}
          >
            {APP_VERSION}
          </div>
          <Btn variant="outline" onClick={signOut} style={{ color: '#fff', borderColor: '#ffffff30' }}>
            Sign out
          </Btn>
        </div>

        {/* Main content */}
        <div className="content-inner" style={{ padding: '22px 26px' }}>
          {openProject ? (
            <ProjectDetail
              {...props}
              project={openProject}
              onBack={() => setOpenProject(null)}
            />
          ) : section === 'dashboard' ? (
            <AdminDashboard {...props} onOpenProject={setOpenProject} onGoProjects={() => go('projects')} />
          ) : section === 'projects' ? (
            <ProjectsList {...props} onOpenProject={setOpenProject} />
          ) : section === 'users' ? (
            <UsersPage {...props} />
          ) : null}
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="mobile-nav">
        {NAV.map((n) => (
          <NavButton key={n.id} n={n} mobile />
        ))}
      </div>
    </div>
  )
}
