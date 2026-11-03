import { useBookmarks } from '../context/bookmarks.js'
import './BookmarkButton.css'

// variant: 'icon' 카드·목록용 별 버튼 | 'full' 상세 화면용 넓은 버튼
function BookmarkButton({ programId, variant = 'icon' }) {
  const { isBookmarked, toggleBookmark } = useBookmarks()
  const saved = isBookmarked(programId)

  if (variant === 'full') {
    return (
      <button
        type="button"
        className={saved ? 'bookmark-full saved' : 'bookmark-full'}
        aria-pressed={saved}
        onClick={() => toggleBookmark(programId)}
      >
        {saved ? '★ 관심 프로그램에 저장됨' : '☆ 관심 프로그램 저장'}
      </button>
    )
  }

  return (
    <button
      type="button"
      className={saved ? 'bookmark-icon saved' : 'bookmark-icon'}
      aria-pressed={saved}
      aria-label={saved ? '관심 저장 해제' : '관심 프로그램 저장'}
      title={saved ? '관심 저장 해제' : '관심 프로그램 저장'}
      onClick={() => toggleBookmark(programId)}
    >
      {saved ? '★' : '☆'}
    </button>
  )
}

export default BookmarkButton
