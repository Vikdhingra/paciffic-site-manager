import { useState } from 'react'
import { uid, projectSupervisorIds } from '../../lib/constants'
import { Card, Btn, Input, StageRail, projectPct, projectIsDone } from '../../components/ui'
import Icon from '../../components/icons'
import SupervisorPicker from '../../components/SupervisorPicker'

export default function ProjectDetail({ project, save, onBack, isAdmin }) {
  const [p, setP] = useState(project)
  const [tab, setTab] = useState('overview')

  const update = (next) => {
    setP(next)
    save(next)
  }

  // ── Shared stage/task mutations ─────────────────────────────
  const completeStage = (idx) => {
    const stages = p.stages.map((s, i) =>
      i === idx ? { ...s, status: 'complete', completedAt: new Date().toISOString() } : s
    )
    let next = stages.findIndex((s, i) => i > idx && s.status !== 'complete')
    if (next === -1) next = Math.min(idx + 1, stages.length - 1)
    const withActive = stages.map((s, i) => ({
      ...s,
      status: i === next && s.status !== 'complete' ? 'active' : s.status,
    }))
    update({ ...p, stages: withActive, currentStage: next })
  }

  const reopenStage = (idx) => {
    const stages = p.stages.map((s, i) => (i === idx ? { ...s, status: 'active', completedAt: null } : s))
    update({ ...p, stages, currentStage: idx })
  }

  const setActive = (idx) => update({ ...p, currentStage: idx })

  const toggleTask = (stageId, tid) => {
    const stages = p.stages.map((s) =>
      s.id === stageId
        ? {
            ...s,
            tasks: s.tasks.map((t) =>
              t.id === tid
                ? { ...t, status: t.status === 'done' ? 'todo' : 'done', doneAt: t.status === 'done' ? null : new Date().toISOString() }
                : t
            ),
          }
        : s
    )
    update({ ...p, stages })
  }

  const deleteTask = (stageId, tid) => {
    const stages = p.stages.map((s) => (s.id === stageId ? { ...s, tasks: s.tasks.filter((t) => t.id !== tid) } : s))
    update({ ...p, stages })
  }

  const addTask = (stageId, title, priority) => {
    const task = { id: uid(), title, status: 'todo', priority, createdAt: new Date().toISOString() }
    const stages = p.stages.map((s) => (s.id === stageId ? { ...s, tasks: [...(s.tasks || []), task] } : s))
    update({ ...p, stages })
  }

  const pct = projectPct(p)
  const done = projectIsDone(p)
  const cur = p.stages?.[p.currentStage]
  const curDone = cur?.tasks?.filter((t) => t.status === 'done').length || 0
  const curTotal = cur?.tasks?.length || 0

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'notes', label: 'Notes' },
    ...(isAdmin ? [{ id: 'team', label: 'Team' }] : []),
  ]

  return (
    <div className="rise">
      <button
        onClick={onBack}
        className="btn btn-ghost btn-sm"
        style={{ marginBottom: 14, marginLeft: -8, textTransform: 'none', letterSpacing: 0 }}
      >
        <Icon name="back" size={15} /> All projects
      </button>

      {/* Header card */}
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 6 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 className="h-page" style={{ marginBottom: 4 }}>{p.name}</h1>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Icon name="pin" size={14} /> {p.location || 'No address'}
              </span>
              {p.client && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <Icon name="person" size={14} /> {p.client}
                </span>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="num" style={{ fontSize: 32, lineHeight: 1, color: done ? 'var(--green)' : 'var(--navy)' }}>{pct}%</div>
            <div className="eyebrow" style={{ marginTop: 3 }}>Complete</div>
          </div>
        </div>
        <StageRail project={p} large style={{ marginTop: 12 }} />
      </Card>

      {/* Current stage — primary action, zero digging */}
      {!done && cur && (
        <Card style={{ marginBottom: 18, borderLeft: '4px solid var(--gold)', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px', minWidth: 0 }}>
            <div className="eyebrow" style={{ color: 'var(--gold-strong)', marginBottom: 3 }}>
              Current stage · {(p.currentStage ?? 0) + 1} of {p.stages.length}
            </div>
            <div style={{ fontFamily: 'var(--disp)', fontWeight: 700, fontSize: 20 }}>{cur.name}</div>
            <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2 }}>
              {curTotal === 0 ? 'No tasks in this stage' : `${curDone}/${curTotal} tasks done`}
              {curTotal > 0 && curDone === curTotal && (
                <span style={{ color: 'var(--green)', fontWeight: 600 }}> — ready to complete</span>
              )}
            </div>
          </div>
          <Btn variant="green" onClick={() => completeStage(p.currentStage)}>
            <Icon name="check" size={16} /> Mark stage complete
          </Btn>
        </Card>
      )}
      {done && (
        <Card style={{ marginBottom: 18, borderLeft: '4px solid var(--green)', display: 'flex', alignItems: 'center', gap: 10, color: 'var(--green)' }}>
          <Icon name="check" size={19} />
          <span style={{ fontFamily: 'var(--disp)', fontWeight: 700, fontSize: 17 }}>Project complete</span>
        </Card>
      )}

      {/* Tabs */}
      <div className="segtabs" style={{ marginBottom: 18 }}>
        {tabs.map((t) => (
          <button key={t.id} className={['segtab', tab === t.id ? 'on' : ''].join(' ')} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <Overview p={p} toggleTask={toggleTask} completeStage={completeStage} reopenStage={reopenStage} setActive={setActive} />
      )}
      {tab === 'tasks' && <Tasks p={p} addTask={addTask} toggleTask={toggleTask} deleteTask={deleteTask} />}
      {tab === 'notes' && <Notes p={p} update={update} />}
      {tab === 'team' && <Team p={p} update={update} />}
    </div>
  )
}

// ── OVERVIEW — stages with inline tickable tasks ──────────────
function Overview({ p, toggleTask, completeStage, reopenStage, setActive }) {
  const [open, setOpen] = useState(p.currentStage)

  return (
    <div>
      {p.stages.map((s, i) => {
        const doneCount = s.tasks?.filter((t) => t.status === 'done').length || 0
        const total = s.tasks?.length || 0
        const stagePct = total ? Math.round((doneCount / total) * 100) : 0
        const isComplete = s.status === 'complete'
        const isActive = !isComplete && i === p.currentStage
        const isExpanded = open === i

        return (
          <Card key={s.id} style={{ marginBottom: 9, padding: 0, borderLeft: '4px solid ' + (isComplete ? 'var(--green)' : isActive ? 'var(--gold)' : 'var(--line-strong)') }}>
            <button
              onClick={() => setOpen(isExpanded ? -1 : i)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 13, padding: '13px 16px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  background: isComplete ? 'var(--green)' : isActive ? 'var(--gold)' : 'var(--paper)',
                  border: isComplete || isActive ? 'none' : '1px solid var(--line-strong)',
                  color: isComplete || isActive ? '#fff' : 'var(--ink-3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--disp)',
                  fontWeight: 700,
                  fontSize: 14.5,
                  flexShrink: 0,
                }}
              >
                {isComplete ? <Icon name="check" size={16} /> : i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--disp)', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {s.name}
                  {isComplete && <span className="chip chip-green">Complete</span>}
                  {isActive && <span className="chip chip-gold">Active</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 1 }}>
                  {total === 0 ? 'No tasks' : `${doneCount}/${total} tasks · ${stagePct}%`}
                </div>
              </div>
              <Icon name={isExpanded ? 'chevronUp' : 'chevronDown'} size={17} style={{ color: 'var(--ink-3)' }} />
            </button>

            {isExpanded && (
              <div style={{ padding: '4px 16px 15px', borderTop: '1px solid var(--line)' }}>
                {(s.tasks || []).length === 0 && (
                  <div style={{ color: 'var(--ink-3)', fontSize: 13, padding: '10px 0' }}>No tasks in this stage — add them in the Tasks tab.</div>
                )}
                {(s.tasks || []).map((t) => (
                  <div key={t.id} className="task-row">
                    <button
                      className={['tick', t.status === 'done' ? 'done' : ''].join(' ')}
                      onClick={() => toggleTask(s.id, t.id)}
                      aria-label={t.status === 'done' ? 'Reopen task' : 'Mark task done'}
                    >
                      {t.status === 'done' && <Icon name="check" size={15} stroke={2.6} />}
                    </button>
                    <span style={{ flex: 1, fontSize: 14.5, color: t.status === 'done' ? 'var(--ink-3)' : 'var(--ink)', textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>
                      {t.title}
                    </span>
                    <PriorityTag t={t} />
                  </div>
                ))}

                <div style={{ display: 'flex', gap: 8, marginTop: 13, flexWrap: 'wrap' }}>
                  {isComplete ? (
                    <Btn variant="outline" size="sm" onClick={() => reopenStage(i)}>
                      <Icon name="undo" size={14} /> Reopen stage
                    </Btn>
                  ) : (
                    <>
                      {!isActive && (
                        <Btn variant="outline" size="sm" onClick={() => setActive(i)}>
                          <Icon name="target" size={14} /> Set as active
                        </Btn>
                      )}
                      <Btn variant="green" size="sm" onClick={() => completeStage(i)}>
                        <Icon name="check" size={14} /> Mark stage complete
                      </Btn>
                    </>
                  )}
                </div>
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}

function PriorityTag({ t }) {
  const pr = t.priority || 'medium'
  const cls = pr === 'high' ? 'chip-red' : pr === 'low' ? 'chip-green' : 'chip-gold'
  return <span className={['chip', cls].join(' ')} style={{ fontSize: 11 }}>{pr}</span>
}

// ── TASKS ─────────────────────────────────────────────────────
function Tasks({ p, addTask, toggleTask, deleteTask }) {
  const [stageId, setStageId] = useState(p.stages[p.currentStage]?.id || p.stages[0]?.id)
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('medium')

  const stage = p.stages.find((s) => s.id === stageId) || p.stages[0]

  const submit = () => {
    if (!title.trim()) return
    addTask(stageId, title.trim(), priority)
    setTitle('')
  }

  return (
    <div>
      <Card style={{ marginBottom: 18 }}>
        <div className="h-card" style={{ marginBottom: 14 }}>Add task</div>
        <label className="field-label">Stage</label>
        <select value={stageId} onChange={(e) => setStageId(e.target.value)} className="select" style={{ marginBottom: 13 }}>
          {p.stages.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <Input label="Task" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Order roof trusses" style={{ marginBottom: 13 }} />
        <label className="field-label">Priority</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 15 }}>
          {['high', 'medium', 'low'].map((pr) => (
            <button
              key={pr}
              onClick={() => setPriority(pr)}
              className="fchip"
              style={priority === pr ? { background: 'var(--navy)', borderColor: 'var(--navy)', color: '#fff', flex: 1 } : { flex: 1 }}
            >
              {pr}
            </button>
          ))}
        </div>
        <Btn onClick={submit} disabled={!title.trim()}>
          <Icon name="plus" size={15} /> Add task
        </Btn>
      </Card>

      <div className="h-card" style={{ marginBottom: 10 }}>{stage?.name} tasks</div>
      {(stage?.tasks || []).length === 0 && (
        <div style={{ color: 'var(--ink-3)', fontSize: 13.5, padding: '6px 2px' }}>No tasks yet.</div>
      )}
      <Card style={{ padding: '4px 16px' }}>
        {(stage?.tasks || []).map((t) => (
          <div key={t.id} className="task-row">
            <button
              className={['tick', t.status === 'done' ? 'done' : ''].join(' ')}
              onClick={() => toggleTask(stage.id, t.id)}
              aria-label={t.status === 'done' ? 'Reopen task' : 'Mark task done'}
            >
              {t.status === 'done' && <Icon name="check" size={15} stroke={2.6} />}
            </button>
            <span style={{ flex: 1, minWidth: 0, fontSize: 14.5, color: t.status === 'done' ? 'var(--ink-3)' : 'var(--ink)', textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>
              {t.title}
            </span>
            <PriorityTag t={t} />
            <button
              onClick={() => { if (confirm('Delete task "' + t.title + '"?')) deleteTask(stage.id, t.id) }}
              aria-label="Delete task"
              style={{ background: 'transparent', border: 'none', color: 'var(--ink-3)', cursor: 'pointer', padding: 4 }}
            >
              <Icon name="trash" size={16} />
            </button>
          </div>
        ))}
        {(stage?.tasks || []).length === 0 && <div style={{ padding: 12 }} />}
      </Card>
    </div>
  )
}

// ── NOTES ─────────────────────────────────────────────────────
function Notes({ p, update }) {
  const stage = p.stages[p.currentStage] || p.stages[0]
  const [local, setLocal] = useState({
    achievements: stage.achievements || '',
    notes: stage.notes || '',
    nextSteps: stage.nextSteps || '',
  })
  const [saved, setSaved] = useState(true)

  const change = (k) => (e) => {
    setLocal((l) => ({ ...l, [k]: e.target.value }))
    setSaved(false)
  }

  const persist = () => {
    const stages = p.stages.map((s) =>
      s.id === stage.id ? { ...s, ...local, notedAt: new Date().toISOString() } : s
    )
    update({ ...p, stages })
    setSaved(true)
  }

  const fields = [
    { k: 'achievements', label: 'Achieved', ph: 'Completed work, milestones…' },
    { k: 'notes', label: 'In progress', ph: 'Active construction activities…' },
    { k: 'nextSteps', label: 'Next steps', ph: 'Upcoming tasks, deliveries…' },
  ]

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <div className="h-card" style={{ flex: 1 }}>Site notes — {stage.name}</div>
        <Btn onClick={persist} variant={saved ? 'outline' : 'primary'} size="sm">
          {saved ? 'Saved' : 'Save notes'}
        </Btn>
      </div>
      {fields.map((f) => (
        <div key={f.k} style={{ marginBottom: 16 }}>
          <label className="field-label">{f.label}</label>
          <textarea className="textarea" value={local[f.k]} onChange={change(f.k)} placeholder={f.ph} />
        </div>
      ))}
    </Card>
  )
}

// ── TEAM ──────────────────────────────────────────────────────
function Team({ p, update }) {
  const assigned = projectSupervisorIds(p)
  return (
    <div>
      <div className="h-card" style={{ marginBottom: 5 }}>Assigned supervisors</div>
      <div style={{ fontSize: 13.5, color: 'var(--ink-2)', marginBottom: 14 }}>
        Tap to add or remove. Supervisors only see projects they're assigned to.
        {assigned.length > 0 && ' Currently ' + assigned.length + ' assigned.'}
      </div>
      <Card>
        <SupervisorPicker project={p} onChange={(ids) => update({ ...p, supervisorIds: ids })} />
      </Card>
    </div>
  )
}
