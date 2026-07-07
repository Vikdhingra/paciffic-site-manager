import { useState } from 'react'
import { isAssigned } from '../lib/constants'
import { APP_VERSION } from '../lib/supabase'
import { signOut } from '../lib/db'
import { LOGO } from '../logo'
import { computeStats } from '../lib/derive'
import { StageRail, projectPct, projectIsDone, taskCounts, EmptyState } from '../components/ui'
import Icon from '../components/icons'
import ProjectDetail from './admin/ProjectDetail'

export default function SupervisorApp(props) {
  const { user, profile, projects, onSwitchView } = props
  const [openProject, setOpenProject] = useState(null)

  const myProjects = projects.filter((p) => isAssigned(p, user.id))
  const stats = computeStats(myProjects)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--paper)' }}>
      {/* Header */}
      <div style={{ background: 'var(--navy)', borderBottom: '3px solid var(--gold)', padding: '14px 18px 58px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, maxWidth: 860, margin: '0 auto' }}>
          <img src={LOGO} alt="Paciffic Homes" style={{ height: 34 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--disp)', fontWeight: 600, fontSize: 11.5, letterSpacing: '0.12em', color: 'var(--gold)', textTransform: 'uppercase' }}>
              Supervisor portal
            </div>
            <div style={{ fontFamily: 'var(--disp)', fontWeight: 700, fontSize: 16, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile.full_name || profile.email}
            </div>
          </div>
          <span className="ver-chip hide-mobile">{APP_VERSION}</span>
          {onSwitchView && (
            <button className="btn btn-onnavy btn-sm" onClick={onSwitchView}>
              <Icon name="swap" size={15} /> Admin
            </button>
          )}
          <button className="btn btn-onnavy btn-sm" onClick={signOut} aria-label="Sign out" style={{ padding: '7px 10px' }}>
            <Icon name="logout" size={16} />
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 14px 40px' }}>
        {/* Stat cards overlapping the header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: -42, marginBottom: 20 }}>
          {[
            { label: 'My projects', val: myProjects.length, icon: 'projects' },
            { label: 'Active', val: stats.active, icon: 'clock' },
            { label: 'Completed', val: stats.completed, icon: 'check' },
          ].map((s) => (
            <div key={s.label} className="card" style={{ padding: '13px 14px', textAlign: 'center' }}>
              <div className="num" style={{ fontSize: 26, lineHeight: 1 }}>{s.val}</div>
              <div className="eyebrow" style={{ marginTop: 4, fontSize: 10.5 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {openProject ? (
          <ProjectDetail {...props} project={openProject} onBack={() => setOpenProject(null)} />
        ) : myProjects.length === 0 ? (
          <EmptyState icon="hardhat" title="No projects assigned">
            Your admin will assign projects to you — they'll show up here.
          </EmptyState>
        ) : (
          myProjects.map((p) => {
            const pct = projectPct(p)
            const done = projectIsDone(p)
            const t = taskCounts(p)
            return (
              <button
                key={p.id}
                onClick={() => setOpenProject(p)}
                className="card card-tap"
                style={{ width: '100%', textAlign: 'left', padding: '16px 18px', marginBottom: 11, border: '1px solid var(--line)' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 4 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--disp)', fontWeight: 700, fontSize: 19 }}>{p.name}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Icon name="pin" size={13} /> {p.location || 'No address'}
                    </div>
                  </div>
                  <div className="num" style={{ fontSize: 23, color: done ? 'var(--green)' : 'var(--navy)' }}>{pct}%</div>
                </div>
                <StageRail project={p} style={{ margin: '11px 0 8px' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: 'var(--disp)', fontWeight: 600, fontSize: 14, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.stages?.[p.currentStage]?.name}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{t.done}/{t.total} tasks</span>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
