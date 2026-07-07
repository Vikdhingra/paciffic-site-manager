// Crisp inline stroke icons — replaces emoji throughout the app.
// Usage: <Icon name="check" size={18} />
const PATHS = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7.5" height="9" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="5.5" rx="1.5" />
      <rect x="13.5" y="12" width="7.5" height="9" rx="1.5" />
      <rect x="3" y="15.5" width="7.5" height="5.5" rx="1.5" />
    </>
  ),
  projects: (
    <>
      <path d="M3 21h18" />
      <path d="M5 21V8l7-5 7 5v13" />
      <path d="M9.5 21v-6h5v6" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.4" />
      <path d="M2.8 20c.7-3.4 3.2-5.2 6.2-5.2s5.5 1.8 6.2 5.2" />
      <path d="M16 5.2a3.4 3.4 0 0 1 0 5.9" />
      <path d="M17.6 15.1c2 .7 3.3 2.3 3.8 4.9" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="M4.5 12.5l5 5L19.5 7" />,
  chevronDown: <path d="M6 9.5l6 6 6-6" />,
  chevronUp: <path d="M6 14.5l6-6 6 6" />,
  back: <path d="M15 4.5L7.5 12l7.5 7.5" />,
  pin: (
    <>
      <path d="M12 21s-6.5-5.6-6.5-10.4A6.5 6.5 0 0 1 12 4a6.5 6.5 0 0 1 6.5 6.6C18.5 15.4 12 21 12 21z" />
      <circle cx="12" cy="10.5" r="2.2" />
    </>
  ),
  person: (
    <>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M5 20.2c.8-3.7 3.6-5.7 7-5.7s6.2 2 7 5.7" />
    </>
  ),
  bell: (
    <>
      <path d="M18 16H6c1.2-1.3 1.8-2.4 1.8-5.2C7.8 7 9.5 4.6 12 4.6s4.2 2.4 4.2 6.2c0 2.8.6 3.9 1.8 5.2z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 7.4V12l3.2 2" />
    </>
  ),
  note: (
    <>
      <path d="M5 4.5h14v11l-4 4H5z" />
      <path d="M15 19.5v-4h4" />
      <path d="M8.2 9h7.6M8.2 12.5h4.5" />
    </>
  ),
  flag: (
    <>
      <path d="M6 21V4" />
      <path d="M6 5h11.5l-2.4 3.5 2.4 3.5H6" />
    </>
  ),
  trash: (
    <>
      <path d="M4.5 6.5h15" />
      <path d="M8 6.5V4.8A1.3 1.3 0 0 1 9.3 3.5h5.4A1.3 1.3 0 0 1 16 4.8v1.7" />
      <path d="M6.5 6.5l.9 13a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4l.9-13" />
    </>
  ),
  logout: (
    <>
      <path d="M14.5 4H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7.5" />
      <path d="M11 12h9.5M17 8.5l3.5 3.5-3.5 3.5" />
    </>
  ),
  swap: (
    <>
      <path d="M4 8h13.5M14 4.5L17.5 8 14 11.5" />
      <path d="M20 16H6.5M10 12.5L6.5 16l3.5 3.5" />
    </>
  ),
  hardhat: (
    <>
      <path d="M3.5 17.5a8.5 8.5 0 0 1 17 0" />
      <path d="M10 9.3V5.8a2 2 0 0 1 4 0v3.5" />
      <path d="M2.5 17.5h19v2.5h-19z" />
    </>
  ),
  search: (
    <>
      <circle cx="10.8" cy="10.8" r="6.6" />
      <path d="M15.6 15.6L20.5 20.5" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6L6 18" />,
  undo: (
    <>
      <path d="M8.5 5L4 9.5 8.5 14" />
      <path d="M4 9.5h10a6 6 0 0 1 0 12h-3" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="12" cy="12" r="0.8" fill="currentColor" stroke="none" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="M3.5 7l8.5 6 8.5-6" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15.5" r="4.2" />
      <path d="M11 12.5L20 3.5M16.5 7l2.7 2.7M13.8 9.7l2.2 2.2" />
    </>
  ),
}

export default function Icon({ name, size = 20, stroke = 1.9, style }) {
  const p = PATHS[name]
  if (!p) return null
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, display: 'block', ...style }}
      aria-hidden="true"
    >
      {p}
    </svg>
  )
}
