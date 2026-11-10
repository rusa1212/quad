// 통합 스키마(work.md 7.1)의 enum 값과 화면 표시용 라벨

export const PROGRAM_TYPES = {
  STARTUP: '창업',
  CONTEST: '공모전',
  POLICY: '청년정책',
  EDUCATION: '교육·일경험',
}

export const SOURCES = {
  KSTARTUP: 'K-Startup',
  YOUTH_CENTER: '온통청년',
  BIZINFO: '기업마당',
  FILE: '기관 파일',
  USER: '사용자 제보',
}

export const REGIONS = [
  '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
  '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주',
]

// 프로필의 전공과 자격요건의 전공 제한을 같은 분류로 맞추기 위한 목록
export const MAJOR_CATEGORIES = [
  '인문', '사회', '경영·경제', '자연과학', '공학', 'IT·컴퓨터', '예체능', '교육', '의약',
]

export const GRADES = [1, 2, 3, 4]

// 자격 판정 결과
export const ELIGIBILITY_STATUS = {
  ELIGIBLE: '지원 가능',
  CHECK: '확인 필요',
  INELIGIBLE: '지원 불가',
}

// 비밀번호 최소 길이 (Supabase Auth 기본값)
export const MIN_PASSWORD = 6
