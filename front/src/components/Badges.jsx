import { PROGRAM_TYPES } from '../data/constants.js'
import { APPLY_STATUS_LABELS, daysUntil, formatDday, getApplyStatus } from '../utils/date.js'

export function TypeBadge({ type }) {
  return <span className={`badge badge-type-${type}`}>{PROGRAM_TYPES[type]}</span>
}

// 접수 예정 / 마감일 때만 표시 (접수 중은 D-day로 충분)
export function ApplyStatusBadge({ program }) {
  const status = getApplyStatus(program)
  if (status === 'OPEN') return null
  return <span className={`badge badge-status-${status}`}>{APPLY_STATUS_LABELS[status]}</span>
}

export function DdayBadge({ applyEnd }) {
  const days = daysUntil(applyEnd)
  let tone = ''
  if (days < 0) tone = 'closed'
  else if (days <= 7) tone = 'urgent'
  return <span className={`dday ${tone}`}>{formatDday(applyEnd)}</span>
}
