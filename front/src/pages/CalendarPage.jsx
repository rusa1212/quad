import { useState } from 'react'
import { Link } from 'react-router-dom'
import { DdayBadge, TypeBadge } from '../components/Badges.jsx'
import BookmarkButton from '../components/BookmarkButton.jsx'
import { useBookmarks } from '../context/bookmarks.js'
import { programs } from '../data/programs.js'
import { buildMonthGrid, getReminders, getUrgency, groupByDeadline, toDateKey, WEEKDAYS } from '../utils/calendar.js'
import { daysUntil, formatDate } from '../utils/date.js'
import './CalendarPage.css'

const MAX_CHIPS = 2 // 한 칸에 보여줄 최대 프로그램 수 (나머지는 +N)

function CalendarPage() {
  const { bookmarks } = useBookmarks()
  const [today] = useState(() => new Date())
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [showAll, setShowAll] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)

  const todayKey = toDateKey(today)
  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const weeks = buildMonthGrid(year, month)

  const visible = showAll ? programs : programs.filter((program) => bookmarks.includes(program.id))
  const byDeadline = groupByDeadline(visible)
  const upcoming = visible
    .filter((program) => daysUntil(program.apply_end, today) >= 0)
    .sort((a, b) => a.apply_end.localeCompare(b.apply_end))
  const listItems = selectedDate ? (byDeadline[selectedDate] ?? []) : upcoming

  function moveMonth(delta) {
    setCursor(new Date(year, month + delta, 1))
    setSelectedDate(null)
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
          <button type="button" className={!showAll ? 'chip active' : 'chip'} onClick={() => setShowAll(false)}>
            관심 프로그램 ({bookmarks.length})
          </button>
          <button type="button" className={showAll ? 'chip active' : 'chip'} onClick={() => setShowAll(true)}>
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
              if (key === selectedDate) classes.push('selected')
              if (items.length > 0) classes.push('has-items')

              return (
                <button
                  key={key}
                  type="button"
                  role="gridcell"
                  className={classes.join(' ')}
                  onClick={() => selectDate(key)}
                  disabled={items.length === 0}
                  aria-label={`${date.getMonth() + 1}월 ${date.getDate()}일${items.length ? `, 마감 ${items.length}건` : ''}`}
                >
                  <span className="calendar-date">{date.getDate()}</span>
                  <span className="calendar-chips">
                    {items.slice(0, MAX_CHIPS).map((program) => (
                      <span key={program.id} className={`calendar-chip ${getUrgency(program.apply_end, today)}`}>
                        {program.title}
                      </span>
                    ))}
                    {items.length > MAX_CHIPS && <span className="calendar-more">+{items.length - MAX_CHIPS}</span>}
                  </span>
                  {items.length > 0 && <span className="calendar-dot" aria-hidden="true">{items.length}</span>}
                </button>
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
          <h2>{selectedDate ? `${formatDate(selectedDate)} 마감` : '다가오는 마감'}</h2>
          {selectedDate && (
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
                  {bookmarks.includes(program.id) && daysUntil(program.apply_end, today) >= 0 && (
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
