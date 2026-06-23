import { C } from '../lib/constants'

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
        background: C.bg,
      }}
    >
      <Spinner size={48} />
      <div
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700,
          fontSize: 16,
          letterSpacing: 1,
          color: C.t2,
        }}
      >
        {label}
      </div>
    </div>
  )
}

export function Label({ children, style }) {
  return (
    <div
      style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 800,
        fontSize: 16,
        letterSpacing: 1,
        color: C.t1,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function Btn({ children, onClick, variant = 'primary', style, disabled, type = 'button' }) {
  const variants = {
    primary: { background: C.amber, color: '#000', border: 'none' },
    dark: { background: C.navy, color: '#fff', border: 'none' },
    outline: { background: 'transparent', color: C.t2, border: '1px solid ' + C.border },
    danger: { background: C.red, color: '#fff', border: 'none' },
    ghost: { background: 'transparent', color: C.t2, border: 'none' },
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 700,
        fontSize: 13,
        letterSpacing: 0.5,
        padding: '8px 16px',
        borderRadius: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.15s',
        ...variants[variant],
        ...style,
      }}
    >
      {children}
    </button>
  )
}

export function Card({ children, style }) {
  return (
    <div
      style={{
        background: C.card,
        border: '1px solid ' + C.border,
        borderRadius: 12,
        padding: 16,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function Input({ value, onChange, placeholder, type = 'text', style }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: '10px 12px',
        border: '1px solid ' + C.border,
        borderRadius: 8,
        fontFamily: "'Barlow', sans-serif",
        fontSize: 14,
        color: C.t1,
        outline: 'none',
        ...style,
      }}
    />
  )
}

export function Pill({ children, color = C.amber, bg }) {
  return (
    <span
      style={{
        background: bg || color + '20',
        border: '1px solid ' + color + '40',
        borderRadius: 20,
        padding: '2px 10px',
        fontFamily: "'Barlow Condensed', sans-serif",
        fontWeight: 700,
        fontSize: 11,
        color,
      }}
    >
      {children}
    </span>
  )
}
