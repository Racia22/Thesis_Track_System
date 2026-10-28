export const STAGES = [
  { key: 'REGISTERED', label: 'Registered', short: 'Registered', tone: 'slate' },
  { key: 'PROTOTYPE_PENDING', label: 'Prototype Review Booked', short: 'Review booked', tone: 'amber' },
  { key: 'PROTOTYPE_REVIEWED', label: 'Prototype Reviewed', short: 'Reviewed', tone: 'sky' },
  { key: 'SUPERVISOR_ASSIGNED', label: 'Supervisor Assigned', short: 'Supervisor assigned', tone: 'violet' },
  { key: 'IN_PROGRESS', label: 'In Progress', short: 'In progress', tone: 'brand' },
  { key: 'READY_FOR_DEFENSE', label: 'Ready for Defense', short: 'Ready for defense', tone: 'teal' },
  { key: 'COMPLETED', label: 'Completed', short: 'Completed', tone: 'green' },
]

const STAGE_BY_KEY = Object.fromEntries(STAGES.map((s) => [s.key, s]))

export function stageInfo(status) {
  return STAGE_BY_KEY[status] ?? { key: status, label: status, short: status, tone: 'slate' }
}

export function stageLabel(status) {
  return stageInfo(status).label
}

export function roleLabel(role) {
  if (!role) return ''
  return role.charAt(0) + role.slice(1).toLowerCase()
}

export function initials(name) {
  if (!name) return '?'
  const parts = name.replace(/^(Dr|Prof|Mr|Mrs|Ms)\.?\s+/i, '').trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

export function firstName(name) {
  if (!name) return ''
  return name.replace(/^(Dr|Prof|Mr|Mrs|Ms)\.?\s+/i, '').trim().split(/\s+/)[0]
}

export function daysLabel(days) {
  return `${days} ${days === 1 ? 'day' : 'days'}`
}

/** Parses a backend LocalDate ("2026-10-28") as a local calendar date, not UTC midnight. */
function parseLocalDate(dateStr) {
  return new Date(`${dateStr}T00:00:00`)
}

export function formatDate(dateStr, options) {
  return parseLocalDate(dateStr).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  })
}

export function dateParts(dateStr) {
  const d = parseLocalDate(dateStr)
  return {
    month: d.toLocaleDateString(undefined, { month: 'short' }),
    day: d.getDate(),
    weekday: d.toLocaleDateString(undefined, { weekday: 'short' }),
  }
}

export function formatTime(timeStr) {
  return timeStr?.slice(0, 5) ?? ''
}

export function formatDateTime(value) {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatLongDate(value) {
  return new Date(value).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
}

export function relativeTime(value) {
  const diffSeconds = (new Date(value).getTime() - Date.now()) / 1000
  const units = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['week', 60 * 60 * 24 * 7],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
  ]
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
  for (const [unit, seconds] of units) {
    if (Math.abs(diffSeconds) >= seconds) {
      return rtf.format(Math.round(diffSeconds / seconds), unit)
    }
  }
  return 'just now'
}

export function formatFileSize(kb) {
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`
  return `${kb} KB`
}

export function apiError(err, fallback) {
  return err?.response?.data?.message || fallback
}
