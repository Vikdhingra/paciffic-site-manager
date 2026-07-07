import { useState, useMemo } from 'react'
import {
  completeStage, reopenStage, setActiveStage, addTask, setTaskDone, setTaskStatus, deleteTask, setAssignments, updateProject,
} from '../lib/api'
import { projectPct, isComplete, activeStage, fmtShort } from '../lib/helpers'
import { Btn, Card, Segments, Tick, Tag, PriorityTag, Field, Input, Modal } from '../components/ui'
import Icon from '../components/icons'
import SupervisorPicker from '../components/SupervisorPicker'
import DiaryTab from './project/DiaryTab'
import PhotosTab from './project/PhotosTab'
import RequestsTab from './project/RequestsTab'
import FilesTab from './project/FilesTab'

export default function Project(props) {
  const { projects, projectId, initialTab, onBack, refresh, isAdmin } = props
  const [tab, setTab] = useState(initialTab || 'overview')
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(false)

  const p = projects.find((x) => x.id === projectId)
  if (!p) return null

  const pct = projectPct(p)
  const done = isComplete(p)
  const cur = activeStage(p)
  const curOpen = (cur?.tasks || []).filter((t) => t.status !== 'done').length
  const curTotal = cur?.tasks?.length || 0

  const act = async (fn) => {
    setBusy(true)
    try {
      await fn()
      await refresh(p.id)
    } catch (e) {
      alert(e.message)
    } finally {
      setBusy(false)
    }
  }

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'diary', label: 'Diary' },
    { id: 'requests', label: 'Requests' },
    { id: 'photos', label: 'Photos' },
    { id: 'files', label: 'Files' },
    ...(isAdmin ? [{ id: 'team', label: 'Team' }] : []),
  ]

  return (
    <div className="fade">
      <button className="btn btn-ghost" style={{ marginLeft: -10, marginBottom: 10 }} onClick={onBack}>
        <Icon name="back" size={14} /> Back
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 className="h1" style={{ marginBottom: 3 }}>{p.name}</h1>
            {isAdmin && (
              <button className="btn btn-ghost btn-icon" title="Edit project details" onClick={() => setEditing(true)}>
                <Icon name="note" size={15} />
              </button>
            )}
          </div>
          <div className="sub">
            {p.address || 'No address'}
            {p.client ? ' · ' + p.client : ''}
          </div>
        </div>
        <div style={{ textAlign: 'right', minWidth: 130 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: done ? 'var(--green)' : 'var(--ink)' }}>{pct}%</span>
            {done && <Tag tone="green">Complete</Tag>}
          </div>
          <Segments stages={p.stages} style={{ width: 170 }} />
        </div>
      </div>

      {/* Current stage action */}
      {!done && cur && (
        <Card pad={14} style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <div className="overline" style={{ marginBottom: 2 }}>Current stage</div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{cur.name}</div>
            <div className="sub">
              {curTotal === 0 ? 'No tasks' : curOpen === 0 ? 'All ' + curTotal + ' tasks done — ready to complete' : curOpen + ' of ' + curTotal + ' tasks open'}
            </div>
          </div>
          <Btn variant="green" disabled={busy} onClick={() => act(() => completeStage(p, cur.id))}>
            <Icon name="check" size={15} /> Complete stage
          </Btn>
        </Card>
      )}

      <div className="tabs" style={{ marginBottom: 18 }}>
        {TABS.map((t) => (
          <button key={t.id} className={['tab', tab === t.id ? 'on' : ''].join(' ')} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <Overview p={p} act={act} busy={busy} isAdmin={isAdmin} />}
      {tab === 'diary' && <DiaryTab p={p} refresh={refresh} {...props} />}
      {tab === 'requests' && <RequestsTab p={p} {...props} />}
      {tab === 'photos' && <PhotosTab p={p} {...props} />}
      {tab === 'files' && <FilesTab p={p} {...props} />}
      {editing && (
        <EditProjectModal
          p={p}
          onClose={() => setEditing(false)}
          onSave={async (patch) => {
            await updateProject(p.id, patch)
            await refresh(p.id)
            setEditing(false)
          }}
        />
      )}

      {tab === 'team' && (
        <div style={{ maxWidth: 480 }}>
          <div className="h2" style={{ marginBottom: 4 }}>Assigned supervisors</div>
          <div className="sub" style={{ marginBottom: 12 }}>Supervisors only see projects they're assigned to.</div>
          <Card pad={14}>
            <SupervisorPicker
              value={p.supervisorIds}
              onChange={(ids) => act(() => setAssignments(p.id, ids))}
            />
          </Card>
        </div>
      )}
    </div>
  )
}

// ── OVERVIEW: stages with inline tasks + add task ─────────────
function Overview({ p, act, busy }) {
  const initiallyOpen = useMemo(() => activeStage(p)?.id || null, [p.id])
  const [open, setOpen] = useState(initiallyOpen)
  const [addingIn, setAddingIn] = useState(null)

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {p.stages.map((s, i) => {
        const total = s.tasks?.length || 0
        const doneCount = s.tasks?.filter((t) => t.status === 'done').length || 0
        const isDone = s.status === 'complete'
        const isActive = s.status === 'active'
        const expanded = open === s.id

        return (
          <div key={s.id} style={{ borderBottom: i < p.stages.length - 1 ? '1px solid var(--line)' : 'none' }}>
            <button
              onClick={() => setOpen(expanded ? null : s.id)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 11, padding: '11px 14px', background: expanded ? 'var(--surface-2)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <span
                style={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 600,
                  background: isDone ? 'var(--green)' : isActive ? 'var(--accent)' : 'var(--surface-2)',
                  border: isDone || isActive ? 'none' : '1px solid var(--line-2)',
                  color: isDone || isActive ? '#fff' : 'var(--ink-3)',
                }}
              >
                {isDone ? <Icon name="check" size={12} stroke={2.6} /> : i + 1}
              </span>
              <span style={{ flex: 1, minWidth: 0, fontWeight: 500, fontSize: 14, color: isDone ? 'var(--ink-3)' : 'var(--ink)' }}>
                {s.name}
              </span>
              {isActive && <Tag tone="accent">Active</Tag>}
              <span className="sub">{total ? doneCount + '/' + total : ''}</span>
              <Icon name={expanded ? 'chevronUp' : 'chevronDown'} size={15} style={{ color: 'var(--ink-3)' }} />
            </button>

            {expanded && (
              <div style={{ padding: '2px 14px 13px 47px', background: 'var(--surface-2)' }}>
                {(s.tasks || []).map((t) => (
                  <TaskRow key={t.id} t={t} act={act} />
                ))}
                {total === 0 && <div className="sub" style={{ padding: '6px 0' }}>No tasks in this stage.</div>}

                {addingIn === s.id ? (
                  <AddTaskInline
                    onCancel={() => setAddingIn(null)}
                    onAdd={async (title, priority, dueDate) => {
                      await act(() => addTask({ projectId: p.id, stageId: s.id, title, priority, dueDate }))
                      setAddingIn(null)
                    }}
                  />
                ) : (
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    <button className="btn btn-ghost" onClick={() => setAddingIn(s.id)}>
                      <Icon name="plus" size={13} /> Add task
                    </button>
                    {isDone ? (
                      <button className="btn btn-ghost" disabled={busy} onClick={() => act(() => reopenStage(p, s.id))}>
                        <Icon name="undo" size={13} /> Reopen stage
                      </button>
                    ) : (
                      <>
                        {!isActive && (
                          <button className="btn btn-ghost" disabled={busy} onClick={() => act(() => setActiveStage(p, s.id))}>
                            <Icon name="target" size={13} /> Set active
                          </button>
                        )}
                        <button className="btn btn-ghost" style={{ color: 'var(--green)' }} disabled={busy} onClick={() => act(() => completeStage(p, s.id))}>
                          <Icon name="check" size={13} /> Complete stage
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function TaskRow({ t, act }) {
  const done = t.status === 'done'
  const started = t.status === 'in_progress'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--line)', flexWrap: 'wrap' }}>
      <Tick done={done} onClick={() => act(() => setTaskStatus(t.id, done ? 'todo' : 'done'))} label={done ? 'Reopen' : 'Mark done'} />
      <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, color: done ? 'var(--ink-3)' : 'var(--ink)', textDecoration: done ? 'line-through' : 'none' }}>
        {t.title}
      </span>
      {t.due_date && !done && <Tag icon="clock">{fmtShort(t.due_date)}</Tag>}
      {t.priority !== 'medium' && <PriorityTag p={t.priority} />}
      {!done && !started && (
        <button className="btn btn-outline" style={{ padding: '4px 11px', fontSize: 12.5 }} onClick={() => act(() => setTaskStatus(t.id, 'in_progress'))}>
          Start
        </button>
      )}
      {started && (
        <>
          <Tag tone="amber">In progress</Tag>
          <button className="btn btn-green" style={{ padding: '4px 11px', fontSize: 12.5 }} onClick={() => act(() => setTaskStatus(t.id, 'done'))}>
            <Icon name="check" size={13} /> Done
          </button>
        </>
      )}
      <button
        className="btn btn-ghost btn-icon"
        style={{ color: 'var(--ink-3)' }}
        title="Delete task"
        onClick={() => { if (confirm('Delete task "' + t.title + '"?')) act(() => deleteTask(t.id)) }}
      >
        <Icon name="trash" size={14} />
      </button>
    </div>
  )
}

function AddTaskInline({ onAdd, onCancel }) {
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (!title.trim()) return
    setBusy(true)
    await onAdd(title.trim(), priority, dueDate || null)
    setBusy(false)
  }

  return (
    <div className="card" style={{ padding: 12, marginTop: 8 }}>
      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task — e.g. Order roof trusses" autoFocus
        onKeyDown={(e) => e.key === 'Enter' && submit()} style={{ marginBottom: 0 }} />
      <div style={{ display: 'flex', gap: 8, margin: '9px 0', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {['high', 'medium', 'low'].map((pr) => (
            <button key={pr} className={['pill', priority === pr ? 'on' : ''].join(' ')} onClick={() => setPriority(pr)}>{pr}</button>
          ))}
        </div>
        <input type="date" className="input" style={{ width: 150 }} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <Btn onClick={submit} disabled={busy || !title.trim()}>Add task</Btn>
        <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
      </div>
    </div>
  )
}


function EditProjectModal({ p, onClose, onSave }) {
  const [name, setName] = useState(p.name)
  const [address, setAddress] = useState(p.address || '')
  const [client, setClient] = useState(p.client || '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const submit = async () => {
    if (!name.trim()) return setErr('Project needs a name')
    setBusy(true); setErr('')
    try {
      await onSave({ name: name.trim(), address: address.trim(), client: client.trim() })
    } catch (e) {
      setErr(e.message || 'Could not save')
      setBusy(false)
    }
  }

  return (
    <Modal title="Edit project" onClose={onClose}>
      <Input label="Project name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      <Input label="Site address" value={address} onChange={(e) => setAddress(e.target.value)} />
      <Input label="Client / builder" value={client} onChange={(e) => setClient(e.target.value)} />
      {err && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 10 }}>{err}</div>}
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <Btn onClick={submit} disabled={busy} size="lg" style={{ flex: 1 }}>{busy ? 'Saving…' : 'Save changes'}</Btn>
        <Btn variant="outline" size="lg" onClick={onClose}>Cancel</Btn>
      </div>
    </Modal>
  )
}
