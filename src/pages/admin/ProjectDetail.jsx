import { useState } from 'react'
import { C, uid, stageColor, fmtDateShort, isAdminRole, projectSupervisorIds } from '../../lib/constants'
import { Card, Label, Btn, Input } from '../../components/ui'
import SupervisorPicker from '../../components/SupervisorPicker'

export default function ProjectDetail({ project, save, onBack, isAdmin }) {
  // Work on a local copy; persist via save()
  const [p, setP] = useState(project)
  const [tab, setTab] = useState('overview')

  const update = (next) => {
    setP(next)
    save(next)
  }

  const tabs = [
    { id: 'overview', label: 'OVERVIEW' },
    { id: 'tasks', label: 'TASKS' },
    { id: 'notes', label: 'NOTES' },
    ...(isAdmin ? [{ id: 'team', label: 'TEAM' }] : []),
  ]

  return (
    <div>
      <button
        onClick={onBack}
        style={{ background: 'transparent', border: 'none', color: C.blue, cursor: 'pointer', fontSize: 14, marginBottom: 14 }}
      >
        ← Back to projects
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <Label style={{ fontSize: 24 }}>{p.name}</Label>
      </div>
      <div style={{ fontSize: 13, color: C.t2, marginBottom: 16 }}>
        📍 {p.location || '—'} {p.client && ' · 👤 ' + p.client}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 18, borderBottom: '1px solid ' + C.border }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '10px 16px',
              border: 'none',
              borderBottom: '3px solid ' + (tab === t.id ? C.amber : 'transparent'),
              background: 'transparent',
              cursor: 'pointer',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: 14,
              letterSpacing: 1,
              color: tab === t.id ? C.t1 : C.t3,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <Overview p={p} update={update} />}
      {tab === 'tasks' && <Tasks p={p} update={update} />}
      {tab === 'notes' && <Notes p={p} update={update} />}
      {tab === 'team' && <Team p={p} update={update} />}
    </div>
  )
}

// ── TEAM (supervisor assignment) ──────────────────────────────
function Team({ p, update }) {
  const assigned = projectSupervisorIds(p)
  return (
    <div>
      <Label style={{ fontSize: 14, marginBottom: 6 }}>ASSIGNED SUPERVISORS</Label>
      <div style={{ fontSize: 13, color: C.t2, marginBottom: 14 }}>
        Tap to add or remove. Supervisors only see projects they're assigned to.
        {assigned.length > 0 && ' Currently ' + assigned.length + ' assigned.'}
      </div>
      <Card>
        <SupervisorPicker
          project={p}
          onChange={(ids) => update({ ...p, supervisorIds: ids })}
        />
      </Card>
    </div>
  )
}

