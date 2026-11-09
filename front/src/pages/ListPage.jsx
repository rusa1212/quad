import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import FilterBar from '../components/FilterBar.jsx'
import LoadState from '../components/LoadState.jsx'
import ProgramCard from '../components/ProgramCard.jsx'
import { useProfile } from '../context/profile.js'
import { usePrograms } from '../context/programs.js'
import { evaluateEligibility } from '../utils/eligibility.js'
import { DEFAULT_FILTERS, filterPrograms, getHostOrgs, sortPrograms } from '../utils/filter.js'
import './ListPage.css'

function ListPage() {
  const { profile } = useProfile()
  const { programs, loading, error } = usePrograms()
  const hostOrgs = getHostOrgs(programs)

  // 필터를 URL 쿼리에 저장 → 상세 화면에서 뒤로가기해도 필터 유지, 링크 공유 가능
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchKey, setSearchKey] = useState(0) // 초기화 시 검색창을 새로 마운트해 입력값 비우기
  const filters = { ...DEFAULT_FILTERS, ...Object.fromEntries(searchParams) }

  function updateFilter(key, value) {
    const next = new URLSearchParams(searchParams)
    if (!value || value === DEFAULT_FILTERS[key]) next.delete(key)
    else next.set(key, value)
    setSearchParams(next, { replace: true })
  }

  function resetFilters() {
    setSearchParams({}, { replace: true })
    setSearchKey((k) => k + 1)
  }

  const results = sortPrograms(filterPrograms(programs, filters, { profile }), filters.sort)
  const statusById = Object.fromEntries(
    results.map((program) => [program.id, evaluateEligibility(program, profile)?.status]),
  )
  const counts = { ELIGIBLE: 0, CHECK: 0, INELIGIBLE: 0 }
  Object.values(statusById).forEach((status) => status && (counts[status] += 1))

  return (
    <section>
      <div className="page-header">
        <h1>프로그램 찾기</h1>
        <p>흩어진 창업·공모전·청년정책·교육 프로그램을 한곳에서 찾아보세요.</p>
      </div>

      {!profile && (
        <div className="notice list-notice">
          <span>내 프로필을 입력하면 프로그램마다 지원 가능 여부를 알려드려요.</span>
          <Link to="/profile">프로필 입력하기 →</Link>
        </div>
      )}

      <FilterBar
        filters={filters}
        hostOrgs={hostOrgs}
        hasProfile={Boolean(profile)}
        onChange={updateFilter}
        onReset={resetFilters}
        searchKey={searchKey}
      />

      <div className="list-toolbar">
        <div className="list-count">
          <p>
            <strong>{results.length}</strong>개 프로그램
          </p>
          {profile && results.length > 0 && (
            <p className="list-breakdown">
              <span className="text-success">지원 가능 {counts.ELIGIBLE}</span>
              <span className="text-warning">확인 필요 {counts.CHECK}</span>
              <span className="text-danger">지원 불가 {counts.INELIGIBLE}</span>
            </p>
          )}
        </div>
        <select value={filters.sort} onChange={(e) => updateFilter('sort', e.target.value)} aria-label="정렬">
          <option value="deadline">마감 임박순</option>
          <option value="latest">최신 등록순</option>
        </select>
      </div>

      {loading || error ? (
        <LoadState />
      ) : results.length > 0 ? (
        <div className="program-grid">
          {results.map((program) => (
            <ProgramCard key={program.id} program={program} eligibilityStatus={statusById[program.id]} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>조건에 맞는 프로그램이 없어요.</p>
          <button type="button" className="button-secondary" onClick={resetFilters}>
            필터 초기화
          </button>
        </div>
      )}
    </section>
  )
}

export default ListPage
