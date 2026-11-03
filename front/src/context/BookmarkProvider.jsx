import { useMemo, useState } from 'react'
import { BookmarkContext } from './bookmarks.js'
import { loadJSON, saveJSON } from '../utils/storage.js'

const STORAGE_KEY = 'program-hub.bookmarks'

// 관심 프로그램 id 목록 (work.md 7.2 bookmarks 테이블 역할). 로그인 전까지 브라우저에만 저장합니다.
function BookmarkProvider({ children }) {
  const [bookmarks, setBookmarks] = useState(() => loadJSON(STORAGE_KEY, []))

  const value = useMemo(
    () => ({
      bookmarks,
      isBookmarked: (id) => bookmarks.includes(id),
      toggleBookmark(id) {
        const next = bookmarks.includes(id) ? bookmarks.filter((b) => b !== id) : [...bookmarks, id]
        setBookmarks(next)
        saveJSON(STORAGE_KEY, next)
      },
    }),
    [bookmarks],
  )

  return <BookmarkContext.Provider value={value}>{children}</BookmarkContext.Provider>
}

export default BookmarkProvider
