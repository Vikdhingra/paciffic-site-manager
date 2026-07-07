// Build and download an .ics calendar event for a site request.
// On iPhone this opens straight into Apple Calendar.
const pad = (n) => String(n).padStart(2, '0')

const icsDate = (d) => d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate())

const esc = (s = '') => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')

export function downloadRequestEvent(req, projectName) {
  // All-day event on the needed-by date (or tomorrow if none given)
  const start = req.needed_by ? new Date(req.needed_by + 'T00:00:00') : new Date(Date.now() + 86400000)
  const end = new Date(start.getTime() + 86400000)
  const now = new Date()
  const stamp =
    now.getUTCFullYear() + pad(now.getUTCMonth() + 1) + pad(now.getUTCDate()) +
    'T' + pad(now.getUTCHours()) + pad(now.getUTCMinutes()) + pad(now.getUTCSeconds()) + 'Z'

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Paciffic Homes//Site Manager//EN',
    'BEGIN:VEVENT',
    'UID:' + req.id + '@supervisors.paciffic.builders',
    'DTSTAMP:' + stamp,
    'DTSTART;VALUE=DATE:' + icsDate(start),
    'DTEND;VALUE=DATE:' + icsDate(end),
    'SUMMARY:' + esc('[' + projectName + '] ' + req.title),
    'DESCRIPTION:' + esc((req.details ? req.details + '\n' : '') + 'Requested by ' + (req.created_by_name || 'site') + ' — Paciffic Site Manager'),
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'request-' + req.id + '.ics'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}
