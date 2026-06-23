import { useState } from 'react'
import { C } from '../../lib/constants'
import { computeStats, buildReminders, buildActivity, buildNotes } from '../../lib/derive'
import { fmtDateShort, timeAgo } from '../../lib/constants'
import { Card, Label, Spinner, Pill } from '../../components/ui'

export default function AdminDashboard({ projects, loaded, error, onOpenProject, onGoProjects }) {
  const [dismissed, setDismissed] = useState([])

  const stats = computeStats(projects)
  const reminders = buildReminders(projects)
    .filter((r) => !dismissed.includes(r.id))
    .slice(0, 12)
  const activity = buildActivity(projects)
    .filter((a) => !dismissed.includes(a.id))
    .slice(0, 8)
  const notes = buildNotes(projects).slice(0, 5)
  const recent = [...projects]
    .sort((a, b) => new Date(b._updated || b.createdAt) - new Date(a._updated || a.createdAt))
    .slice(0, 6)

  const hour = new Date().getHours()
  const greet = hour < 12 ? 'GOOD MORNING' : hour < 17 ? 'GOOD AFTERNOON' : 'GOOD EVENING'
  const dateStr = new Date().toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const dismiss = (id) => setDismissed((d) => [...d, id])

  const statCards = [
    { label: 'TOTAL PROJECTS', val: stats.total, color: C.t1, bg: '#EEF2FF' },
    { label: 'ACTIVE', val: stats.active, color: C.amber, bg: '#FFFBEB' },
    { label: 'COMPLETED', val: stats.completed, color: C.green, bg: '#F0FDF4' },
    { label: 'TASKS DONE', val: stats.doneTasks + '/' + stats.allTasks, color: C.blue, bg: '#EFF6FF' },
    { label: 'COMPLETION', val: stats.pct + '%', color: C.purple, bg: '#FAF5FF' },
  ]

  return (
    <div>
      {/* Sync / error banner */}
      {!loaded && (
        <div
          style={{
            background: C.amber + '15',
            border: '1px solid ' + C.amber + '40',
            borderRadius: 8,
            padding: '8px 14px',
            marginBottom: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            color: C.amber,
          }}
        >
          <Spinner size={14} /> Syncing latest data…
        </div>
      )}
      {error && (
        <div
          style={{
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: 8,
            padding: '10px 14px',
            marginBottom: 14,
            fontSize: 13,
            color: C.red,
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Reminders */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <Label>🔔 REMINDERS &amp; TASKS</Label>
        {reminders.length > 0 && <Pill color={C.red}>{reminders.length}</Pill>}
      </div>
      {reminders.length === 0 ? (
        <Card style={{ color: C.t3, fontStyle: 'italic', fontSize: 13, marginBottom: 22 }}>
          No overdue tasks or upcoming deadlines — all clear! ✓
        </Card>
      ) : (
        <div style={gridStyle}>
          {reminders.map((r) => (
            <ReminderCard key={r.id} item={r} onDismiss={dismiss} onClick={onOpenProject} />
          ))}
        </div>
      )}

      {/* Activity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '22px 0 12px' }}>
        <Label>📝 RECENT NOTES &amp; ACTIVITY</Label>
        {activity.length > 0 && <Pill color={C.purple}>{activity.length}</Pill>}
      </div>
      {activity.length === 0 ? (
        <Card style={{ color: C.t3, fontStyle: 'italic', fontSize: 13, marginBottom: 22 }}>
          No recent activity — completed tasks will appear here
        </Card>
      ) : (
        <div style={gridStyle}>
          {activity.map((a) => (
            <ActivityCard key={a.id} item={a} onDismiss={dismiss} />
          ))}
        </div>
      )}

      {/* Greeting */}
      <div
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 800,
          fontSize: 28,
          color: C.t1,
          margin: '28px 0 2px',
        }}
      >
        {greet}
      </div>
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          color: C.t3,
          marginBottom: 20,
        }}
      >
        {dateStr} · AEST
      </div>

      {/* Stats */}
      <div
        className="stat-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        {statCards.map((c) => (
          <button
            key={c.label}
            onClick={onGoProjects}
            style={{
              background: c.bg,
              border: '1px solid ' + c.color + '30',
              borderRadius: 12,
              padding: '18px 14px',
              textAlign: 'center',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 800,
                fontSize: 40,
                color: c.color,
                lineHeight: 1,
                marginBottom: 6,
              }}
            >
              {c.val}
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                color: c.color,
                letterSpacing: 1,
              }}
            >
              {c.label}
            </div>
          </button>
        ))}
      </div>

      {/* Recent projects + notes */}
      <div
        className="grid-2col"
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}
      >
        <Card>
          <Label style={{ fontSize: 14, marginBottom: 12 }}>RECENT PROJECTS</Label>
          {recent.length === 0 && (
            <div style={{ color: C.t3, fontSize: 13, textAlign: 'center', padding: 20 }}>
              No projects yet
            </div>
          )}
          {recent.map((p) => {
            const sc = p.stages?.length || 0
            const pct = sc <= 1 ? 0 : Math.round((p.currentStage / (sc - 1)) * 100)
            const isDone = p.currentStage >= sc - 1
            const pc = p.color || C.amber
            const tt = p.stages?.reduce((a, s) => a + (s.tasks?.length || 0), 0) || 0
            const td =
              p.stages?.reduce(
                (a, s) => a + (s.tasks?.filter((t) => t.status === 'done').length || 0),
                0
              ) || 0
            return (
              <button
                key={p.id}
                onClick={() => onOpenProject(p)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: C.bg,
                  border: '1px solid ' + C.border,
                  borderLeft: '4px solid ' + pc,
                  borderRadius: 10,
                  padding: '10px 13px',
                  marginBottom: 8,
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 700,
                    fontSize: 15,
                    color: C.t1,
                    marginBottom: 3,
                  }}
                >
                  {p.name}
                </div>
                <div style={{ fontSize: 11, color: C.t2, marginBottom: 6 }}>
                  {p.location || 'No location'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ flex: 1, background: C.border, borderRadius: 3, height: 5 }}>
                    <div
                      style={{
                        width: pct + '%',
                        height: '100%',
                        background: isDone ? C.green : pc,
                        borderRadius: 3,
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 700,
                      fontSize: 12,
                      color: isDone ? C.green : pc,
                    }}
                  >
                    {pct}%
                  </span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.t3 }}>
                    {td}/{tt}
                  </span>
                </div>
              </button>
            )
          })}
        </Card>

        <Card>
          <Label style={{ fontSize: 14, marginBottom: 12 }}>SUPERVISOR NOTES</Label>
          {notes.length === 0 && (
            <div style={{ color: C.t3, fontSize: 12, textAlign: 'center', padding: 20 }}>
              No notes yet
            </div>
          )}
          {notes.map((n, i) => (
            <button
              key={i}
              onClick={() => onOpenProject(n.project)}
              style={{
                width: '100%',
                textAlign: 'left',
                background: C.bg,
                border: '1px solid ' + C.border,
                borderLeft: '3px solid ' + C.purple,
                borderRadius: 8,
                padding: '9px 11px',
                marginBottom: 7,
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <div
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 700,
                    fontSize: 13,
                    color: C.t1,
                  }}
                >
                  {n.project.name}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.purple }}>
                  {timeAgo(n.notedAt)}
                </div>
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9,
                  color: C.purple,
                  marginBottom: 4,
                }}
              >
                {n.stage.name}
              </div>
              {n.achievements && (
                <div style={oneLine(C.green)}>{n.achievements}</div>
              )}
              {n.notes && <div style={oneLine(C.t2)}>{n.notes}</div>}
            </button>
          ))}
        </Card>
      </div>
    </div>
  )
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))',
  gap: 10,
}

