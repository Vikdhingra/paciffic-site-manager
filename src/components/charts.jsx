import { C } from '../lib/constants'

// Circular progress ring (SVG donut)
export function ProgressRing({ pct, size = 120, stroke = 12, color = C.amber, label, sublabel }) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.border} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 800,
            fontSize: size * 0.28,
            color: C.t1,
            lineHeight: 1,
          }}
        >
          {label != null ? label : pct + '%'}
        </div>
        {sublabel && (
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              color: C.t3,
              letterSpacing: 1,
              marginTop: 2,
            }}
          >
            {sublabel}
          </div>
        )}
      </div>
    </div>
  )
}

// Horizontal stacked bar (active vs completed)
export function StackedBar({ segments, height = 10 }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1
  return (
    <div style={{ display: 'flex', width: '100%', height, borderRadius: height, overflow: 'hidden', background: C.border }}>
      {segments.map((s, i) => (
        <div
          key={i}
          style={{
            width: (s.value / total) * 100 + '%',
            background: s.color,
            transition: 'width 0.5s ease',
          }}
          title={s.label + ': ' + s.value}
        />
      ))}
    </div>
  )
}
