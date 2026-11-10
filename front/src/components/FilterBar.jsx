import { useState } from 'react'
import { PROGRAM_TYPES, REGIONS } from '../data/constants.js'
import './FilterBar.css'

// 검색창은 입력값을 자체 state로 들고, URL(?q=)에는 따라서 반영만 함.
// URL 값을 바로 value로 쓰면 URL 갱신이 한 박자 늦어 한글 조합(ㅎ→하→한)이 끊겨 자모가 따로 입력됨.
// 초기화 등 외부에서 검색어를 바꿀 때는 부모가 key를 바꿔 새로 마운트함.
function SearchInput({ initialValue, onChange }) {
  const [text, setText] = useState(initialValue)
  return (
    <input
      type="search"
      className="filter-search"
      placeholder="프로그램명, 기관명으로 검색"
      value={text}
      onChange={(e) => {
        setText(e.target.value)
        onChange(e.target.value)
      }}
      aria-label="검색어"
    />
  )
}

// showClosed: '마감된 프로그램 포함' 체크박스 표시 여부 (캘린더는 마감된 것도 항상 보여주므로 숨김)
function FilterBar({ filters, hostOrgs, hasProfile, onChange, onReset, searchKey, showClosed = true }) {
  return (
    <div className="filter-bar">
      <SearchInput key={searchKey} initialValue={filters.q} onChange={(value) => onChange('q', value)} />

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

        {showClosed && (
          <label className="filter-check">
            <input
              type="checkbox"
              checked={Boolean(filters.closed)}
              onChange={(e) => onChange('closed', e.target.checked ? '1' : '')}
            />
            마감된 프로그램 포함
          </label>
        )}

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
