import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/auth.js'
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
  const { user, loading, signOut } = useAuth()
  const location = useLocation()

  function handleSignOut() {
    signOut().catch((e) => console.error('[auth] 로그아웃 실패', e))
  }

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
        {!loading && (
          <div className="navbar-account">
            {user ? (
              <>
                <span className="navbar-email" title={user.email}>
                  {user.email}
                </span>
                <button type="button" className="navbar-auth" onClick={handleSignOut}>
                  로그아웃
                </button>
              </>
            ) : (
              location.pathname !== '/login' && (
                <Link to="/login" state={{ from: location.pathname + location.search }} className="navbar-auth primary">
                  로그인
                </Link>
              )
            )}
          </div>
        )}
      </div>
    </header>
  )
}

export default Navbar
