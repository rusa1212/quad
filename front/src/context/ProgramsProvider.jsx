import { useCallback, useEffect, useMemo, useState } from 'react'
import { ProgramsContext } from './programs.js'
import { fetchPrograms } from '../lib/programs.js'

// 앱 시작 시 programs 테이블을 한 번 받아와 모든 화면이 함께 씁니다.
// 필터·정렬·자격 판정은 기존처럼 브라우저에서 처리합니다.
function ProgramsProvider({ children }) {
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 받아온 결과만 state에 반영 (첫 로딩은 초기 state가 loading: true)
  const fetchAndApply = useCallback(
    () =>
      fetchPrograms()
        .then((rows) => {
          setPrograms(rows)
          setError(null)
        })
        .catch((e) => {
          console.error('[programs] 불러오기 실패', e)
          setError(e)
        })
        .finally(() => setLoading(false)),
    [],
  )

  useEffect(() => {
    fetchAndApply()
  }, [fetchAndApply])

  // "다시 시도" 버튼용
  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    return fetchAndApply()
  }, [fetchAndApply])

  const value = useMemo(() => {
    const byId = new Map(programs.map((program) => [program.id, program]))
    return {
      programs,
      loading,
      error,
      getProgramById: (id) => byId.get(id),
      reload: load,
    }
  }, [programs, loading, error, load])

  return <ProgramsContext.Provider value={value}>{children}</ProgramsContext.Provider>
}

export default ProgramsProvider
