import Icon from './icons'

export function Spinner({ size = 40 }) {
  return (
    <div
      className="spinner"
      style={{ width: size, height: size, borderWidth: size > 24 ? 4 : 3 }}
    />
  )
}

export function FullSplash({ label = 'Loading…' }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        background: 'var(--paper)',
      }}
    >
      <Spinner size={48} />
      <div className="eyebrow">{label}</div>
    </div>
  )
}

export function Label({ children, style }) {
  return (
    <div className="h-card" style={style}>
      {children}
    </div>
  )
}

export function Eyebrow({ children, style }) {
  return (
    <div className="eyebrow" style={style}>
      {children}
    </div>
  )
}

// Variant map keeps the old API working across untouched files.
const VARIANT_CLASS = {
  primary: 'btn-primary',
  dark: 'btn-navy',
  navy: 'btn-navy',
  green: 'btn-green',
  outline: 'btn-outline',
  danger: 'btn-danger',
  ghost: 'btn-ghost',
  onnavy: 'btn-onnavy',
}

export function Btn({ children, onClick, variant = 'primary', style, disabled, type = 'button', size, block, icon }) {
  const cls = [
    'btn',
    VARIANT_CLASS[variant] || 'btn-primary',
    size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '',
    block ? 'btn-block' : '',
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls} style={style}>
      {icon && <Icon name={icon} size={size === 'sm' ? 15 : 17} />}
      {children}
    </button>
  )
}

export function Card({ children, style, onClick, className = '' }) {
  return (
    <div
      onClick={onClick}
      className={['card', onClick ? 'card-tap' : '', className].filter(Boolean).join(' ')}
      style={{ padding: 18, ...style }}
    >
      {children}
    </div>
  )
}

export function Input({ value, onChange, placeholder, type = 'text', style, label }) {
  const input = (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="input"
      style={label ? undefined : style}
    />
  )
  if (!label) return input
  return (
    <div style={style}>
      <label className="field-label">{label}</label>
      {input}
    </div>
  )
}

const CHIP_CLASS = {
  gold: 'chip-gold',
  green: 'chip-green',
  red: 'chip-red',
  blue: 'chip-blue',
  navy: 'chip-navy',
}

export function Pill({ children, tone = 'gold', color, icon }) {
  // `color` kept for backward compatibility: map old hex colours to tones.
  let t = tone
  if (color) {
    if (color === '#DC2626' || color === '#C0361F') t = 'red'
    else if (color === '#059669' || color === '#157F3D') t = 'green'
    else if (color === '#0284C7' || color === '#1D5FA8') t = 'blue'
    else if (color === '#7C3AED') t = 'blue'
    else t = 'gold'
  }
  return (
    <span className={['chip', CHIP_CLASS[t] || 'chip-gold'].join(' ')}>
      {icon && <Icon name={icon} size={13} />}
      {children}
    </span>
  )
}

// ── STAGE RAIL — segmented build-sequence bar (signature) ────
export function StageRail({ project, large, style }) {
  const stages = project.stages || []
  const cur = project.currentStage ?? 0
  return (
    <div className={['rail', large ? 'rail-lg' : ''].join(' ')} style={style} title="Build stages">
      {stages.map((s, i) => {
        const done = s.status === 'complete' || i < cur
        const active = !done && i === cur
        return (
          <div
            key={s.id || i}
            className={['rail-seg', done ? 'done' : active ? 'active' : ''].join(' ')}
          />
        )
      })}
    </div>
  )
}

// Project completion % — same formula used app-wide.
export function projectPct(p) {
  const sc = p.stages?.length || 0
  if (sc <= 1) return 0
  return Math.round(((p.currentStage ?? 0) / (sc - 1)) * 100)
}

export function projectIsDone(p) {
  const sc = p.stages?.length || 0
  return sc > 0 && (p.currentStage ?? 0) >= sc - 1
}

export function taskCounts(p) {
  let total = 0
  let done = 0
  p.stages?.forEach((s) =>
    s.tasks?.forEach((t) => {
      total++
      if (t.status === 'done') done++
    })
  )
  return { total, done }
}

// ── Modal (bottom sheet on mobile, centred on desktop) ───────
export function Modal({ title, onClose, children }) {
  return (
    <div className="modal-veil" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
          <div className="h-card" style={{ flex: 1, fontSize: 20 }}>
            {title}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'var(--paper)',
              border: '1px solid var(--line)',
              borderRadius: 8,
              width: 34,
              height: 34,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--ink-2)',
            }}
          >
            <Icon name="close" size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function EmptyState({ icon = 'projects', title, children }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '44px 20px' }}>
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          background: 'var(--paper)',
          border: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 14px',
          color: 'var(--ink-3)',
        }}
      >
        <Icon name={icon} size={26} />
      </div>
      <div className="h-card" style={{ marginBottom: 5 }}>{title}</div>
      <div style={{ fontSize: 13.5, color: 'var(--ink-3)' }}>{children}</div>
    </div>
  )
}
