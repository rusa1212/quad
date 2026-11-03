import { ELIGIBILITY_STATUS, PROGRAM_TYPES } from '../data/constants.js'
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

// 지원 가능 / 확인 필요 / 지원 불가 (프로필이 없으면 표시 안 함)
export function EligibilityBadge({ status }) {
  if (!status) return null
  return <span className={`badge badge-eligibility-${status}`}>{ELIGIBILITY_STATUS[status]}</span>
}
