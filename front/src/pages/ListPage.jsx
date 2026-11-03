import { useSearchParams } from 'react-router-dom'
import FilterBar from '../components/FilterBar.jsx'
import ProgramCard from '../components/ProgramCard.jsx'
import { programs } from '../data/programs.js'
import { DEFAULT_FILTERS, filterPrograms, getHostOrgs, sortPrograms } from '../utils/filter.js'
import './ListPage.css'

const hostOrgs = getHostOrgs(programs)

function ListPage() {
  // 필터를 URL 쿼리에 저장 → 상세 화면에서 뒤로가기해도 필터 유지, 링크 공유 가능
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = { ...DEFAULT_FILTERS, ...Object.fromEntries(searchParams) }

  function updateFilter(key, value) {
    const next = new URLSearchParams(searchParams)
    if (!value || value === DEFAULT_FILTERS[key]) next.delete(key)
    else next.set(key, value)
    setSearchParams(next, { replace: true })
  }

  function resetFilters() {
    setSearchParams({}, { replace: true })
  }

  const results = sortPrograms(filterPrograms(programs, filters), filters.sort)

  return (
    <section>
      <div className="page-header">
        <h1>프로그램 찾기</h1>
        <p>흩어진 창업·공모전·청년정책·교육 프로그램을 한곳에서 찾아보세요.</p>
      </div>

      <FilterBar filters={filters} hostOrgs={hostOrgs} onChange={updateFilter} onReset={resetFilters} />

      <div className="list-toolbar">
        <p>
          <strong>{results.length}</strong>개 프로그램
        </p>
        <select value={filters.sort} onChange={(e) => updateFilter('sort', e.target.value)} aria-label="정렬">
          <option value="deadline">마감 임박순</option>
          <option value="latest">최신 등록순</option>
        </select>
      </div>

      {results.length > 0 ? (
        <div className="program-grid">
          {results.map((program) => (
            <ProgramCard key={program.id} program={program} />
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
