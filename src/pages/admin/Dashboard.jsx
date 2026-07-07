import { useState, useEffect } from 'react'
import { fetchOpenRequests, updateRequest, setTaskDone, fetchAllProfiles, fetchNewPhotos, archivePhoto } from '../../lib/api'
import { projectPct, isComplete, taskCounts, activeStage, fmtShort, typeLabel } from '../../lib/helpers'
import { downloadRequestEvent } from '../../lib/calendar'
import { Card, Tag, PriorityTag, Empty, Banner, Spinner, Segments, IconChip } from '../../components/ui'
import { Avatar } from '../Shell'
import Icon from '../../components/icons'

const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

export default function Dashboard({ projects, loaded, error, refresh, profile, onOpenProject, onGoProjects, onNew }) {
  const [requests, setRequests] = useState([])
  const [people, setPeople] = useState({})
  const [photos, setPhotos] = useState([])
  const [viewer, setViewer] = useState(null)
  const [busy, setBusy] = useState(null)

  useEffect(() => {
    fetchOpenRequests().then(setRequests).catch(() => {})
    fetchNewPhotos().then(setPhotos).catch(() => {})
    fetchAllProfiles()
      .then((all) => {
        const m = {}
        all.forEach((u) => (m[u.id] = u))
        setPeople(m)
      })
      .catch(() => {})
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

  const attention = []
  active.forEach((p) => {
    const s = activeStage(p)
    s?.tasks?.forEach((t) => {
      if (t.status !== 'done' && (t.priority === 'high' || t.due_date)) attention.push({ p, s, t })
    })
  })
  attention.sort((a, b) => ((a.t.due_date || '9999') < (b.t.due_date || '9999') ? -1 : 1))

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

  const firstName = (profile?.full_name || '').split(' ')[0] || 'there'
  const dateStr = new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="fade">
      {/* Greeting band */}
      <div className="greet">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 260px' }}>
            <div className="sub" style={{ marginBottom: 2 }}>{dateStr}</div>
            <h1>{greeting()}, {firstName}</h1>
            <div style={{ fontSize: 13.5, color: 'var(--ink-2)' }}>
              {active.length} active build{active.length === 1 ? '' : 's'}
              {requests.length > 0
                ? ' · ' + requests.length + ' site request' + (requests.length === 1 ? '' : 's') + ' waiting'
                : ' · site is all clear'}
            </div>
          </div>
          <button className="btn btn-primary btn-lg" onClick={onNew}>
            <Icon name="plus" size={16} /> New project
          </button>
        </div>
      </div>

      {!loaded && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }} className="sub">
          <Spinner size={14} /> Syncing…
        </div>
      )}
      {error && <Banner tone="red">{error}</Banner>}

      {/* KPIs */}
      <div className="g-kpi" style={{ marginBottom: 26 }}>
        <Kpi icon="projects" tint="accent" label="Active projects" val={active.length} onClick={onGoProjects} />
        <Kpi icon="check" tint="green" label="Completed" val={done.length} onClick={onGoProjects} />
        <Kpi icon="target" tint="amber" label="Tasks done" val={totals.done + ' / ' + totals.total} onClick={onGoProjects} />
        <Kpi icon="flag" tint={requests.length ? 'red' : 'ink'} label="Open requests" val={requests.length} />
      </div>

      {/* Requests from site */}
      <SectionHead icon="flag" tint="red" title="Requests from site" count={requests.length} tone="red" />
      {requests.length === 0 ? (
        <AllClear>Nothing open — supervisors have everything they need.</AllClear>
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
                    patchRequest(r.id, { status: 'done', done_at: new Date().toISOString(), done_by_name: 'Office', admin_note: note, site_ack: false })
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
      <SectionHead icon="bell" tint="amber" title="Needs attention" count={attention.length} tone="amber" />
      {attention.length === 0 ? (
        <AllClear>No urgent or dated tasks outstanding.</AllClear>
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

      {/* New site photos */}
      <SectionHead
        icon="note"
        tint="accent"
        title="New site photos"
        count={photos.length}
        tone="accent"
      />
      {photos.length === 0 ? (
        <AllClear>No new photos — everything from site has been reviewed.</AllClear>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8, marginBottom: 26 }}>
          {photos.map((ph) => (
            <div key={ph.id} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--line)', background: '#000', aspectRatio: '1' }}>
              <img
                src={ph.data_url}
                alt="Site"
                loading="lazy"
                onClick={() => setViewer(ph)}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', cursor: 'pointer' }}
              />
              <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.72))', padding: '18px 8px 6px', pointerEvents: 'none' }}>
                <div style={{ color: '#fff', fontSize: 11, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {byId[ph.project_id]?.name || 'Project'}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 10 }}>{fmtShort(ph.taken_at)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewer && (
        <div className="veil" style={{ alignItems: 'center', padding: 14 }} onClick={() => setViewer(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700, width: '100%' }}>
            <img src={viewer.data_url} alt="Site" style={{ width: '100%', borderRadius: 12, display: 'block' }} />
            <div className="card" style={{ marginTop: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 150 }}>
                <div style={{ fontWeight: 500, fontSize: 13.5 }}>{byId[viewer.project_id]?.name || 'Project'}</div>
                <div className="sub">{fmtShort(viewer.taken_at)}</div>
              </div>
              <button
                className="btn btn-green"
                onClick={async () => {
                  await archivePhoto(viewer.id).catch((e) => alert(e.message))
                  setPhotos((ps) => ps.filter((x) => x.id !== viewer.id))
                  setViewer(null)
                }}
              >
                <Icon name="check" size={14} /> Archive to project
              </button>
              <button className="btn btn-outline" onClick={() => { onOpenProject(viewer.project_id, 'photos'); setViewer(null) }}>
                Open project
              </button>
              <button className="btn btn-ghost" onClick={() => setViewer(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Projects */}
      <SectionHead icon="projects" tint="accent" title="Projects" action={<button className="btn btn-ghost" onClick={onGoProjects}>View all</button>} />
      {projects.length === 0 ? (
        <Empty title="No projects yet">Create your first project to start tracking builds.</Empty>
      ) : (
        <div className="g-cards">
          {projects.slice(0, 6).map((p) => (
            <ProjectCard key={p.id} p={p} people={people} onOpen={() => onOpenProject(p.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

export function ProjectCard({ p, people, onOpen }) {
  const pct = projectPct(p)
  const s = activeStage(p)
  const t = taskCounts(p)
  const done = isComplete(p)
  const sups = (p.supervisorIds || []).map((id) => people[id]).filter(Boolean)
  return (
    <Card onClick={onOpen} pad={16}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <IconChip icon={done ? 'check' : 'projects'} tint={done ? 'green' : 'accent'} sm />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14.5, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
          <div className="sub" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.address || 'No address'}</div>
        </div>
        <span style={{ fontSize: 13, fontWeight: 650, color: done ? 'var(--green)' : 'var(--ink)' }}>{pct}%</span>
      </div>
      <Segments stages={p.stages} style={{ marginBottom: 10 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="sub" style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {done ? 'Complete' : s?.name || '—'} · {t.done}/{t.total} tasks
        </span>
        <div style={{ display: 'flex' }}>
          {sups.slice(0, 3).map((u, i) => (
            <span key={u.id} style={{ marginLeft: i ? -7 : 0, border: '2px solid #fff', borderRadius: '50%', display: 'inline-flex' }}>
              <Avatar name={u.full_name || u.email} size={22} />
            </span>
          ))}
        </div>
      </div>
    </Card>
  )
}

function Kpi({ icon, tint, label, val, onClick }) {
  return (
    <div className="kpi" onClick={onClick}>
      <IconChip icon={icon} tint={tint} />
      <div>
        <div className="kpi-num">{val}</div>
        <div className="sub" style={{ marginTop: 1 }}>{label}</div>
      </div>
    </div>
  )
}

function SectionHead({ icon, tint, title, count, tone, action }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
      <IconChip icon={icon} tint={tint || 'ink'} sm />
      <div className="h2" style={{ flex: 1 }}>{title}</div>
      {count > 0 && <Tag tone={tone}>{count}</Tag>}
      {action}
    </div>
  )
}

function AllClear({ children }) {
  return (
    <Card style={{ marginBottom: 26 }} pad={13}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <IconChip icon="check" tint="green" sm />
        <span className="sub">{children}</span>
      </div>
    </Card>
  )
}
