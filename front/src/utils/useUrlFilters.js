import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

// 필터 값을 URL 쿼리에 저장 → 상세 화면에서 뒤로가기해도 필터 유지, 링크 공유 가능.
// defaults에 있는 키만 필터로 읽고, 기본값과 같으면 쿼리에서 뺌.
// options.resetKeys: 필터가 바뀔 때 함께 지울 쿼리 (예: 'page' → 1페이지부터)
// options.keepOnReset: 초기화해도 남길 키 (예: 캘린더의 관심/전체 보기)
export function useUrlFilters(defaults, { resetKeys = [], keepOnReset = [] } = {}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchKey, setSearchKey] = useState(0) // 초기화 시 검색창을 새로 마운트해 입력값 비우기

  const filters = { ...defaults }
  for (const [key, value] of searchParams) {
    if (key in defaults) filters[key] = value
  }

  function updateFilter(key, value) {
    const next = new URLSearchParams(searchParams)
    if (!value || value === defaults[key]) next.delete(key)
    else next.set(key, value)
    resetKeys.forEach((k) => next.delete(k))
    setSearchParams(next, { replace: true })
  }

  // 인자 없이 호출 (onClick={resetFilters}로 바로 넘겨도 되도록). keepOnReset의 키만 남김
  function resetFilters() {
    const next = new URLSearchParams()
    keepOnReset.forEach((k) => searchParams.has(k) && next.set(k, searchParams.get(k)))
    setSearchParams(next, { replace: true })
    setSearchKey((k) => k + 1)
  }

  return { filters, updateFilter, resetFilters, searchKey, searchParams, setSearchParams }
}
