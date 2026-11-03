// 'YYYY-MM-DD' 문자열을 로컬 자정 기준 Date로 변환
// (new Date('2026-11-03')은 UTC 기준이라 한국 시간에서 날짜가 어긋날 수 있음)
export function parseDate(value) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

const DAY_MS = 24 * 60 * 60 * 1000

// 마감일까지 남은 일수 (오늘 마감이면 0, 지났으면 음수)
export function daysUntil(value, today = new Date()) {
  return Math.round((parseDate(value) - startOfDay(today)) / DAY_MS)
}

// 'D-3', 'D-Day', '마감'
export function formatDday(applyEnd, today = new Date()) {
  const days = daysUntil(applyEnd, today)
  if (days < 0) return '마감'
  if (days === 0) return 'D-Day'
  return `D-${days}`
}

// 신청 상태: 접수 예정 / 접수 중 / 마감
export function getApplyStatus(program, today = new Date()) {
  if (daysUntil(program.apply_end, today) < 0) return 'CLOSED'
  if (daysUntil(program.apply_start, today) > 0) return 'UPCOMING'
  return 'OPEN'
}

export const APPLY_STATUS_LABELS = {
  UPCOMING: '접수 예정',
  OPEN: '접수 중',
  CLOSED: '마감',
}

// '2026.11.03'
export function formatDate(value) {
  return value.replaceAll('-', '.')
}

// '2026.10.20 ~ 2026.11.07'
export function formatPeriod(start, end) {
  return `${formatDate(start)} ~ ${formatDate(end)}`
}
