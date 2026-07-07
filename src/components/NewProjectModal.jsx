import { useState } from 'react'
import { newProject } from '../lib/db'
import { Btn, Input, Modal } from './ui'
import SupervisorPicker from './SupervisorPicker'

// One-tap-from-anywhere project creation (header button / mobile FAB).
export default function NewProjectModal({ onClose, onCreate }) {
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
    onClose()
  }

  return (
    <Modal title="New project" onClose={onClose}>
      <Input label="Project name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Lot 531 Wollahra Rise" style={{ marginBottom: 14 }} />
      <Input label="Site address" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Street, suburb" style={{ marginBottom: 14 }} />
      <Input label="Client / builder" value={client} onChange={(e) => setClient(e.target.value)} placeholder="Optional" style={{ marginBottom: 16 }} />
      <label className="field-label">Assign supervisors (optional)</label>
      <div style={{ marginBottom: 20 }}>
        <SupervisorPicker project={{ supervisorIds }} onChange={setSupervisorIds} compact />
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <Btn onClick={submit} disabled={busy || !name.trim()} size="lg" style={{ flex: 1 }}>
          {busy ? 'Creating…' : 'Create project'}
        </Btn>
        <Btn variant="outline" onClick={onClose} size="lg">
          Cancel
        </Btn>
      </div>
    </Modal>
  )
}
