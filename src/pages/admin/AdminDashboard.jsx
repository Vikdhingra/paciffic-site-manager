import { useState, useEffect } from 'react'
import { computeStats, buildReminders, buildNotes } from '../../lib/derive'
import { fmtDateShort, timeAgo } from '../../lib/constants'
import { fetchOpenRequests, updateRequest } from '../../lib/db'
import { Card, Spinner, StageRail, projectPct, projectIsDone, taskCounts, EmptyState, Eyebrow } from '../../components/ui'
import Icon from '../../components/icons'
import { RequestCard } from '../project/RequestsTab'

export default function AdminDashboard({ projects, loaded, error, save, onOpenProject, onGoProjects, onNewProject }) {
  const [busyTask, setBusyTask] = useState(null)
  const [requests, setRequests] = useState([])

  useEffect(() => {
    fetchOpenRequests().then(setRequests).catch(() => {})
  }, [])

  const patchRequest = async (id, changes) => {
    try {
      const updated = await updateRequest(id, changes)
      setRequests((rs) => (updated.status === 'done' ? rs.filter((r) => r.id !== id) : rs.map((r) => (r.id === id ? updated : r))))
    } catch (e) {
      alert(e.message)
    }
  }

  const projectById = {}
  projects.forEach((p) => (projectById[p.id] = p))

  const stats = computeStats(projects)
  const reminders = buildReminders(projects).slice(0, 8)
  const notes = buildNotes(projects).slice(0, 5)
  const recent = [...projects]
    .sort((a, b) => new Date(b._updated || b.createdAt) - new Date(a._updated || a.createdAt))
    .slice(0, 6)

  const dateStr = new Date().toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  // One-tap: mark a task done straight from the dashboard.
  const completeTask = async (item) => {
    setBusyTask(item.id)
    const p = item.proj
    const stages = p.stages.map((s) =>
      s.id === item.stage.id
        ? {
            ...s,
            tasks: s.tasks.map((t) =>
              t.id === item.task.id ? { ...t, status: 'done', doneAt: new Date().toISOString() } : t
            ),
          }
        : s
    )
    await save({ ...p, stages })
    setBusyTask(null)
  }

  const kpis = [
    { label: 'Projects', val: stats.total, icon: 'projects', tint: 'var(--navy)' },
    { label: 'Active', val: stats.active, icon: 'clock', tint: 'var(--gold-strong)' },
    { label: 'Completed', val: stats.completed, icon: 'check', tint: 'var(--green)' },
    { label: 'Tasks done', val: stats.doneTasks + '/' + stats.allTasks, icon: 'flag', tint: 'var(--blue)' },
  ]

  return (
    <div className="rise">
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginBottom: 18 }}>
        <div style={{ flex: 1 }}>
          <Eyebrow style={{ marginBottom: 3 }}>{dateStr}</Eyebrow>
          <h1 className="h-page">Dashboard</h1>
        </div>
        <button className="btn btn-primary only-mobile btn-sm" onClick={onNewProject}>
          <Icon name="plus" size={15} /> Project
        </button>
      </div>

      {!loaded && (
        <div className="card" style={{ padding: '10px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--ink-2)' }}>
          <Spinner size={15} /> Syncing latest data…
        </div>
      )}
      {error && (
        <div className="card" style={{ padding: '12px 16px', marginBottom: 14, borderColor: '#f0cdc5', background: 'var(--red-soft)', color: 'var(--red)', fontSize: 13.5 }}>
          {error}
        </div>
      )}

      {/* KPI strip */}
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        {kpis.map((k) => (
          <button
            key={k.label}
            className="card card-tap"
            onClick={onGoProjects}
            style={{ padding: '16px 16px', textAlign: 'left', display: 'flex', gap: 13, alignItems: 'center', border: '1px solid var(--line)' }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 11,
                background: 'var(--paper)',
                border: '1px solid var(--line)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: k.tint,
              }}
            >
              <Icon name={k.icon} size={21} />
            </div>
            <div>
              <div className="num" style={{ fontSize: 26, lineHeight: 1, color: 'var(--ink)' }}>{k.val}</div>
              <div className="eyebrow" style={{ marginTop: 3 }}>{k.label}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Admin support — requests from site pop here first */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
        <Icon name="flag" size={18} style={{ color: 'var(--red)' }} />
        <div className="h-card">Admin support — from site</div>
        {requests.length > 0 && <span className="chip chip-red">{requests.length}</span>}
      </div>
      {requests.length === 0 ? (
        <Card style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--ink-3)', fontSize: 13.5, marginBottom: 26, padding: '14px 18px' }}>
          <Icon name="check" size={17} style={{ color: 'var(--green)' }} /> No open requests from supervisors.
        </Card>
      ) : (
        <div className="grid-cards" style={{ marginBottom: 8 }}>
          {requests.map((r) => (
            <div key={r.id}>
              <RequestCard
                r={r}
                projectName={projectById[r.project_id]?.name || 'Project'}
                isAdmin
                showProject
                onPatch={patchRequest}
              />
              {projectById[r.project_id] && (
                <button className="btn btn-ghost btn-sm" style={{ marginTop: -4, marginBottom: 8 }} onClick={() => onOpenProject(projectById[r.project_id])}>
                  Open {projectById[r.project_id].name}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      <div style={{ height: 14 }} />

      {/* Needs attention — actionable */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
        <Icon name="bell" size={18} style={{ color: 'var(--gold-strong)' }} />
        <div className="h-card">Needs attention</div>
        {reminders.length > 0 && <span className="chip chip-gold">{reminders.length}</span>}
      </div>

      {reminders.length === 0 ? (
        <Card style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--green)', fontSize: 14, marginBottom: 26, padding: '15px 18px' }}>
          <Icon name="check" size={18} /> All clear — no open or overdue tasks.
        </Card>
      ) : (
        <div className="grid-cards" style={{ marginBottom: 26 }}>
          {reminders.map((r) => (
            <div key={r.id} className="card" style={{ padding: '15px 16px' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <span className={['chip', r.priority === 'high' ? 'chip-red' : r.priority === 'low' ? 'chip-green' : 'chip-gold'].join(' ')}>
                  {(r.priority || 'medium') + ' priority'}
                </span>
                {r.dueDate && (
                  <span className="chip">
                    <Icon name="clock" size={12} /> {fmtDateShort(r.dueDate)}
                  </span>
                )}
              </div>
              <div style={{ fontFamily: 'var(--disp)', fontWeight: 700, fontSize: 17, lineHeight: 1.25, marginBottom: 4 }}>
                {r.desc}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginBottom: 12 }}>{r.project}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-green btn-sm"
                  disabled={busyTask === r.id}
                  onClick={() => completeTask(r)}
                >
                  <Icon name="check" size={14} /> {busyTask === r.id ? 'Saving…' : 'Mark done'}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => onOpenProject(r.proj)}>
                  Open project
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent projects + site notes */}
      <div className="grid-2col">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
            <div className="h-card" style={{ flex: 1 }}>Recent projects</div>
            <button className="btn btn-ghost btn-sm" onClick={onGoProjects}>View all</button>
          </div>
          {recent.length === 0 ? (
            <EmptyState title="No projects yet">Create your first project to start tracking builds.</EmptyState>
          ) : (
            recent.map((p) => {
              const pct = projectPct(p)
              const done = projectIsDone(p)
              const t = taskCounts(p)
              return (
                <button
                  key={p.id}
                  onClick={() => onOpenProject(p)}
                  className="card card-tap"
                  style={{ width: '100%', textAlign: 'left', padding: '13px 16px', marginBottom: 9, border: '1px solid var(--line)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 3 }}>
                    <div style={{ fontFamily: 'var(--disp)', fontWeight: 700, fontSize: 16.5, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name}
                    </div>
                    <span className="num" style={{ fontSize: 15, color: done ? 'var(--green)' : 'var(--gold-strong)' }}>{pct}%</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginBottom: 9 }}>
                    {p.location || 'No address'} · {t.done}/{t.total} tasks
                  </div>
                  <StageRail project={p} />
                </button>
              )
            })
          )}
        </div>

        <div>
          <div className="h-card" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="note" size={18} style={{ color: 'var(--ink-3)' }} /> Site notes
          </div>
          {notes.length === 0 ? (
            <EmptyState icon="note" title="No notes yet">Supervisor site notes will appear here.</EmptyState>
          ) : (
            notes.map((n, i) => (
              <button
                key={i}
                onClick={() => onOpenProject(n.project)}
                className="card card-tap"
                style={{ width: '100%', textAlign: 'left', padding: '12px 15px', marginBottom: 9, border: '1px solid var(--line)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <div style={{ fontFamily: 'var(--disp)', fontWeight: 700, fontSize: 14.5, flex: 1 }}>
                    {n.project.name}
                  </div>
                  <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{timeAgo(n.notedAt)}</span>
                </div>
                <div className="eyebrow" style={{ fontSize: 10.5, marginBottom: 5 }}>{n.stage.name}</div>
                {n.achievements && <NoteLine color="var(--green)">{n.achievements}</NoteLine>}
                {n.notes && <NoteLine color="var(--ink-2)">{n.notes}</NoteLine>}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function NoteLine({ color, children }) {
  return (
    <div style={{ fontSize: 12.5, color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      {children}
    </div>
  )
}
