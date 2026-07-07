import { useState, useEffect, useRef } from 'react'
import { fetchFiles, createProjectFile, updateProjectFile, deleteProjectFile, fileUrl } from '../../lib/api'
import { fmtDate } from '../../lib/helpers'
import { Spinner, Empty, Banner, IconChip, Btn, Card, Input, Field, Modal } from '../../components/ui'
import Icon from '../../components/icons'

const MAX_MB = 25

export const FILE_CATEGORIES = [
  { id: 'drawings', label: 'Architectural Drawings', icon: 'projects', tint: 'accent' },
  { id: 'engineering', label: 'Structural Engineering', icon: 'target', tint: 'red' },
  { id: 'soil', label: 'Soil Report', icon: 'note', tint: 'ink' },
  { id: 'energy', label: 'Energy Ratings', icon: 'bell', tint: 'amber' },
  { id: 'safety', label: 'Safety & OHS', icon: 'flag', tint: 'amber' },
  { id: 'permits', label: 'Permits', icon: 'key', tint: 'green' },
  { id: 'other', label: 'Other', icon: 'note', tint: 'ink' },
]
const catOf = (id) => FILE_CATEGORIES.find((c) => c.id === id) || FILE_CATEGORIES[FILE_CATEGORIES.length - 1]

const fmtSize = (b) => {
  if (!b) return ''
  if (b < 1024) return b + ' B'
  if (b < 1048576) return (b / 1024).toFixed(0) + ' KB'
  return (b / 1048576).toFixed(1) + ' MB'
}