const oneLine = (color) => ({
  fontSize: 11,
  color,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
})

function ReminderCard({ item, onDismiss, onClick }) {
  const pri = item.priority
  const priBg = pri === 'high' ? '#FEE2E2' : pri === 'medium' ? '#FEF3C7' : '#F0FDF4'
  const priColor = pri === 'high' ? '#DC2626' : pri === 'medium' ? '#B8960C' : '#16A34A'
  return (
    <div
      onClick={() => onClick && onClick(item.proj)}
      style={{
        background: '#fff',
        border: '1px solid ' + C.border,
        borderLeft: '4px solid ' + item.color,
        borderRadius: 12,
        padding: '14px 16px',
        cursor: 'pointer',
        position: 'relative',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}
    >
      <button onClick={(e) => { e.stopPropagation(); onDismiss(item.id) }} style={xBtn}>
        ×
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 18 }}>{item.icon}</span>
        <div
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: 12,
            color: item.color,
            letterSpacing: 1,
          }}
        >
          {item.title}
        </div>
        {pri && (
          <div
            style={{
              background: priBg,
              border: '1px solid ' + priColor + '40',
              borderRadius: 5,
              padding: '2px 8px',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: 10,
              color: priColor,
              marginLeft: 'auto',
              marginRight: 18,
            }}
          >
            {pri.toUpperCase()}
          </div>
        )}
      </div>
      <div
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: 18,
          color: C.t1,
          marginBottom: 4,
          lineHeight: 1.2,
        }}
      >
        {item.desc}
      </div>
      {item.dueDate && (
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: item.color, marginBottom: 4 }}>
          DUE: {fmtDateShort(item.dueDate)}
        </div>
      )}
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.t3 }}>
        📁 {item.project}
      </div>
    </div>
  )
}

function ActivityCard({ item, onDismiss }) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid ' + C.border,
        borderLeft: '4px solid ' + item.color,
        borderRadius: 12,
        padding: '14px 16px',
        position: 'relative',
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      }}
    >
      <button onClick={() => onDismiss(item.id)} style={xBtn}>
        ×
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 16 }}>{item.icon}</span>
        <div
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: 12,
            color: item.color,
            letterSpacing: 1,
          }}
        >
          {item.title}
        </div>
      </div>
      <div
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: 18,
          color: C.t1,
          marginBottom: 4,
          lineHeight: 1.2,
        }}
      >
        {item.desc}
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.t3 }}>
        📁 {item.project}
      </div>
    </div>
  )
}

const xBtn = {
  position: 'absolute',
  top: 8,
  right: 10,
  background: 'transparent',
  border: 'none',
  color: C.t3,
  cursor: 'pointer',
  fontSize: 18,
  lineHeight: 1,
  padding: 0,
}
