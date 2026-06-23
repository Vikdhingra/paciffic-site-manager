import { useState, useEffect } from 'react'
import { C, isAdminRole, projectSupervisorIds } from '../../lib/constants'
import { newProject, fetchAllProfiles } from '../../lib/db'
import { Card, Label, Btn, Input } from '../../components/ui'
import SupervisorPicker from '../../components/SupervisorPicker'

export default function ProjectsList({ projects, profile, save, remove, onOpenProject }) {
  const [creating, setCreating] = useState(false)
  const [people, setPeople] = useState({})

  useEffect(() => {
    fetchAllProfiles()
      .then((all) => {
        const map = {}
        all.forEach((u) => (map[u.id] = u.full_name || u.email))
        setPeople(map)
      })
      .catch(() => {})
  }, [])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
        <Label style={{ fontSize: 20, flex: 1 }}>ALL PROJECTS</Label>
        <Btn onClick={() => setCreating(true)}>+ NEW PROJECT</Btn>
      </div>

      {creating && (
        <NewProjectForm
          onCancel={() => setCreating(false)}
          onCreate={async (p) => {
            await save(p)
            setCreating(false)
          }}
        />
      )}

      {projects.length === 0 && !creating && (
        <Card style={{ textAlign: 'center', padding: 40, color: C.t3 }}>
          No projects yet. Tap “+ NEW PROJECT” to create one.
        </Card>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 12 }}>
        {projects.map((p) => {
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
          const stageName = p.stages?.[p.currentStage]?.name || ''
          return (
            <Card key={p.id} style={{ borderLeft: '5px solid ' + pc, cursor: 'pointer', padding: 0 }}>
              <div onClick={() => onOpenProject(p)} style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 800,
                        fontSize: 20,
                        color: C.t1,
                      }}
                    >
                      {p.name}
                    </div>
                    <div style={{ fontSize: 12, color: C.t2, marginTop: 2 }}>📍 {p.location || '—'}</div>
                    {p.client && <div style={{ fontSize: 12, color: C.t2 }}>👤 {p.client}</div>}
                  </div>
                  <div
                    style={{
                      background: isDone ? C.green : pc,
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

                <div
                  style={{
                    background: C.bg,
                    borderRadius: 8,
                    padding: '8px 12px',
                    margin: '12px 0 8px',
                  }}
                >
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: pc }}>
                    STAGE {Math.min(p.currentStage + 1, sc)}/{sc}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 700,
                      fontSize: 15,
                      color: C.t1,
                    }}
                  >
                    {stageName}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, background: C.border, borderRadius: 3, height: 6 }}>
                    <div
                      style={{
                        width: pct + '%',
                        height: '100%',
                        background: isDone ? C.green : pc,
                        borderRadius: 3,
                      }}
                    />
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: C.t3 }}>
                    {td}/{tt} tasks
                  </span>
                </div>

                {/* Assigned supervisors */}
                {(() => {
                  const ids = projectSupervisorIds(p)
                  if (ids.length === 0)
                    return (
                      <div style={{ fontSize: 11, color: C.t3, marginTop: 8, fontStyle: 'italic' }}>
                        👷 No supervisor assigned
                      </div>
                    )
                  return (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                      {ids.map((id) => (
                        <span
                          key={id}
                          style={{
                            background: C.blue + '12',
                            border: '1px solid ' + C.blue + '30',
                            borderRadius: 12,
                            padding: '2px 9px',
                            fontSize: 11,
                            color: C.blue,
                            fontWeight: 600,
                          }}
                        >
                          👷 {people[id] || 'Supervisor'}
                        </span>
                      ))}
                    </div>
                  )
                })()}
              </div>

              {isAdminRole(profile.role) && (
                <div style={{ borderTop: '1px solid ' + C.border, padding: '8px 16px', display: 'flex', gap: 8 }}>
                  <Btn variant="ghost" onClick={() => onOpenProject(p)} style={{ color: C.blue }}>
                    OPEN
                  </Btn>
                  <Btn
                    variant="ghost"
                    onClick={() => {
                      if (confirm('Delete project "' + p.name + '"? This cannot be undone.')) remove(p.id)
                    }}
                    style={{ color: C.red, marginLeft: 'auto' }}
                  >
                    DELETE
                  </Btn>
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function NewProjectForm({ onCancel, onCreate }) {
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [client, setClient] = useState('')
  const [supervisorIds, setSupervisorIds] = useState([])
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (!name.trim()) return
    setBusy(true)
    await onCreate(
      newProject({
        name: name.trim(),
        location: location.trim(),
        client: client.trim(),
        supervisorIds,
      })
    )
    setBusy(false)
  }

  return (
    <Card style={{ marginBottom: 18, border: '2px solid ' + C.amber }}>
      <Label style={{ fontSize: 16, marginBottom: 12 }}>NEW PROJECT</Label>
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Project name (e.g. Lot 531)" style={{ marginBottom: 10 }} />
      <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Site address" style={{ marginBottom: 10 }} />
      <Input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Client / builder" style={{ marginBottom: 14 }} />
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          color: C.t2,
          letterSpacing: 1,
          marginBottom: 8,
        }}
      >
        ASSIGN SUPERVISORS (optional)
      </div>
      <div style={{ marginBottom: 14 }}>
        <SupervisorPicker
          project={{ supervisorIds }}
          onChange={setSupervisorIds}
          compact
        />
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <Btn onClick={submit} disabled={busy || !name.trim()}>
          {busy ? 'CREATING…' : 'CREATE PROJECT'}
        </Btn>
        <Btn variant="outline" onClick={onCancel}>
          CANCEL
        </Btn>
      </div>
    </Card>
  )
}
