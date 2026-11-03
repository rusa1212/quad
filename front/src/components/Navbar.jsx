import { Link, NavLink } from 'react-router-dom'
import { useBookmarks } from '../context/bookmarks.js'
import './Navbar.css'

const NAV_ITEMS = [
  { to: '/', label: '프로그램 찾기', end: true },
  { to: '/calendar', label: '마감 캘린더' },
  { to: '/ask', label: 'AI 질문' },
  { to: '/profile', label: '내 프로필' },
]

function Navbar() {
  const { bookmarks } = useBookmarks()

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo">
          캠퍼스<span>링크</span>
        </Link>
        <nav className="navbar-links" aria-label="주요 메뉴">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'navbar-link active' : 'navbar-link')}
            >
              {item.label}
              {item.to === '/calendar' && bookmarks.length > 0 && (
                <span className="navbar-count" aria-label={`관심 프로그램 ${bookmarks.length}개`}>
                  {bookmarks.length}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}

export default Navbar
