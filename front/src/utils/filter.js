import { daysUntil } from './date.js'
import { evaluateEligibility } from './eligibility.js'

// 목록 화면 필터 기본값 (URL 쿼리에 없으면 이 값으로 봄)
export const DEFAULT_FILTERS = {
  q: '', // 검색어
  type: '', // 유형
  region: '', // 지역 (선택한 지역 + 전국 대상 프로그램)
  host: '', // 주관기관
  deadline: '', // 마감까지 남은 일수 이내 ('7', '30')
  closed: '', // '1'이면 마감된 프로그램 포함
  fit: '', // '1'이면 내 조건에 맞는 것만 (프로필 필요)
  sort: 'deadline', // 'deadline' 마감 임박순 | 'latest' 최신 등록순
}

// options.profile: 맞춤 보기(fit)에 사용, options.today: 테스트용 기준일
export function filterPrograms(programs, filters, { profile = null, today = new Date() } = {}) {
  const keyword = filters.q.trim().toLowerCase()

  return programs.filter((program) => {
    const days = daysUntil(program.apply_end, today)

    // 맞춤 보기: 지원 불가는 숨기고, 유형을 따로 고르지 않았다면 관심 분야만
    if (filters.fit && profile) {
      if (evaluateEligibility(program, profile).status === 'INELIGIBLE') return false
      const interests = profile.interests ?? []
      if (!filters.type && interests.length > 0 && !interests.includes(program.type)) return false
    }

    if (filters.type && program.type !== filters.type) return false
    if (filters.region && program.region !== '전국' && program.region !== filters.region) return false
    if (filters.host && program.host_org !== filters.host) return false
    if (!filters.closed && days < 0) return false
    if (filters.deadline && (days < 0 || days > Number(filters.deadline))) return false
    if (keyword) {
      const text = `${program.title} ${program.summary} ${program.host_org}`.toLowerCase()
      if (!text.includes(keyword)) return false
    }
    return true
  })
}

export function sortPrograms(programs, sort, today = new Date()) {
  const sorted = [...programs]

  if (sort === 'latest') {
    sorted.sort((a, b) => b.apply_start.localeCompare(a.apply_start))
  } else {
    // 마감 임박순: 접수 중·예정은 마감일 빠른 순, 마감된 것은 맨 뒤
    sorted.sort((a, b) => {
      const aClosed = daysUntil(a.apply_end, today) < 0
      const bClosed = daysUntil(b.apply_end, today) < 0
      if (aClosed !== bClosed) return aClosed ? 1 : -1
      return a.apply_end.localeCompare(b.apply_end)
    })
  }
  return sorted
}

// 주관기관 필터 선택지
export function getHostOrgs(programs) {
  return [...new Set(programs.map((program) => program.host_org))].sort((a, b) => a.localeCompare(b, 'ko'))
}
