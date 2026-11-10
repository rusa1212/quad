import { useEffect, useMemo, useState } from 'react'
import { BookmarkContext } from './bookmarks.js'
import { useAuth } from './auth.js'
import { addBookmark, fetchBookmarks, importBookmarks, removeBookmark } from '../lib/userData.js'
import { loadJSON, removeItem, saveJSON } from '../utils/storage.js'

const STORAGE_KEY = 'program-hub.bookmarks'
const EMPTY = [] // 불러오는 중 빈 목록 (렌더마다 새 배열을 만들지 않도록)

// 관심 프로그램 id 목록. 로그인하면 bookmarks 테이블, 비로그인이면 브라우저에 저장합니다.
// 비로그인 때 저장한 북마크는 로그인할 때 계정으로 합칩니다.
function BookmarkProvider({ children }) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const [local, setLocal] = useState(() => loadJSON(STORAGE_KEY, []))
  // 어느 계정의 목록인지 함께 보관 → 계정이 바뀌면 다시 불러올 때까지 빈 목록
  const [remote, setRemote] = useState({ userId: null, ids: [] })

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    ;(async () => {
      const saved = loadJSON(STORAGE_KEY, [])
      if (saved.length > 0) {
        await importBookmarks(userId, saved)
        removeItem(STORAGE_KEY)
        setLocal([])
      }
      const ids = await fetchBookmarks(userId)
      if (!cancelled) setRemote({ userId, ids })
    })().catch((e) => console.error('[bookmarks] 불러오기 실패', e))
    return () => {
      cancelled = true
    }
  }, [userId])

  const bookmarks = userId ? (remote.userId === userId ? remote.ids : EMPTY) : local

  const value = useMemo(() => {
    const add = (list, id) => (list.includes(id) ? list : [...list, id])
    const remove = (list, id) => list.filter((b) => b !== id)

    return {
      bookmarks,
      isBookmarked: (id) => bookmarks.includes(id),
      toggleBookmark(id) {
        const wasSaved = bookmarks.includes(id)

        if (!userId) {
          const next = wasSaved ? remove(local, id) : add(local, id)
          setLocal(next)
          saveJSON(STORAGE_KEY, next)
          return
        }

        // 화면은 바로 반영하고, 서버 저장이 실패하면 되돌림
        const apply = (fn) => setRemote((r) => (r.userId === userId ? { ...r, ids: fn(r.ids, id) } : r))
        apply(wasSaved ? remove : add)
        ;(wasSaved ? removeBookmark(userId, id) : addBookmark(userId, id)).catch((e) => {
          console.error('[bookmarks] 저장 실패', e)
          apply(wasSaved ? add : remove)
        })
      },
    }
  }, [bookmarks, local, userId])

  return <BookmarkContext.Provider value={value}>{children}</BookmarkContext.Provider>
}

export default BookmarkProvider
