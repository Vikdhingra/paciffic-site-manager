import { useState, useEffect } from 'react'
import { fetchOpenRequests, updateRequest, setTaskDone } from '../../lib/api'
import { projectPct, isComplete, taskCounts, activeStage, fmtShort, typeLabel } from '../../lib/helpers'
import { downloadRequestEvent } from '../../lib/calendar'
import { Card, Tag, PriorityTag, Meter, Empty, Banner, Spinner } from '../../components/ui'
import Icon from '../../components/icons'

export default function Dashboard({ projects, loaded, error, refresh, onOpenProject, onGoProjects, onNew }) {
  const [requests, setRequests] = useState([])
  const [busy, setBusy] = useState(null)

  useEffect(() => {
    fetchOpenRequests().then(setRequests).catch(() => {})
  }, [])

  const byId = {}
  projects.forEach((p) => (byId[p.id] = p))

  const active = projects.filter((p) => !isComplete(p))
  const done = projects.filter(isComplete)
  const totals = projects.reduce(
    (a, p) => {
      const t = taskCounts(p)
      return { total: a.total + t.total, done: a.done + t.done }
    },
    { total: 0, done: 0 }
  )

  // Attention: open high-priority or due tasks across active stages
  const attention = []
  active.forEach((p) => {
    const s = activeStage(p)
    s?.tasks?.forEach((t) => {
      if (t.status !== 'done' && (t.priority === 'high' || t.due_date)) {
        attention.push({ p, s, t })
      }
    })
  })
  attention.sort((a, b) => (a.t.due_date || '9999') < (b.t.due_date || '9999') ? -1 : 1)

  const patchRequest = async (id, changes) => {
    const updated = await updateRequest(id, changes).catch((e) => alert(e.message))
    if (!updated) return
    setRequests((rs) => (updated.status === 'done' ? rs.filter((r) => r.id !== id) : rs.map((r) => (r.id === id ? updated : r))))
  }

  const completeTask = async (item) => {
    setBusy(item.t.id)
    await setTaskDone(item.t.id, true).catch((e) => alert(e.message))
    await refresh(item.p.id)
    setBusy(null)
  }

  const dateStr = new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="fade">
      <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <div className="sub" style={{ marginBottom: 2 }}>{dateStr}</div>
          <h1 className="h1">Dashboard</h1>
        </div>
        <button className="btn btn-primary only-m" onClick={onNew}>
          <Icon name="plus" size={15} /> Project
        </button>
      </div>

      {!loaded && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }} className="sub">
          <Spinner size={14} /> Syncing…
        </div>
      )}
      {error && <Banner tone="red">{error}</Banner>}

      {/* KPIs */}
      <div className="g-kpi" style={{ marginBottom: 26 }}>
        <Kpi label="Active projects" val={active.length} onClick={onGoProjects} />
        <Kpi label="Completed" val={done.length} onClick={onGoProjects} />
        <Kpi label="Tasks done" val={totals.done + ' / ' + totals.total} onClick={onGoProjects} />
        <Kpi label="Open requests" val={requests.length} tone={requests.length ? 'var(--red)' : undefined} />
      </div>

      {/* Requests from site */}
      <SectionHead icon="flag" title="Requests from site" count={requests.length} tone="red" />
      {requests.length === 0 ? (
        <Card style={{ marginBottom: 26 }} pad={14}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="sub">
            <Icon name="check" size={15} style={{ color: 'var(--green)' }} /> Nothing open — supervisors have everything they need.
          </div>
        </Card>
      ) : (
        <div className="card" style={{ marginBottom: 26, overflow: 'hidden' }}>
          {requests.map((r) => (
            <div key={r.id} className="row" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 260px', minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 5 }}>
                  <Tag tone="accent">{typeLabel(r.type)}</Tag>
                  <PriorityTag p={r.priority} />
                  {r.needed_by && <Tag icon="clock">by {fmtShort(r.needed_by)}</Tag>}
                  {r.status === 'in_progress' && <Tag tone="amber">In progress</Tag>}
                </div>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{r.title}</div>
                {r.details && <div className="sub" style={{ marginTop: 2, whiteSpace: 'pre-wrap' }}>{r.details}</div>}
                <button
                  onClick={() => byId[r.project_id] && onOpenProject(r.project_id, 'requests')}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', marginTop: 4 }}
                  className="sub"
                >
                  {(byId[r.project_id]?.name || 'Project')} · {r.created_by_name || 'Site'}
                </button>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button
                  className="btn btn-green"
                  onClick={() => {
                    const note = prompt('Note back to site? (optional)') || r.admin_note || ''
                    patchRequest(r.id, { status: 'done', done_at: new Date().toISOString(), done_by_name: 'Office', admin_note: note })
                  }}
                >
                  <Icon name="check" size={14} /> Done
                </button>
                {r.status !== 'in_progress' && (
                  <button className="btn btn-outline" onClick={() => patchRequest(r.id, { status: 'in_progress' })}>Start</button>
                )}
                <button className="btn btn-outline btn-icon" title="Add to calendar" onClick={() => downloadRequestEvent(r, byId[r.project_id]?.name || '')}>
                  <Icon name="plus" size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Needs attention */}
      <SectionHead icon="bell" title="Needs attention" count={attention.length} tone="amber" />
      {attention.length === 0 ? (
        <Card style={{ marginBottom: 26 }} pad={14}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="sub">
            <Icon name="check" size={15} style={{ color: 'var(--green)' }} /> No urgent or dated tasks outstanding.
          </div>
        </Card>
      ) : (
        <div className="card" style={{ marginBottom: 26, overflow: 'hidden' }}>
          {attention.slice(0, 8).map((item) => (
            <div key={item.t.id} className="row">
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{item.t.title}</div>
                <div className="sub">{item.p.name} · {item.s.name}</div>
              </div>
              {item.t.due_date && <Tag icon="clock">{fmtShort(item.t.due_date)}</Tag>}
              <PriorityTag p={item.t.priority} />
              <button className="btn btn-outline" disabled={busy === item.t.id} onClick={() => completeTask(item)}>
                <Icon name="check" size={14} /> {busy === item.t.id ? '…' : 'Done'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Recent projects */}
      <SectionHead icon="projects" title="Projects" action={<button className="btn btn-ghost" onClick={onGoProjects}>View all</button>} />
      {projects.length === 0 ? (
        <Empty title="No projects yet">Create your first project to start tracking builds.</Empty>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {projects.slice(0, 6).map((p) => {
            const pct = projectPct(p)
            const s = activeStage(p)
            const t = taskCounts(p)
            const done = isComplete(p)
            return (
              <div key={p.id} className="row row-tap" onClick={() => onOpenProject(p.id)}>
                <span className="dot" style={{ background: done ? 'var(--green)' : 'var(--accent)' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  <div className="sub">{done ? 'Complete' : s?.name || '—'} · {t.done}/{t.total} tasks</div>
                </div>
                <div style={{ width: 120 }} className="hide-m">
                  <Meter pct={pct} done={done} />
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: done ? 'var(--green)' : 'var(--ink-2)', width: 38, textAlign: 'right' }}>{pct}%</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Kpi({ label, val, onClick, tone }) {
  return (
    <Card onClick={onClick} pad={14}>
      <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', color: tone || 'var(--ink)' }}>{val}</div>
      <div className="sub" style={{ marginTop: 2 }}>{label}</div>
    </Card>
  )
}

function SectionHead({ icon, title, count, tone, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <Icon name={icon} size={16} style={{ color: 'var(--ink-3)' }} />
      <div className="h2" style={{ flex: 1 }}>{title}</div>
      {count > 0 && <Tag tone={tone}>{count}</Tag>}
      {action}
    </div>
  )
}