export default function FilesTab({ p, isAdmin, user, profile }) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(null) // category id or 'new'
  const [editing, setEditing] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    fetchFiles(p.id)
      .then(setFiles)
      .catch((e) => setErr(/relation .*pm_files|column .*category/i.test(e.message || '') ? 'Run update-v1.6.sql in Supabase to enable project files.' : e.message))
      .finally(() => setLoading(false))
  }, [p.id])

  const remove = async (f) => {
    if (!confirm('Delete "' + f.name + '"?')) return
    try {
      await deleteProjectFile(f)
      setFiles((fs) => fs.filter((x) => x.id !== f.id))
    } catch (e) { alert(e.message) }
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 44 }}><Spinner /></div>

  const groups = FILE_CATEGORIES.map((c) => ({ cat: c, items: files.filter((f) => (f.category || 'other') === c.id) }))
  const withFiles = groups.filter((g) => g.items.length > 0)
  const emptyCats = groups.filter((g) => g.items.length === 0 && g.cat.id !== 'other')

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <div className="h2">Project files</div>
          <div className="sub">{files.length} file{files.length === 1 ? '' : 's'} · uploads or links to Drive / Dropbox</div>
        </div>
        <Btn onClick={() => setAdding('new')}>
          <Icon name="plus" size={15} /> Add file
        </Btn>
      </div>

      {err && <Banner tone="red">{err}</Banner>}

      {files.length === 0 && !err && (
        <Empty icon="note" title="No files yet">
          Add drawings, engineering, soil reports, permits — upload the file or paste a Drive link.
        </Empty>
      )}

      {withFiles.map(({ cat, items }) => (
        <div key={cat.id} style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <IconChip icon={cat.icon} tint={cat.tint} sm />
            <div className="h2" style={{ flex: 1, fontSize: 13.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{cat.label}</div>
            <button className="btn btn-ghost" onClick={() => setAdding(cat.id)}>
              <Icon name="plus" size={13} /> Add
            </button>
          </div>
          <div className="card" style={{ overflow: 'hidden' }}>
            {items.map((f) => (
              <div key={f.id} className="row">
                <IconChip icon={f.link_url ? 'swap' : 'note'} tint={cat.tint} sm />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                  <div className="sub" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {f.link_url ? 'Link' : fmtSize(f.size) || 'File'} · {f.uploaded_by_name || 'Team'} · {fmtDate(f.created_at)}
                    {f.description ? ' · ' + f.description : ''}
                  </div>
                </div>
                <a className="btn btn-outline" href={fileUrl(f)} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                  Open
                </a>
                <button className="btn btn-ghost btn-icon" title="Edit" onClick={() => setEditing(f)}>
                  <Icon name="note" size={14} />
                </button>
                {isAdmin && (
                  <button className="btn btn-ghost btn-icon" style={{ color: 'var(--ink-3)' }} title="Delete" onClick={() => remove(f)}>
                    <Icon name="trash" size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {files.length > 0 && emptyCats.length > 0 && (
        <>
          <div className="overline" style={{ marginBottom: 8 }}>Add more files</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {emptyCats.map(({ cat }) => (
              <button key={cat.id} className="pill" onClick={() => setAdding(cat.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Icon name={cat.icon} size={13} /> {cat.label}
              </button>
            ))}
          </div>
        </>
      )}

      {adding && (
        <AddFileModal
          initialCat={adding === 'new' ? 'drawings' : adding}
          onClose={() => setAdding(null)}
          onCreate={async (draft) => {
            const row = await createProjectFile({
              ...draft,
              projectId: p.id,
              userId: user?.id,
              userName: profile?.full_name || profile?.email || '',
            })
            setFiles((fs) => [row, ...fs])
            setAdding(null)
          }}
        />
      )}

      {editing && (
        <EditFileModal
          file={editing}
          onClose={() => setEditing(null)}
          onSave={async (patch) => {
            const row = await updateProjectFile(editing.id, patch)
            setFiles((fs) => fs.map((x) => (x.id === row.id ? row : x)))
            setEditing(null)
          }}
        />
      )}
    </div>
  )
}

function AddFileModal({ initialCat, onClose, onCreate }) {
  const [category, setCategory] = useState(initialCat)
  const [name, setName] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [file, setFile] = useState(null)
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const inputRef = useRef()

  const pick = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > MAX_MB * 1048576) {
      setErr('File is over ' + MAX_MB + ' MB — paste a Drive/Dropbox link instead.')
      e.target.value = ''
      return
    }
    setErr('')
    setFile(f)
    if (!name.trim()) setName(f.name.replace(/\.[^.]+$/, ''))
  }

  const submit = async () => {
    if (!name.trim()) return setErr('Give the file a name')
    if (!file && !linkUrl.trim()) return setErr('Upload a file or paste a link')
    setBusy(true); setErr('')
    try {
      await onCreate({ name: name.trim(), category, description: description.trim(), file, linkUrl: linkUrl.trim() })
    } catch (e) {
      setErr(e.message || 'Could not add the file')
      setBusy(false)
    }
  }

  return (
    <Modal title="Add file" onClose={onClose}>
      <Field label="File category">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {FILE_CATEGORIES.filter((c) => c.id !== 'other').concat(FILE_CATEGORIES.filter((c) => c.id === 'other')).map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                borderRadius: 'var(--r)', cursor: 'pointer', fontSize: 12.5, fontWeight: 500, textAlign: 'left',
                border: '1px solid ' + (category === c.id ? 'var(--accent)' : 'var(--line-2)'),
                background: category === c.id ? 'var(--accent-soft)' : 'var(--surface)',
                color: category === c.id ? 'var(--accent-strong)' : 'var(--ink)',
              }}
            >
              <Icon name={c.icon} size={14} /> {c.label}
            </button>
          ))}
        </div>
      </Field>

      <Input label="File name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Architectural Plans Rev 3" />
      <Input label="File link (Google Drive, Dropbox, SharePoint…)" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://drive.google.com/file/…" />

      <Field label={'Or upload file (max ' + MAX_MB + ' MB)'}>
        <button
          onClick={() => inputRef.current?.click()}
          style={{ width: '100%', border: '1.5px dashed var(--line-2)', borderRadius: 'var(--r)', background: 'var(--surface-2)', padding: '14px 12px', cursor: 'pointer', fontSize: 13, color: file ? 'var(--accent-strong)' : 'var(--ink-2)', fontWeight: file ? 600 : 400 }}
        >
          {file ? file.name + ' · ' + fmtSize(file.size) : 'Choose file to upload'}
        </button>
        <input ref={inputRef} type="file" onChange={pick} style={{ display: 'none' }} />
      </Field>

      <Input label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Approved by council May 2026" />

      {err && <div style={{ color: 'var(--red)', fontSize: 13, marginBottom: 10 }}>{err}</div>}
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <Btn onClick={submit} disabled={busy} size="lg" style={{ flex: 1 }}>
          {busy ? 'Adding…' : 'Add file'}
        </Btn>
        <Btn variant="outline" size="lg" onClick={onClose}>Cancel</Btn>
      </div>
    </Modal>
  )
}

function EditFileModal({ file, onClose, onSave }) {
  const [name, setName] = useState(file.name)
  const [category, setCategory] = useState(file.category || 'other')
  const [description, setDescription] = useState(file.description || '')
  const [linkUrl, setLinkUrl] = useState(file.link_url || '')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (!name.trim()) return
    setBusy(true)
    try {
      await onSave({ name: name.trim(), category, description: description.trim(), ...(file.link_url ? { link_url: linkUrl.trim() } : {}) })
    } catch (e) {
      alert(e.message)
      setBusy(false)
    }
  }

  return (
    <Modal title="Edit file" onClose={onClose}>
      <Input label="File name" value={name} onChange={(e) => setName(e.target.value)} />
      <Field label="Category">
        <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
          {FILE_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </Field>
      {file.link_url && <Input label="File link" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />}
      <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <Btn onClick={submit} disabled={busy} size="lg" style={{ flex: 1 }}>{busy ? 'Saving…' : 'Save'}</Btn>
        <Btn variant="outline" size="lg" onClick={onClose}>Cancel</Btn>
      </div>
    </Modal>
  )
}
