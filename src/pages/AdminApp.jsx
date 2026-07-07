import { useState } from 'react'
import { APP_VERSION } from '../lib/supabase'
import { signOut } from '../lib/db'
import { LOGO } from '../logo'
import Icon from '../components/icons'
import NewProjectModal from '../components/NewProjectModal'
import AdminDashboard from './admin/AdminDashboard'
import ProjectsList from './admin/ProjectsList'
import ProjectDetail from './admin/ProjectDetail'
import UsersPage from './admin/UsersPage'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'projects', label: 'Projects', icon: 'projects' },
  { id: 'users', label: 'Users', icon: 'users' },
]

export default function AdminApp(props) {
  const { profile, save, onSwitchView } = props
  const [section, setSection] = useState('dashboard')
  const [openProject, setOpenProject] = useState(null)
  const [creating, setCreating] = useState(false)

  const go = (id) => {
    setSection(id)
    setOpenProject(null)
  }

  const openNew = () => setCreating(true)

  return (
    <div className="app-shell">
      {/* Sidebar (desktop) */}
      <nav className="sidebar">
        <div className="side-logo">
          <img src={LOGO} alt="Paciffic Homes" style={{ height: 34 }} />
        </div>
        {NAV.map((n) => (
          <button
            key={n.id}
            className={['side-btn', section === n.id && !openProject ? 'on' : ''].join(' ')}
            onClick={() => go(n.id)}
          >
            <Icon name={n.icon} size={22} />
            <span>{n.label}</span>
          </button>
        ))}
        <div className="side-spacer" />
        <button className="side-btn" onClick={signOut} title="Sign out">
          <Icon name="logout" size={21} />
          <span>Sign out</span>
        </button>
      </nav>

      <div className="content">
        {/* Top bar */}
        <header className="topbar">
          <img src={LOGO} alt="" className="only-mobile" style={{ height: 30 }} />
          <div className="topbar-title" style={{ flex: 1, minWidth: 0 }}>
            <div className="b">Paciffic Homes</div>
            <div className="a">Site Manager</div>
          </div>
          <button className="btn btn-primary btn-sm hide-mobile" onClick={openNew}>
            <Icon name="plus" size={15} /> New project
          </button>
          {onSwitchView && (
            <button className="btn btn-onnavy btn-sm" onClick={onSwitchView} title="Switch to supervisor view">
              <Icon name="hardhat" size={15} /> <span className="hide-mobile">Supervisor</span>
            </button>
          )}
          <span className="ver-chip hide-mobile">{APP_VERSION}</span>
          <button className="btn btn-onnavy btn-sm only-mobile" onClick={signOut} title="Sign out" style={{ padding: '7px 9px' }}>
            <Icon name="logout" size={16} />
          </button>
        </header>

        {/* Main content */}
        <main className="content-inner">
          {openProject ? (
            <ProjectDetail {...props} project={openProject} onBack={() => setOpenProject(null)} />
          ) : section === 'dashboard' ? (
            <AdminDashboard
              {...props}
              onOpenProject={setOpenProject}
              onGoProjects={() => go('projects')}
              onNewProject={openNew}
            />
          ) : section === 'projects' ? (
            <ProjectsList {...props} onOpenProject={setOpenProject} onNewProject={openNew} />
          ) : section === 'users' ? (
            <UsersPage {...props} />
          ) : null}
        </main>
      </div>

      {/* Mobile bottom nav with centre FAB */}
      <nav className="mobile-nav">
        {NAV.slice(0, 2).map((n) => (
          <button key={n.id} className={['mnav-btn', section === n.id && !openProject ? 'on' : ''].join(' ')} onClick={() => go(n.id)}>
            <Icon name={n.icon} size={21} />
            <span>{n.label}</span>
          </button>
        ))}
        <button className="fab" onClick={openNew} aria-label="New project">
          <Icon name="plus" size={24} stroke={2.4} />
        </button>
        <button className={['mnav-btn', section === 'users' && !openProject ? 'on' : ''].join(' ')} onClick={() => go('users')}>
          <Icon name="users" size={21} />
          <span>Users</span>
        </button>
        <button className="mnav-btn" onClick={onSwitchView || (() => {})} style={{ opacity: onSwitchView ? 1 : 0.35 }}>
          <Icon name="hardhat" size={21} />
          <span>Site view</span>
        </button>
      </nav>

      {creating && (
        <NewProjectModal
          onClose={() => setCreating(false)}
          onCreate={async (p) => {
            await save(p)
            setSection('projects')
          }}
        />
      )}
    </div>
  )
}
