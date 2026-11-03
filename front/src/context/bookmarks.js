import { createContext, useContext } from 'react'

export const BookmarkContext = createContext(null)

// { bookmarks: string[], isBookmarked(id), toggleBookmark(id) }
export function useBookmarks() {
  const context = useContext(BookmarkContext)
  if (!context) throw new Error('useBookmarks는 BookmarkProvider 안에서만 사용할 수 있어요.')
  return context
}
