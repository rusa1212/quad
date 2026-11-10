import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DdayBadge, TypeBadge } from '../components/Badges.jsx'
import BookmarkButton from '../components/BookmarkButton.jsx'
import FilterBar from '../components/FilterBar.jsx'
import { useBookmarks } from '../context/bookmarks.js'
import { useProfile } from '../context/profile.js'
import { usePrograms } from '../context/programs.js'
import { buildMonthGrid, getReminders, getUrgency, groupByDeadline, toDateKey, WEEKDAYS } from '../utils/calendar.js'
import { daysUntil, formatDate } from '../utils/date.js'
import { filterPrograms, getHostOrgs } from '../utils/filter.js'
import { useUrlFilters } from '../utils/useUrlFilters.js'
import './CalendarPage.css'

const MAX_CHIPS = 2 // 한 칸에 보여줄 최대 프로그램 수 (나머지는 +N)

// 캘린더 필터 (URL 쿼리). 목록 화면 필터에서 정렬·마감 포함 여부를 뺀 것 + 관심/전체 보기
const CALENDAR_FILTERS = {
  q: '',
  type: '',
  region: '',
  host: '',
  deadline: '', // 마감까지 남은 일수 이내 ('7', '30')
  fit: '',
  view: '', // 'all'이면 전체 프로그램, 비어 있으면 관심 프로그램만
}
const FILTER_KEYS = Object.keys(CALENDAR_FILTERS).filter((key) => key !== 'view')

