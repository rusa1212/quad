import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import FilterBar from '../components/FilterBar.jsx'
import LoadState from '../components/LoadState.jsx'
import Pagination from '../components/Pagination.jsx'
import ProgramCard from '../components/ProgramCard.jsx'
import { useProfile } from '../context/profile.js'
import { usePrograms } from '../context/programs.js'
import { evaluateEligibility } from '../utils/eligibility.js'
import { DEFAULT_FILTERS, filterPrograms, getHostOrgs, sortPrograms } from '../utils/filter.js'
import './ListPage.css'

const PAGE_SIZE = 12 // 한 페이지에 보여줄 프로그램 수 (그리드 2·3·4열 모두 딱 떨어지게)

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
    next.delete('page') // 필터·정렬이 바뀌면 1페이지부터
    setSearchParams(next, { replace: true })
  }

  // 페이지 이동은 히스토리에 남겨서 뒤로가기로 이전 페이지 복귀
  function goToPage(nextPage) {
    const next = new URLSearchParams(searchParams)
    if (nextPage <= 1) next.delete('page')
    else next.set('page', String(nextPage))
    setSearchParams(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
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

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE))
  // URL의 page 값이 이상하거나 범위를 넘으면 가까운 유효 페이지로
  const page = Math.min(Math.max(1, Number.parseInt(searchParams.get('page'), 10) || 1), totalPages)
  const pageItems = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

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
            {totalPages > 1 && (
              <span className="list-page-info">
                {' '}
                · {page} / {totalPages} 페이지
              </span>
            )}
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
        <>
          <div className="program-grid">
            {pageItems.map((program) => (
              <ProgramCard key={program.id} program={program} eligibilityStatus={statusById[program.id]} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={goToPage} />
        </>
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
