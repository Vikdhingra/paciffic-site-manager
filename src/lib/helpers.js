export const ADMIN_ROLES = ['admin', 'super_admin', 'superadmin']
export const isAdminRole = (r) => ADMIN_ROLES.includes(r)

// Stage template — Paciffic Homes standard build checklist
export const STAGE_TEMPLATE = [
  { name: 'Site Preparation', tasks: [
    'Preparation', 'Fencing', 'Cage Bin + Toilet', 'Security Camera', 'Site Cut', 'Set Out',
  ]},
  { name: 'Foundation / Slab Works', tasks: [
    'Underground Electrical', 'Underground Plumbing', 'Electricity Connection', 'Termite Part A',
    'Base', 'Steel Order', 'Concrete Booking', 'Steel and Slab (Concreters)', 'Base Inspection',
    'Slab-Steel Inspection', 'Pumpy', 'CCTV Inspection', 'Slab Pour', 'Termite Part B', 'Backfill',
  ]},
  { name: 'Structural Frame', tasks: [
    'Timber List', 'Truss Layout', 'Window Opening', 'Truss Booking', 'Timber Delivery',
    'Framing', 'Windows Delivery', 'Truss Delivery', 'Frame Inspection',
  ]},
  { name: 'Roofing & Envelope', tasks: [
    'Colourbond Roofing', 'Wrap', 'Bricks Delivery', 'Sand/Cement', 'Lintel',
    'Brick Laying', 'Hebel Delivery', 'Lockup List', 'Internal Lockup',
  ]},
  { name: 'Lockup & Rough-Ins', tasks: [
    'Plumbing Rough-in', 'Electrical Rough-in', 'Heating/Cooling Rough-in',
    'Downpipes', 'Hookup/Rollover', 'Insulation',
  ]},
  { name: 'Internal Fixing', tasks: [
    'Plaster', 'Brick Wash', 'Garage Door', 'Waterproofing', 'Tiles Delivery',
    'Tiler', 'Cabinetry', 'Shelving and Shower Screens',
  ]},
  { name: 'Interior Finishing', tasks: [
    'Electrical Fit-off', 'Plumber Fit-off', 'Paint', 'Caulking',
    'Door Seals and Locks', 'Flooring', 'Blinds', 'Appliances',
  ]},
  { name: 'Exterior & Landscaping', tasks: [
    'Driveway', 'Landscaping', 'Outdoor Lockup/Fixing List', 'Outdoor Lockup/Fixing Work',
  ]},
  { name: 'Inspection & Handover', tasks: [
    'Final Inspection', 'Compliance checks before handover',
  ]},
  { name: 'Completion', tasks: [
    'Final Cleaning', 'Practical Completion / Handover',
  ]},
]
export const DEFAULT_STAGES = STAGE_TEMPLATE.map((s) => s.name)

export const dayKey = (d = new Date()) => {
  const x = new Date(d)
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0')
}

export const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })

export const fmtShort = (d) =>
  new Date(d).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })

export const timeAgo = (d) => {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  const hrs = Math.floor(mins / 60)
  const days = Math.floor(hrs / 24)
  if (days > 0) return days + 'd ago'
  if (hrs > 0) return hrs + 'h ago'
  if (mins > 0) return mins + 'm ago'
  return 'just now'
}

// ── Derived project helpers (relational shape) ──────────────
export const projectPct = (p) => {
  const total = p.stages?.length || 0
  if (!total) return 0
  const done = p.stages.filter((s) => s.status === 'complete').length
  return Math.round((done / total) * 100)
}

export const activeStage = (p) =>
  p.stages?.find((s) => s.status === 'active') ||
  p.stages?.find((s) => s.status !== 'complete') ||
  null

export const isComplete = (p) => p.status === 'complete'

export const taskCounts = (p) => {
  let total = 0, done = 0
  p.stages?.forEach((s) => s.tasks?.forEach((t) => { total++; if (t.status === 'done') done++ }))
  return { total, done }
}

export const openTasksInActiveStage = (p) => {
  const s = activeStage(p)
  return (s?.tasks || []).filter((t) => t.status !== 'done')
}

export const REQUEST_TYPES = [
  { id: 'order', label: 'Order materials' },
  { id: 'provide', label: 'Arrange / provide' },
  { id: 'question', label: 'Question' },
  { id: 'other', label: 'Other' },
]
export const typeLabel = (t) => REQUEST_TYPES.find((x) => x.id === t)?.label || 'Request'
