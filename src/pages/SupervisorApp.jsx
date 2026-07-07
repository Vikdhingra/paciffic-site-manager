import { useState, useEffect } from 'react'
import { isAssigned } from '../lib/constants'
import { APP_VERSION } from '../lib/supabase'
import { signOut, fetchTodayDiaryStatus, fetchOpenRequestCounts } from '../lib/db'
import { LOGO } from '../logo'
import { StageRail, projectPct, projectIsDone, EmptyState } from '../components/ui'
import Icon from '../components/icons'
import ProjectDetail from './admin/ProjectDetail'

// Supervisor home = "Today" board: for every assigned project the
// supervisor sees today's diary status, the jobs planned, and one-tap
// routes into the diary or photo gallery.
export default function SupervisorApp(props) {
  const { user, profile, projects, onSwitchView } = props
  const [open, setOpen] = useState(null) // { project, tab }
  const [diaryDone, setDiaryDone] = useState({})
  const [reqCounts, setReqCounts] = useState({})

  const myProjects = projects.filter((p) => isAssigned(p, user.id))
  const activeProjects = myProjects.filter((p) => !projectIsDone(p))
  const ids = myProjects.map((p) => p.id).join(',')

  useEffect(() => {
    if (!myProjects.length || open) return
    const pids = myProjects.map((p) => p.id)
    fetchTodayDiaryStatus(pids).then(setDiaryDone).catch(() => {})
    fetchOpenRequestCounts(pids).then(setReqCounts).catch(() => {})
  }, [ids, open])

  const dateStr = new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })
  const diariesFilled = activeProjects.filter((p) => diaryDone[p.id]).length

  // Open tasks in a project's active stage — today's jobs at a glance.
  const todaysJobs = (p) => {
    const s = p.stages?.[p.currentStage]
    return (s?.tasks || []).filter((t) => t.status !== 'done')
  }

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
        {open ? (
          <div style={{ marginTop: 16 }}>
            <ProjectDetail
              {...props}
              project={open.project}
              initialTab={open.tab}
              onBack={() => setOpen(null)}
            />
          </div>
        ) : (
          <>
            {/* Today summary — overlapping the header */}
            <div className="card" style={{ marginTop: -42, marginBottom: 18, padding: '15px 18px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div className="eyebrow" style={{ marginBottom: 2 }}>{dateStr}</div>
                <div className="h-card" style={{ fontSize: 19 }}>Today on site</div>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <MiniStat val={activeProjects.length} label="Active sites" />
                <MiniStat val={diariesFilled + '/' + activeProjects.length} label="Diaries filled" tint={diariesFilled === activeProjects.length && activeProjects.length > 0 ? 'var(--green)' : 'var(--gold-strong)'} />
              </div>
            </div>

            {myProjects.length === 0 ? (
              <EmptyState icon="hardhat" title="No projects assigned">
                Your admin will assign projects to you — they'll show up here.
              </EmptyState>
            ) : (
              myProjects.map((p) => {
                const pct = projectPct(p)
                const done = projectIsDone(p)
                const jobs = todaysJobs(p)
                const filled = !!diaryDone[p.id]
                return (
                  <div key={p.id} className="card" style={{ marginBottom: 12, padding: 0 }}>
                    {/* Header row — tap opens overview */}
                    <button
                      onClick={() => setOpen({ project: p, tab: 'overview' })}
                      style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', padding: '15px 18px 0' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 4 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: 'var(--disp)', fontWeight: 700, fontSize: 19 }}>{p.name}</div>
                          <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Icon name="pin" size={13} /> {p.location || 'No address'}
                          </div>
                        </div>
                        <div className="num" style={{ fontSize: 22, color: done ? 'var(--green)' : 'var(--navy)' }}>{pct}%</div>
                      </div>
                      <StageRail project={p} style={{ margin: '10px 0 7px' }} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <span style={{ fontFamily: 'var(--disp)', fontWeight: 600, fontSize: 14, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.stages?.[p.currentStage]?.name}
                        </span>
                        {!done && (
                          <span className={['chip', filled ? 'chip-green' : 'chip-gold'].join(' ')}>
                            {filled ? 'Diary done' : 'Diary due'}
                          </span>
                        )}
                      </div>
                    </button>

                    {/* Today's jobs preview */}
                    {!done && jobs.length > 0 && (
                      <div style={{ padding: '0 18px 4px' }}>
                        <div className="eyebrow" style={{ fontSize: 10.5, marginBottom: 4 }}>
                          Jobs today · {jobs.length} open
                        </div>
                        {jobs.slice(0, 3).map((t) => (
                          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', fontSize: 13.5, color: 'var(--ink-2)' }}>
                            <Icon name="clock" size={13} style={{ color: 'var(--gold-strong)' }} /> {t.title}
                          </div>
                        ))}
                        {jobs.length > 3 && (
                          <div style={{ fontSize: 12, color: 'var(--ink-3)', paddingLeft: 21 }}>+{jobs.length - 3} more</div>
                        )}
                      </div>
                    )}

                    {/* Quick actions */}
                    <div style={{ borderTop: '1px solid var(--line)', padding: '9px 12px', display: 'flex', gap: 7, marginTop: 8 }}>
                      {!done && (
                        <button
                          className={['btn', filled ? 'btn-outline' : 'btn-primary', 'btn-sm'].join(' ')}
                          onClick={() => setOpen({ project: p, tab: 'diary' })}
                        >
                          <Icon name="note" size={14} /> {filled ? 'Open diary' : 'Fill diary'}
                        </button>
                      )}
                      <button className="btn btn-outline btn-sm" onClick={() => setOpen({ project: p, tab: 'photos' })}>
                        <Icon name="plus" size={14} /> Photos
                      </button>
                      <button className="btn btn-outline btn-sm" onClick={() => setOpen({ project: p, tab: 'requests' })}>
                        <Icon name="flag" size={14} /> Ask admin{reqCounts[p.id] ? ' (' + reqCounts[p.id] + ')' : ''}
                      </button>
                      <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }} onClick={() => setOpen({ project: p, tab: 'overview' })}>
                        Open
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </>
        )}
      </div>
    </div>
  )
}

function MiniStat({ val, label, tint = 'var(--navy)' }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div className="num" style={{ fontSize: 24, lineHeight: 1, color: tint }}>{val}</div>
      <div className="eyebrow" style={{ fontSize: 10, marginTop: 3 }}>{label}</div>
    </div>
  )
}
