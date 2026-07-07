import { useState, useEffect, useRef } from 'react'
import { fetchFiles, uploadProjectFile, deleteProjectFile, fileUrl } from '../../lib/api'
import { fmtDate } from '../../lib/helpers'
import { Spinner, Empty, Banner, IconChip } from '../../components/ui'
import Icon from '../../components/icons'

const MAX_MB = 25

const fmtSize = (b) => {
  if (!b) return ''
  if (b < 1024) return b + ' B'
  if (b < 1048576) return (b / 1024).toFixed(0) + ' KB'
  return (b / 1048576).toFixed(1) + ' MB'
}

const kindOf = (f) => {
  const m = (f.mime || '').toLowerCase()
  const n = (f.name || '').toLowerCase()
  if (m.includes('pdf') || n.endsWith('.pdf')) return { label: 'PDF', tint: 'red' }
  if (m.startsWith('image/')) return { label: 'Image', tint: 'accent' }
  if (n.match(/\.(xls|xlsx|csv)$/)) return { label: 'Sheet', tint: 'green' }
  if (n.match(/\.(doc|docx)$/)) return { label: 'Doc', tint: 'accent' }
  if (n.match(/\.(dwg|dxf|skp)$/)) return { label: 'Plan', tint: 'amber' }
  return { label: 'File', tint: 'ink' }
}

export default function FilesTab({ p, isAdmin, user, profile }) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState('')
  const inputRef = useRef()

  useEffect(() => {
    fetchFiles(p.id)
      .then(setFiles)
      .catch((e) => setErr(/relation .*pm_files/i.test(e.message || '') ? 'Run update-v1.5.sql in Supabase to enable project files.' : e.message))
      .finally(() => setLoading(false))
  }, [p.id])

  const onPick = async (e) => {
    const picked = Array.from(e.target.files || [])
    if (!picked.length) return
    setErr('')
    const tooBig = picked.find((f) => f.size > MAX_MB * 1048576)
    if (tooBig) {
      setErr('"' + tooBig.name + '" is over ' + MAX_MB + ' MB — email large files or share a link instead.')
      if (inputRef.current) inputRef.current.value = ''
      return
    }
    setUploading(true)
    try {
      for (const f of picked) {
        const row = await uploadProjectFile({
          projectId: p.id,
          file: f,
          userId: user?.id,
          userName: profile?.full_name || profile?.email || '',
        })
        setFiles((fs) => [row, ...fs])
      }
    } catch (e2) {
      setErr(e2.message || 'Upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const remove = async (f) => {
    if (!confirm('Delete "' + f.name + '"?')) return
    try {
      await deleteProjectFile(f)
      setFiles((fs) => fs.filter((x) => x.id !== f.id))
    } catch (e) { alert(e.message) }
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 44 }}><Spinner /></div>

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
        <button className="btn btn-primary" onClick={() => inputRef.current?.click()} disabled={uploading}>
          <Icon name="plus" size={15} /> {uploading ? 'Uploading…' : 'Upload files'}
        </button>
        <input ref={inputRef} type="file" multiple onChange={onPick} style={{ display: 'none' }} />
        <span className="sub">Plans, permits, contracts, specs — up to {MAX_MB} MB each</span>
      </div>

      {err && <Banner tone="red">{err}</Banner>}

      {files.length === 0 ? (
        <Empty icon="note" title="No files yet">
          Upload drawings, permits, engineering docs — anything the site or office needs on hand.
        </Empty>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          {files.map((f) => {
            const k = kindOf(f)
            return (
              <div key={f.id} className="row">
                <IconChip icon="note" tint={k.tint} sm />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                  <div className="sub">
                    {k.label}{f.size ? ' · ' + fmtSize(f.size) : ''} · {f.uploaded_by_name || 'Team'} · {fmtDate(f.created_at)}
                  </div>
                </div>
                <a className="btn btn-outline" href={fileUrl(f)} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                  Open
                </a>
                {isAdmin && (
                  <button className="btn btn-ghost btn-icon" style={{ color: 'var(--ink-3)' }} title="Delete" onClick={() => remove(f)}>
                    <Icon name="trash" size={15} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
