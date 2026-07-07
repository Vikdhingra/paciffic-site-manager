import { useState, useEffect } from 'react'
import { APP_VERSION } from '../lib/supabase'
import { signOut, createProject, fetchOpenRequests } from '../lib/api'
import Icon from '../components/icons'
import { Modal, Btn, Input, Field } from '../components/ui'
import SupervisorPicker from '../components/SupervisorPicker'
import Dashboard from './admin/Dashboard'
import Projects from './admin/Projects'
import Users from './admin/Users'
import Today from './site/Today'
import Project from './Project'

export default function Shell(props) {
  const { profile, isAdmin: realAdmin, addLocal } = props
  const [viewAsSup, setViewAsSup] = useState(false)
  const isAdmin = realAdmin && !viewAsSup
  const [nav, setNav] = useState(realAdmin ? 'dashboard' : 'today')
  const [open, setOpen] = useState(null) // { id, tab }
  const [creating, setCreating] = useState(false)
  const [openReqCount, setOpenReqCount] = useState(0)

  useEffect(() => {
    if (!isAdmin) return
    fetchOpenRequests().then((r) => setOpenReqCount(r.length)).catch(() => {})
  }, [isAdmin, nav, open])

  const NAV = isAdmin
    ? [
        { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
        { id: 'projects', label: 'Projects', icon: 'projects' },
        { id: 'users', label: 'Team', icon: 'users' },
      ]
    : [{ id: 'today', label: 'Today', icon: 'clock' }]

  const go = (id) => { setNav(id); setOpen(null) }
  const openProject = (id, tab) => setOpen({ id, tab: tab || 'overview' })
  const toggleView = () => {
    const next = !viewAsSup
    setViewAsSup(next)
    setOpen(null)
    setNav(next ? 'today' : 'dashboard')
  }
  const pageProps = { ...props, isAdmin }

  const page = open ? (
    <Project {...pageProps} projectId={open.id} initialTab={open.tab} onBack={() => setOpen(null)} />
  ) : nav === 'dashboard' ? (
    <Dashboard {...pageProps} onOpenProject={openProject} onGoProjects={() => go('projects')} onNew={() => setCreating(true)} />
  ) : nav === 'projects' ? (
    <Projects {...pageProps} onOpenProject={openProject} onNew={() => setCreating(true)} />
  ) : nav === 'users' ? (
    <Users {...pageProps} />
  ) : (
    <Today {...pageProps} onOpenProject={openProject} />
  )

  return (
    <div className="shell">
      {/* Sidebar (desktop) */}
      <aside className="sidebar">
        <div className="ws">
          <img src="/logo.png" alt="" />
          <div>
            <div className="ws-name">Paciffic</div>
            <div className="ws-sub">Site CRM</div>
          </div>
        </div>

        {isAdmin && (
          <button className="btn btn-outline btn-block" style={{ marginBottom: 12, justifyContent: 'flex-start' }} onClick={() => setCreating(true)}>
            <Icon name="plus" size={15} /> New project
          </button>
        )}

        {NAV.map((n) => (
          <button key={n.id} className={['nav-item', nav === n.id && !open ? 'on' : ''].join(' ')} onClick={() => go(n.id)}>
            <Icon name={n.icon} size={17} />
            {n.label}
            {n.id === 'dashboard' && openReqCount > 0 && <span className="nav-count">{openReqCount}</span>}
          </button>
        ))}

        {realAdmin && (
          <button
            className="nav-item"
            style={viewAsSup ? { background: 'var(--amber-soft)', color: 'var(--amber)' } : {}}
            onClick={toggleView}
            title="Preview exactly what a supervisor sees"
          >
            <Icon name="swap" size={16} />
            {viewAsSup ? 'Back to admin view' : 'View as supervisor'}
          </button>
        )}

        <div className="side-foot">
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '4px 8px 8px' }}>
            <Avatar name={profile.full_name || profile.email} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile.full_name || profile.email}
              </div>
              <div className="sub" style={{ fontSize: 11 }}>{(profile.role || 'supervisor').replace('_', ' ')}</div>
            </div>
            <button className="btn btn-ghost btn-icon" onClick={signOut} title="Sign out">
              <Icon name="logout" size={15} />
            </button>
          </div>
          <div className="sub" style={{ padding: '0 8px', fontSize: 10.5 }}>{APP_VERSION}</div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div className="mobile-top only-m">
          <img src="/logo.png" alt="" style={{ height: 24 }} />
          <div style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>Paciffic Site CRM</div>
          <span className="sub" style={{ fontSize: 10.5 }}>{APP_VERSION}</span>
          <button className="btn btn-ghost btn-icon" onClick={signOut} aria-label="Sign out">
            <Icon name="logout" size={16} />
          </button>
        </div>

        <main className="main">
          <div className="page">
            {viewAsSup && (
              <div style={{ background: 'var(--amber-soft)', border: '1px solid #ecdcb6', color: 'var(--amber)', borderRadius: 'var(--r)', padding: '8px 13px', fontSize: 12.5, marginBottom: 14 }}>
                Previewing the supervisor view. You can see every project — a real supervisor only sees the ones assigned to them.
              </div>
            )}
            {page}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav only-m">
        {NAV.map((n) => (
          <button key={n.id} className={['mnav', nav === n.id && !open ? 'on' : ''].join(' ')} onClick={() => go(n.id)}>
            <Icon name={n.icon} size={20} />
            {n.label}
          </button>
        ))}
        {isAdmin && (
          <button className="mnav" onClick={() => setCreating(true)}>
            <Icon name="plus" size={20} />
            New
          </button>
        )}
        {realAdmin && (
          <button className="mnav" style={viewAsSup ? { color: 'var(--amber)' } : {}} onClick={toggleView}>
            <Icon name="swap" size={20} />
            {viewAsSup ? 'Admin' : 'As site'}
          </button>
        )}
      </nav>

      {creating && (
        <NewProjectModal
          onClose={() => setCreating(false)}
          onCreate={async (draft) => {
            const p = await createProject(draft)
            addLocal(p)
            setCreating(false)
            setNav('projects')
          }}
        />
      )}
    </div>
  )
}