// ── OVERVIEW ──────────────────────────────────────────────────
function Overview({ p, update }) {
  const [open, setOpen] = useState(p.currentStage)

  // Mark a stage complete: set its status, advance currentStage to the next
  // incomplete stage, and activate it.
  const completeStage = (idx) => {
    const stages = p.stages.map((s, i) =>
      i === idx
        ? { ...s, status: 'complete', completedAt: new Date().toISOString() }
        : s
    )
    // find next stage that isn't complete
    let next = stages.findIndex((s, i) => i > idx && s.status !== 'complete')
    if (next === -1) next = Math.min(idx + 1, stages.length - 1)
    const withActive = stages.map((s, i) => ({
      ...s,
      status: i === next && s.status !== 'complete' ? 'active' : s.status,
    }))
    update({ ...p, stages: withActive, currentStage: next })
    setOpen(next)
  }

  // Reopen a completed stage: clear complete status, make it the active stage again.
  const reopenStage = (idx) => {
    const stages = p.stages.map((s, i) =>
      i === idx ? { ...s, status: 'active', completedAt: null } : s
    )
    update({ ...p, stages, currentStage: idx })
    setOpen(idx)
  }

  const setActive = (idx) => {
    update({ ...p, currentStage: idx })
    setOpen(idx)
  }

  return (
    <div>
      {p.stages.map((s, i) => {
        const col = stageColor(i)
        const done = s.tasks?.filter((t) => t.status === 'done').length || 0
        const total = s.tasks?.length || 0
        const pct = total ? Math.round((done / total) * 100) : 0
        const isComplete = s.status === 'complete'
        const isActive = !isComplete && i === p.currentStage
        const isExpanded = open === i
        const allTasksDone = total > 0 && done === total
        const barColor = isComplete ? C.green : col
        return (
          <Card
            key={s.id}
            style={{
              marginBottom: 10,
              padding: 0,
              borderLeft: '4px solid ' + (isComplete ? C.green : col),
              opacity: isComplete ? 0.92 : 1,
            }}
          >
            <button
              onClick={() => setOpen(isExpanded ? -1 : i)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: isComplete ? C.green : col,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 800,
                  fontSize: 14,
                  flexShrink: 0,
                }}
              >
                {isComplete ? '✓' : i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 700,
                    fontSize: 16,
                    color: C.t1,
                  }}
                >
                  {s.name}
                  {isComplete && (
                    <span style={{ marginLeft: 8, fontSize: 10, color: C.green }}>✓ COMPLETE</span>
                  )}
                  {isActive && (
                    <span style={{ marginLeft: 8, fontSize: 10, color: col }}>● ACTIVE</span>
                  )}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.t3 }}>
                  {done}/{total} tasks · {pct}%
                </div>
              </div>
              <span style={{ color: C.t3 }}>{isExpanded ? '▴' : '▾'}</span>
            </button>
            {total > 0 && (
              <div style={{ margin: '0 16px 8px', background: C.border, borderRadius: 4, height: 5, overflow: 'hidden' }}>
                <div style={{ width: pct + '%', height: '100%', background: barColor }} />
              </div>
            )}
            {isExpanded && (
              <div style={{ padding: '8px 16px 14px', borderTop: '1px solid ' + C.border }}>
                {(s.tasks || []).length === 0 && (
                  <div style={{ color: C.t3, fontSize: 13, padding: '8px 0' }}>No tasks in this stage</div>
                )}
                {(s.tasks || []).map((t) => (
                  <div
                    key={t.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}
                  >
                    <span style={{ color: t.status === 'done' ? C.green : C.t3, fontSize: 16 }}>
                      {t.status === 'done' ? '✓' : '○'}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        color: t.status === 'done' ? C.t3 : C.t1,
                        textDecoration: t.status === 'done' ? 'line-through' : 'none',
                      }}
                    >
                      {t.title}
                    </span>
                  </div>
                ))}

                {/* Stage action buttons */}
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  {isComplete ? (
                    <Btn variant="outline" onClick={() => reopenStage(i)} style={{ color: C.amber, borderColor: C.amber + '60' }}>
                      ↩ REOPEN STAGE
                    </Btn>
                  ) : (
                    <>
                      {!isActive && (
                        <Btn variant="outline" onClick={() => setActive(i)}>
                          SET AS ACTIVE
                        </Btn>
                      )}
                      <Btn variant="primary" onClick={() => completeStage(i)} style={{ background: C.green, color: '#fff' }}>
                        ✓ MARK STAGE COMPLETE
                      </Btn>
                    </>
                  )}
                </div>

                {allTasksDone && !isComplete && (
                  <div
                    style={{
                      marginTop: 10,
                      fontSize: 12,
                      color: C.green,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    ✓ All tasks done — ready to complete this stage
                  </div>
                )}
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}

// ── TASKS ─────────────────────────────────────────────────────
function Tasks({ p, update }) {
  const [stageId, setStageId] = useState(p.stages[p.currentStage]?.id || p.stages[0]?.id)
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('medium')

  const stage = p.stages.find((s) => s.id === stageId) || p.stages[0]

  const addTask = () => {
    if (!title.trim()) return
    const task = {
      id: uid(),
      title: title.trim(),
      status: 'todo',
      priority,
      createdAt: new Date().toISOString(),
    }
    const stages = p.stages.map((s) => (s.id === stageId ? { ...s, tasks: [...(s.tasks || []), task] } : s))
    update({ ...p, stages })
    setTitle('')
  }

  const toggleTask = (tid) => {
    const stages = p.stages.map((s) =>
      s.id === stageId
        ? {
            ...s,
            tasks: s.tasks.map((t) =>
              t.id === tid
                ? {
                    ...t,
                    status: t.status === 'done' ? 'todo' : 'done',
                    doneAt: t.status === 'done' ? null : new Date().toISOString(),
                  }
                : t
            ),
          }
        : s
    )
    update({ ...p, stages })
  }

  const deleteTask = (tid) => {
    const stages = p.stages.map((s) =>
      s.id === stageId ? { ...s, tasks: s.tasks.filter((t) => t.id !== tid) } : s
    )
    update({ ...p, stages })
  }

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Label style={{ fontSize: 14, marginBottom: 12 }}>ADD TASK</Label>
        <select
          value={stageId}
          onChange={(e) => setStageId(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', border: '1px solid ' + C.border, borderRadius: 8, marginBottom: 10, fontSize: 14 }}
        >
          {p.stages.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task description" style={{ marginBottom: 10 }} />
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {['high', 'medium', 'low'].map((pr) => (
            <button
              key={pr}
              onClick={() => setPriority(pr)}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: 8,
                border: '1px solid ' + (priority === pr ? C.amber : C.border),
                background: priority === pr ? C.amber + '15' : '#fff',
                cursor: 'pointer',
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                fontSize: 12,
                color: priority === pr ? C.amberD : C.t3,
              }}
            >
              {pr.toUpperCase()}
            </button>
          ))}
        </div>
        <Btn onClick={addTask} disabled={!title.trim()}>
          ADD TASK
        </Btn>
      </Card>

      <Label style={{ fontSize: 14, marginBottom: 10 }}>{stage?.name?.toUpperCase()} TASKS</Label>
      {(stage?.tasks || []).length === 0 && (
        <div style={{ color: C.t3, fontSize: 13, padding: 16 }}>No tasks yet</div>
      )}
      {(stage?.tasks || []).map((t) => (
        <Card key={t.id} style={{ marginBottom: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => toggleTask(t.id)}
            title={t.status === 'done' ? 'Tap to reopen' : 'Tap to mark done'}
            style={{
              width: 26,
              height: 26,
              borderRadius: '50%',
              border: '2px solid ' + (t.status === 'done' ? C.green : C.border),
              background: t.status === 'done' ? C.green : '#fff',
              color: '#fff',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            {t.status === 'done' ? '✓' : ''}
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 14,
                color: t.status === 'done' ? C.t3 : C.t1,
                textDecoration: t.status === 'done' ? 'line-through' : 'none',
              }}
            >
              {t.title}
            </div>
            {t.status === 'done' && (
              <button
                onClick={() => toggleTask(t.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: C.amber,
                  cursor: 'pointer',
                  fontSize: 11,
                  padding: 0,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                ↩ reopen
              </button>
            )}
          </div>
          <span
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: 10,
              color: t.priority === 'high' ? C.red : t.priority === 'medium' ? C.amber : C.green,
            }}
          >
            {(t.priority || 'medium').toUpperCase()}
          </span>
          <button
            onClick={() => {
              if (confirm('Delete task "' + t.title + '"?')) deleteTask(t.id)
            }}
            title="Delete task"
            style={{
              background: 'transparent',
              border: 'none',
              color: C.t3,
              cursor: 'pointer',
              fontSize: 16,
              padding: 0,
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </Card>
      ))}
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
    { k: 'achievements', label: '✅ ACHIEVED', ph: 'Completed work, milestones…' },
    { k: 'notes', label: '🔨 IN PROGRESS', ph: 'Active construction activities…' },
    { k: 'nextSteps', label: '→ NEXT STEPS', ph: 'Upcoming tasks, deliveries…' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <Label style={{ fontSize: 14, flex: 1 }}>SITE NOTES — {stage.name?.toUpperCase()}</Label>
        <Btn onClick={persist} variant={saved ? 'outline' : 'primary'}>
          {saved ? 'SAVED' : 'SAVE NOTES'}
        </Btn>
      </div>
      {fields.map((f) => (
        <div key={f.k} style={{ marginBottom: 18 }}>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              color: C.t2,
              letterSpacing: 1,
              marginBottom: 8,
            }}
          >
            {f.label}
          </div>
          <textarea
            value={local[f.k]}
            onChange={change(f.k)}
            placeholder={f.ph}
            style={{
              width: '100%',
              minHeight: 90,
              padding: '10px 12px',
              border: '1px solid ' + C.border,
              borderRadius: 8,
              fontFamily: "'Barlow', sans-serif",
              fontSize: 14,
              lineHeight: 1.6,
              resize: 'vertical',
              outline: 'none',
            }}
          />
        </div>
      ))}
    </div>
  )
}
