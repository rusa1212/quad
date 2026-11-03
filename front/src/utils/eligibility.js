// 프로필과 구조화된 자격요건(eligibility)을 대조해 지원 가능 여부를 판정합니다. (work.md 5.2)
// 나중에 백엔드 추천 API로 옮겨갈 로직입니다.
//
// profile 예시:
//   { grade: 2, major: 'IT·컴퓨터', region: '서울', age: 22, hasTeam: false, interests: ['STARTUP'] }
//   값이 비어 있으면(null/undefined/'') "모름"으로 보고 해당 조건은 "확인 필요"가 됩니다.

const PASS = 'PASS'
const FAIL = 'FAIL'
const UNKNOWN = 'UNKNOWN'

function isEmpty(value) {
  return value === null || value === undefined || value === ''
}

function checkGrade(rule, profile) {
  if (!rule) return null
  const label = `${rule.join('·')}학년`
  if (isEmpty(profile.grade)) return { field: 'grade', result: UNKNOWN, message: `${label} 대상 (프로필에 학년 없음)` }
  return rule.includes(Number(profile.grade))
    ? { field: 'grade', result: PASS, message: `${label} 대상` }
    : { field: 'grade', result: FAIL, message: `${label}만 지원 가능` }
}

function checkRegion(rule, profile) {
  if (!rule) return null
  const label = rule.join('·')
  if (isEmpty(profile.region)) return { field: 'region', result: UNKNOWN, message: `${label} 지역 대상 (프로필에 지역 없음)` }
  return rule.includes(profile.region)
    ? { field: 'region', result: PASS, message: `${label} 지역 대상` }
    : { field: 'region', result: FAIL, message: `${label} 지역만 지원 가능` }
}

function checkMajor(rule, profile) {
  if (!rule) return null
  const label = rule.join('·')
  if (isEmpty(profile.major)) return { field: 'major', result: UNKNOWN, message: `${label} 계열 대상 (프로필에 전공 없음)` }
  return rule.includes(profile.major)
    ? { field: 'major', result: PASS, message: `${label} 계열 대상` }
    : { field: 'major', result: FAIL, message: `${label} 계열만 지원 가능` }
}

function checkAge(rule, profile) {
  if (!rule) return null
  const { min, max } = rule
  const label = [min != null && `만 ${min}세 이상`, max != null && `만 ${max}세 이하`].filter(Boolean).join(', ')
  if (isEmpty(profile.age)) return { field: 'age', result: UNKNOWN, message: `${label} (프로필에 나이 없음)` }
  const age = Number(profile.age)
  const ok = (min == null || age >= min) && (max == null || age <= max)
  return { field: 'age', result: ok ? PASS : FAIL, message: label }
}

function checkTeam(rule, profile) {
  if (!rule) return null
  const label = rule === 'TEAM' ? '팀 지원만 가능' : '개인 지원만 가능'
  if (isEmpty(profile.hasTeam)) return { field: 'team', result: UNKNOWN, message: `${label} (프로필에 팀 여부 없음)` }
  const ok = rule === 'TEAM' ? profile.hasTeam === true : profile.hasTeam === false
  return { field: 'team', result: ok ? PASS : FAIL, message: label }
}

// 프로필 없이 자격요건 자체를 사람이 읽을 수 있게 정리 (상세 화면용)
export function describeEligibility(eligibility = {}) {
  const { grades, regions, majors, age, team, note } = eligibility
  const ageText = age
    ? [age.min != null && `만 ${age.min}세 이상`, age.max != null && `만 ${age.max}세 이하`].filter(Boolean).join(', ')
    : null

  const rows = [
    { label: '학년', value: grades ? `${grades.join('·')}학년` : null },
    { label: '지역', value: regions ? regions.join('·') : null },
    { label: '전공', value: majors ? `${majors.join('·')} 계열` : null },
    { label: '연령', value: ageText },
    { label: '팀 구성', value: team === 'TEAM' ? '팀 지원만 가능' : team === 'SOLO' ? '개인 지원만 가능' : null },
  ].map((row) => ({ ...row, value: row.value ?? '제한 없음' }))

  if (note) rows.push({ label: '기타', value: note, needsCheck: true })
  return rows
}

/**
 * @returns {{ status: 'ELIGIBLE' | 'CHECK' | 'INELIGIBLE', reasons: Array<{ field, result, message }> } | null}
 *          프로필이 없으면 null
 */
export function evaluateEligibility(program, profile) {
  if (!profile) return null
  const rules = program.eligibility ?? {}

  const reasons = [
    checkGrade(rules.grades, profile),
    checkRegion(rules.regions, profile),
    checkMajor(rules.majors, profile),
    checkAge(rules.age, profile),
    checkTeam(rules.team, profile),
  ].filter(Boolean)

  // 구조화하지 못한 조건은 사람이 원문을 확인해야 함 (work.md 11. 자격요건 추출 오류 대응)
  if (rules.note) reasons.push({ field: 'note', result: UNKNOWN, message: rules.note })

  let status = 'ELIGIBLE'
  if (reasons.some((r) => r.result === FAIL)) status = 'INELIGIBLE'
  else if (reasons.some((r) => r.result === UNKNOWN)) status = 'CHECK'

  return { status, reasons }
}