export function Avatar({ name = '?', size = 28 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--accent-soft)', color: 'var(--accent-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.42, fontWeight: 600, flexShrink: 0 }}>
      {(name[0] || '?').toUpperCase()}
    </div>
  )
}

function NewProjectModal({ onClose, onCreate }) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [client, setClient] = useState('')
  const [supervisorIds, setSupervisorIds] = useState([])
  const [seedTasks, setSeedTasks] = useState(true)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const submit = async () => {
    if (!name.trim()) return
    setBusy(true)
    setErr('')
    try {
      await onCreate({ name: name.trim(), address: address.trim(), client: client.trim(), supervisorIds, seedTasks })
    } catch (e) {
      setErr(e.message || 'Could not create the project')
      setBusy(false)
    }
  }

  return (
    <Modal title="New project" onClose={onClose}>
      <Input label="Project name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Lot 531 Wollahra Rise" />
      <Input label="Site address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, suburb" />
      <Input label="Client / builder" value={client} onChange={(e) => setClient(e.target.value)} placeholder="Optional" />
      <Field label="Assign supervisors (optional)">
        <SupervisorPicker value={supervisorIds} onChange={setSupervisorIds} />
      </Field>
      <button
        onClick={() => setSeedTasks(!seedTasks)}
        style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', textAlign: 'left', background: seedTasks ? 'var(--accent-soft)' : 'var(--surface)', border: '1px solid ' + (seedTasks ? 'var(--accent)' : 'var(--line-2)'), borderRadius: 'var(--r)', padding: '9px 11px', cursor: 'pointer', marginBottom: 13 }}
      >
        <span style={{ width: 17, height: 17, borderRadius: 5, flexShrink: 0, border: '1.5px solid ' + (seedTasks ? 'var(--accent)' : 'var(--line-2)'), background: seedTasks ? 'var(--accent)' : '#fff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {seedTasks && <Icon name="check" size={11} stroke={3} />}
        </span>
        <span style={{ fontSize: 13, color: 'var(--ink)' }}>
          Prefill standard task checklists
          <span className="sub" style={{ display: 'block', fontSize: 11.5 }}>~50 starter tasks across the 10 stages — edit or delete any of them later</span>
        </span>
      </button>
      {err && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 10 }}>{err}</div>}
      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        <Btn onClick={submit} disabled={busy || !name.trim()} size="lg" style={{ flex: 1 }}>
          {busy ? 'Creating…' : 'Create project'}
        </Btn>
        <Btn variant="outline" size="lg" onClick={onClose}>Cancel</Btn>
      </div>
    </Modal>
  )
}
