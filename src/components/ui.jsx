import Icon from './icons'

export function Spinner({ size = 32 }) {
  return <div className="spinner" style={{ width: size, height: size }} />
}

export function Splash({ label = 'Loading…' }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
      <Spinner size={36} />
      <div className="sub">{label}</div>
    </div>
  )
}

const BTN = {
  primary: 'btn-primary',
  green: 'btn-green',
  outline: 'btn-outline',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
}

export function Btn({ children, onClick, variant = 'primary', size, block, icon, disabled, style, type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={style}
      className={['btn', BTN[variant] || 'btn-primary', size === 'lg' ? 'btn-lg' : '', block ? 'btn-block' : ''].filter(Boolean).join(' ')}
    >
      {icon && <Icon name={icon} size={size === 'lg' ? 16 : 15} />}
      {children}
    </button>
  )
}

export function Card({ children, style, onClick, pad = 16 }) {
  return (
    <div onClick={onClick} className={['card', onClick ? 'card-tap' : ''].join(' ')} style={{ padding: pad, ...style }}>
      {children}
    </div>
  )
}

export function Field({ label, children, style }) {
  return (
    <div style={{ marginBottom: 13, ...style }}>
      <label className="label">{label}</label>
      {children}
    </div>
  )
}

export function Input(props) {
  const { label, style, ...rest } = props
  const el = <input className="input" {...rest} />
  return label ? <Field label={label} style={style}>{el}</Field> : el
}

const TAG = { accent: 'tag-accent', green: 'tag-green', red: 'tag-red', amber: 'tag-amber' }

export function Tag({ children, tone, icon }) {
  return (
    <span className={['tag', TAG[tone] || ''].join(' ')}>
      {icon && <Icon name={icon} size={12} />}
      {children}
    </span>
  )
}

export function Dot({ color }) {
  return <span className="dot" style={{ background: color }} />
}

export function Meter({ pct, done, style }) {
  return (
    <div className={['meter', done ? 'done' : ''].join(' ')} style={style}>
      <div style={{ width: pct + '%' }} />
    </div>
  )
}

export function Tick({ done, onClick, label }) {
  return (
    <button className={['tick', done ? 'done' : ''].join(' ')} onClick={onClick} aria-label={label || (done ? 'Reopen' : 'Mark done')}>
      {done && <Icon name="check" size={13} stroke={2.6} />}
    </button>
  )
}

export function Modal({ title, onClose, children }) {
  return (
    <div className="veil" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <div className="h1" style={{ flex: 1, fontSize: 17 }}>{title}</div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Close">
            <Icon name="close" size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Empty({ icon = 'projects', title, children, action }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: 'var(--ink-3)' }}>
        <Icon name={icon} size={22} />
      </div>
      <div className="h2" style={{ marginBottom: 4 }}>{title}</div>
      <div className="sub" style={{ marginBottom: action ? 14 : 0 }}>{children}</div>
      {action}
    </div>
  )
}

export function Banner({ tone = 'red', children }) {
  const bg = tone === 'red' ? 'var(--red-soft)' : tone === 'green' ? 'var(--green-soft)' : 'var(--amber-soft)'
  const color = tone === 'red' ? 'var(--red)' : tone === 'green' ? 'var(--green)' : 'var(--amber)'
  return (
    <div style={{ background: bg, border: '1px solid ' + color + '33', borderRadius: 'var(--r)', padding: '9px 13px', fontSize: 13, color, marginBottom: 14 }}>
      {children}
    </div>
  )
}

export function PriorityTag({ p }) {
  const pr = p || 'medium'
  return <Tag tone={pr === 'high' ? 'red' : pr === 'low' ? 'green' : 'amber'}>{pr}</Tag>
}

// Segmented stage meter — one segment per stage, coloured by status
export function Segments({ stages = [], style }) {
  return (
    <div className="segs" style={style}>
      {stages.map((s) => (
        <span key={s.id} className={s.status === 'complete' ? 'done' : s.status === 'active' ? 'active' : ''} />
      ))}
    </div>
  )
}

export function IconChip({ icon, tint = 'accent', sm }) {
  return (
    <span className={['chip-ic', sm ? 'sm' : '', 'tint-' + tint].join(' ')}>
      <Icon name={icon} size={sm ? 15 : 19} />
    </span>
  )
}

// Mic button — dictate into a field via browser speech recognition
import { useRef as _useRef, useState as _useState, useEffect as _useEffect } from 'react'
import { speechSupported, createRecognizer } from '../lib/speech'

export function MicBtn({ onText, title = 'Dictate' }) {
  const [live, setLive] = _useState(false)
  const recRef = _useRef(null)

  _useEffect(() => () => { try { recRef.current?.stop() } catch {} }, [])

  if (!speechSupported) return null

  const toggle = () => {
    if (live) {
      try { recRef.current?.stop() } catch {}
      return
    }
    recRef.current = createRecognizer({ onText, onState: setLive })
    try { recRef.current?.start() } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={live ? 'Stop dictating' : title}
      aria-label={live ? 'Stop dictating' : title}
      className={live ? 'mic live' : 'mic'}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0" />
        <path d="M12 18v3" />
      </svg>
    </button>
  )
}