function CalendarPage() {
  const { bookmarks } = useBookmarks()
  const { programs } = usePrograms()
  const { profile } = useProfile()
  const { filters, updateFilter, resetFilters, searchKey } = useUrlFilters(CALENDAR_FILTERS, { keepOnReset: ['view'] })
  const [today] = useState(() => new Date())
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState(null)

  const todayKey = toDateKey(today)
  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}-`
  const weeks = buildMonthGrid(year, month)

  const showAll = filters.view === 'all'
  const base = showAll ? programs : programs.filter((program) => bookmarks.includes(program.id))
  const hostOrgs = getHostOrgs(base)
  // 지난 달을 넘겨볼 때도 보이도록 마감된 프로그램은 항상 포함 (달력에서 회색으로 표시)
  const visible = filterPrograms(base, { ...filters, closed: '1' }, { profile, today })
  const activeFilterCount = FILTER_KEYS.filter((key) => filters[key]).length

  const byDeadline = groupByDeadline(visible)
  const upcoming = visible
    .filter((program) => program.apply_end && daysUntil(program.apply_end, today) >= 0)
    .sort((a, b) => a.apply_end.localeCompare(b.apply_end))
  // 필터가 바뀌어 선택한 날짜에 남은 일정이 없으면 선택 해제한 것으로 봄
  const activeDate = selectedDate && byDeadline[selectedDate] ? selectedDate : null
  const listItems = activeDate ? byDeadline[activeDate] : upcoming

  const monthCount = visible.filter((program) => program.apply_end?.startsWith(monthPrefix)).length
  // 이번 달에 표시할 게 없으면 가장 가까운 다가오는 마감으로 이동할 수 있게
  const nextDeadline = monthCount === 0 ? upcoming[0]?.apply_end : null

  function moveMonth(delta) {
    setCursor(new Date(year, month + delta, 1))
    setSelectedDate(null)
  }

  function goToDate(dateKey) {
    const [y, m] = dateKey.split('-').map(Number)
    setCursor(new Date(y, m - 1, 1))
    setSelectedDate(dateKey)
  }

  function goToday() {
    setCursor(new Date(today.getFullYear(), today.getMonth(), 1))
    setSelectedDate(null)
  }

  function selectDate(key) {
    setSelectedDate((prev) => (prev === key ? null : key))
  }

  return (
    <section>
      <div className="page-header">
        <h1>마감 캘린더</h1>
        <p>관심 저장한 프로그램의 마감일을 한눈에 확인하세요. 마감 7일 전과 1일 전에 알림을 보내드릴 예정이에요.</p>
      </div>

      <div className="calendar-toolbar">
        <div className="calendar-nav">
          <button type="button" className="icon-button" onClick={() => moveMonth(-1)} aria-label="이전 달">
            ‹
          </button>
          <h2>
            {year}년 {month + 1}월
          </h2>
          <button type="button" className="icon-button" onClick={() => moveMonth(1)} aria-label="다음 달">
            ›
          </button>
          <button type="button" className="button-secondary today-button" onClick={goToday}>
            오늘
          </button>
        </div>

        <div className="view-toggle" role="group" aria-label="표시할 프로그램">
          <button type="button" className={!showAll ? 'chip active' : 'chip'} onClick={() => updateFilter('view', '')}>
            관심 프로그램 ({bookmarks.length})
          </button>
          <button type="button" className={showAll ? 'chip active' : 'chip'} onClick={() => updateFilter('view', 'all')}>
            전체 프로그램
          </button>
        </div>
      </div>

      {!showAll && bookmarks.length === 0 && (
        <div className="notice calendar-notice">
          <span>아직 관심 저장한 프로그램이 없어요. 목록이나 상세 화면에서 ☆를 눌러 저장해보세요.</span>
          <Link to="/">프로그램 찾기 →</Link>
        </div>
      )}

      <div className="calendar-filters">
        <FilterBar
          filters={filters}
          hostOrgs={hostOrgs}
          hasProfile={Boolean(profile)}
          onChange={updateFilter}
          onReset={resetFilters}
          searchKey={searchKey}
          showClosed={false}
        />
      </div>

      <div className="calendar-summary">
        <p>
          {year}년 {month + 1}월 마감 <strong>{monthCount}</strong>건
          {activeFilterCount > 0 && <span className="calendar-filter-count"> · 필터 {activeFilterCount}개 적용 중</span>}
        </p>
        {nextDeadline && (
          <button type="button" className="text-button" onClick={() => goToDate(nextDeadline)}>
            다음 마감 {formatDate(nextDeadline)}로 이동 →
          </button>
        )}
        {monthCount === 0 && !nextDeadline && activeFilterCount > 0 && (
          <button type="button" className="text-button" onClick={resetFilters}>
            필터 초기화
          </button>
        )}
      </div>

      <div className="calendar" role="grid" aria-label={`${year}년 ${month + 1}월 마감 일정`}>
        <div className="calendar-row calendar-weekdays" role="row">
          {WEEKDAYS.map((day) => (
            <div key={day} role="columnheader" className="calendar-weekday">
              {day}
            </div>
          ))}
        </div>

        {weeks.map((week) => (
          <div key={toDateKey(week[0])} className="calendar-row" role="row">
            {week.map((date) => {
              const key = toDateKey(date)
              const items = byDeadline[key] ?? []
              const classes = ['calendar-cell']
              if (date.getMonth() !== month) classes.push('outside')
              if (key === todayKey) classes.push('today')
              if (key === activeDate) classes.push('selected')
              if (items.length > 0) classes.push('has-items')

              // 칸 전체를 덮는 버튼으로 날짜 선택, 그 위에 올린 칩(링크)을 누르면 공고 상세로 이동
              return (
                <div key={key} role="gridcell" aria-selected={key === activeDate} className={classes.join(' ')}>
                  <button
                    type="button"
                    className="calendar-cell-select"
                    onClick={() => selectDate(key)}
                    disabled={items.length === 0}
                    aria-label={`${date.getMonth() + 1}월 ${date.getDate()}일${items.length ? `, 마감 ${items.length}건` : ''}`}
                  />
                  <span className="calendar-date" aria-hidden="true">
                    {date.getDate()}
                  </span>
                  <span className="calendar-chips">
                    {items.slice(0, MAX_CHIPS).map((program) => (
                      <Link
                        key={program.id}
                        to={`/programs/${program.id}`}
                        className={`calendar-chip ${getUrgency(program.apply_end, today)}`}
                        title={program.title}
                      >
                        {program.title}
                      </Link>
                    ))}
                    {items.length > MAX_CHIPS && <span className="calendar-more">+{items.length - MAX_CHIPS}</span>}
                  </span>
                  {items.length > 0 && <span className="calendar-dot" aria-hidden="true">{items.length}</span>}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <div className="calendar-legend">
        <span>
          <i className="legend-swatch critical" /> D-1 이내
        </span>
        <span>
          <i className="legend-swatch urgent" /> D-7 이내
        </span>
        <span>
          <i className="legend-swatch normal" /> 여유
        </span>
        <span>
          <i className="legend-swatch closed" /> 마감
        </span>
      </div>

      <section className="deadline-list">
        <div className="deadline-list-head">
          <h2>{activeDate ? `${formatDate(activeDate)} 마감` : '다가오는 마감'}</h2>
          {activeDate && (
            <button type="button" className="text-button" onClick={() => setSelectedDate(null)}>
              전체 보기
            </button>
          )}
        </div>

        {listItems.length === 0 ? (
          <p className="panel-note">표시할 마감 일정이 없어요.</p>
        ) : (
          <ul>
            {listItems.map((program) => (
              <li key={program.id} className="deadline-item">
                <div className="deadline-main">
                  <div className="badges">
                    <TypeBadge type={program.type} />
                    <DdayBadge applyEnd={program.apply_end} />
                  </div>
                  <Link to={`/programs/${program.id}`} className="deadline-title">
                    {program.title}
                  </Link>
                  <p className="deadline-meta">
                    {program.host_org} · {formatDate(program.apply_end)} 마감
                  </p>
                  {bookmarks.includes(program.id) && program.apply_end && daysUntil(program.apply_end, today) >= 0 && (
                    <p className="deadline-reminders">
                      알림
                      {getReminders(program.apply_end, today).map((reminder) => (
                        <span key={reminder.label} className={reminder.sent ? 'reminder sent' : 'reminder'}>
                          {reminder.label} {formatDate(reminder.date).slice(5)}
                          {reminder.sent ? ' (지남)' : ''}
                        </span>
                      ))}
                    </p>
                  )}
                </div>
                <BookmarkButton programId={program.id} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  )
}

export default CalendarPage
