import { daysUntil, parseDate } from './date.js'

export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

// Date → 'YYYY-MM-DD' (로컬 기준)
export function toDateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// 해당 월을 일요일 시작 주 단위로 채운 2차원 배열 (앞뒤 달 날짜 포함, 4~6주)
export function buildMonthGrid(year, month) {
  const first = new Date(year, month, 1)
  const start = new Date(year, month, 1 - first.getDay())
  const last = new Date(year, month + 1, 0)
  const weekCount = Math.ceil((first.getDay() + last.getDate()) / 7)

  return Array.from({ length: weekCount }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + w * 7 + d)),
  )
}

// 마감일 기준으로 프로그램 묶기 → { 'YYYY-MM-DD': [program, ...] }
export function groupByDeadline(programs) {
  const groups = {}
  for (const program of programs) {
    ;(groups[program.apply_end] ??= []).push(program)
  }
  return groups
}

// 마감 D-7, D-1 알림 예정일 (work.md 5.4). 이미 지난 알림은 sent: true
export function getReminders(applyEnd, today = new Date()) {
  const end = parseDate(applyEnd)
  return [7, 1].map((before) => {
    const date = new Date(end.getFullYear(), end.getMonth(), end.getDate() - before)
    return { label: `D-${before}`, date: toDateKey(date), sent: daysUntil(toDateKey(date), today) < 0 }
  })
}

// 캘린더 칩 색상 단계
export function getUrgency(applyEnd, today = new Date()) {
  const days = daysUntil(applyEnd, today)
  if (days < 0) return 'closed'
  if (days <= 1) return 'critical' // D-1, D-Day
  if (days <= 7) return 'urgent' // D-7 이내
  return 'normal'
}
