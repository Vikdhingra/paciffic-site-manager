import { useState } from 'react'
import { C } from '../lib/constants'
import { APP_VERSION } from '../lib/supabase'
import { signOut } from '../lib/db'
import { LOGO } from '../logo'
import { computeStats } from '../lib/derive'
import { Card, Btn } from '../components/ui'
import ProjectDetail from './admin/ProjectDetail'

export default function SupervisorApp(props) {
  const { user, profile, projects, save, onSwitchView } = props
  const [openProject, setOpenProject] = useState(null)

  // Supervisors only see projects assigned to them (or all if none assigned yet)
  const myProjects = projects.filter(
    (p) => !p.supervisorId || p.supervisorId === user.id
  )
  const stats = computeStats(myProjects)

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      {/* Header */}
      <div style={{ background: C.navy, padding: '16px 20px', borderBottom: '3px solid ' + C.amber }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src={LOGO} alt="Paciffic Homes" style={{ height: 36 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.amber, letterSpacing: 1 }}>
              SUPERVISOR PORTAL
            </div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 15, color: '#fff' }}>
              {profile.full_name || profile.email}
            </div>
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              color: '#475569',
              background: '#1E3A5F',
              borderRadius: 4,
              padding: '3px 6px',
            }}
          >
            {APP_VERSION}
          </div>
          {onSwitchView && (
            <Btn variant="outline" onClick={onSwitchView} style={{ color: C.amber, borderColor: C.amber + '60' }}>
              ADMIN
            </Btn>
          )}
          <Btn variant="outline" onClick={signOut} style={{ color: '#fff', borderColor: '#ffffff30' }}>
            SIGN OUT
          </Btn>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, marginTop: 16 }}>
          {[
            { label: 'MY PROJECTS', val: myProjects.length, color: '#93C5FD' },
            { label: 'ACTIVE', val: stats.active, color: C.amber },
            { label: 'COMPLETED', val: stats.completed, color: '#6EE7B7' },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: 'center', padding: '10px' }}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 32, color: s.color }}>
                {s.val}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, color: '#64748B', letterSpacing: 1 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px 14px' }}>
        {openProject ? (
          <ProjectDetail {...props} project={openProject} onBack={() => setOpenProject(null)} />
        ) : myProjects.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: 50, color: C.t3 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏗️</div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 18, color: C.t2 }}>
              NO PROJECTS ASSIGNED
            </div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Your admin will assign projects to you.</div>
          </Card>
        ) : (
          myProjects.map((p) => {
            const sc = p.stages?.length || 0
            const pct = sc <= 1 ? 0 : Math.round((p.currentStage / (sc - 1)) * 100)
            const pc = p.color || C.amber
            return (
              <Card
                key={p.id}
                onClick={() => setOpenProject(p)}
                style={{ marginBottom: 12, borderLeft: '5px solid ' + pc, cursor: 'pointer' }}
              >
                <div
                  onClick={() => setOpenProject(p)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 800, fontSize: 20, color: C.t1 }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: 12, color: C.t2 }}>📍 {p.location || '—'}</div>
                    <div style={{ fontSize: 12, color: C.t2, marginTop: 4 }}>
                      {p.stages?.[p.currentStage]?.name}
                    </div>
                  </div>
                  <div
                    style={{
                      background: pc,
                      color: '#fff',
                      borderRadius: 10,
                      padding: '8px 10px',
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 800,
                      fontSize: 18,
                    }}
                  >
                    {pct}%
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
