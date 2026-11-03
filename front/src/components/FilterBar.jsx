import { PROGRAM_TYPES, REGIONS } from '../data/constants.js'
import './FilterBar.css'

function FilterBar({ filters, hostOrgs, hasProfile, onChange, onReset }) {
  return (
    <div className="filter-bar">
      <input
        type="search"
        className="filter-search"
        placeholder="프로그램명, 기관명으로 검색"
        value={filters.q}
        onChange={(e) => onChange('q', e.target.value)}
        aria-label="검색어"
      />

      <div className="filter-types" role="group" aria-label="유형">
        <button type="button" className={!filters.type ? 'chip active' : 'chip'} onClick={() => onChange('type', '')}>
          전체
        </button>
        {Object.entries(PROGRAM_TYPES).map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={filters.type === value ? 'chip active' : 'chip'}
            onClick={() => onChange('type', value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="filter-selects">
        <select value={filters.region} onChange={(e) => onChange('region', e.target.value)} aria-label="지역">
          <option value="">지역 전체</option>
          {REGIONS.map((region) => (
            <option key={region} value={region}>
              {region} (+전국)
            </option>
          ))}
        </select>

        <select value={filters.host} onChange={(e) => onChange('host', e.target.value)} aria-label="주관기관">
          <option value="">주관기관 전체</option>
          {hostOrgs.map((host) => (
            <option key={host} value={host}>
              {host}
            </option>
          ))}
        </select>

        <select value={filters.deadline} onChange={(e) => onChange('deadline', e.target.value)} aria-label="마감일">
          <option value="">마감일 전체</option>
          <option value="7">7일 이내 마감</option>
          <option value="30">30일 이내 마감</option>
        </select>

        <label className="filter-check">
          <input
            type="checkbox"
            checked={Boolean(filters.closed)}
            onChange={(e) => onChange('closed', e.target.checked ? '1' : '')}
          />
          마감된 프로그램 포함
        </label>

        {hasProfile && (
          <label className="filter-check filter-fit">
            <input
              type="checkbox"
              checked={Boolean(filters.fit)}
              onChange={(e) => onChange('fit', e.target.checked ? '1' : '')}
            />
            내 조건에 맞는 것만
          </label>
        )}

        <button type="button" className="filter-reset" onClick={onReset}>
          초기화
        </button>
      </div>
    </div>
  )
}

export default FilterBar
