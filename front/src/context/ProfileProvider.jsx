import { useEffect, useMemo, useState } from 'react'
import { ProfileContext } from './profile.js'
import { useAuth } from './auth.js'
import { fetchProfile, resetProfile, upsertProfile } from '../lib/userData.js'
import { loadJSON, removeItem, saveJSON } from '../utils/storage.js'

const STORAGE_KEY = 'program-hub.profile'

// 로그인하면 profiles 테이블, 비로그인이면 브라우저(localStorage)에 저장합니다.
// 비로그인 때 입력한 프로필은 처음 로그인할 때 (계정에 프로필이 없으면) 계정으로 옮깁니다.
function ProfileProvider({ children }) {
  const { user, loading: authLoading } = useAuth()
  const userId = user?.id ?? null
  const [localProfile, setLocalProfile] = useState(() => loadJSON(STORAGE_KEY, null))
  // 어느 계정의 프로필인지 함께 보관 → 계정이 바뀌면 다시 불러올 때까지 loading
  const [remote, setRemote] = useState({ userId: null, profile: null })

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    ;(async () => {
      let profile = await fetchProfile(userId)
      const local = loadJSON(STORAGE_KEY, null)
      if (!profile && local) {
        await upsertProfile(userId, local)
        removeItem(STORAGE_KEY)
        setLocalProfile(null)
        profile = local
      }
      if (!cancelled) setRemote({ userId, profile })
    })().catch((e) => {
      console.error('[profile] 불러오기 실패', e)
      if (!cancelled) setRemote({ userId, profile: null })
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  const remoteReady = userId !== null && remote.userId === userId
  const profile = userId ? (remoteReady ? remote.profile : null) : localProfile
  const loading = authLoading || (userId !== null && !remoteReady)

  const value = useMemo(
    () => ({
      profile,
      loading,
      isRemote: userId !== null, // true면 계정(DB)에 저장
      async saveProfile(next) {
        if (userId) {
          await upsertProfile(userId, next)
          setRemote({ userId, profile: next })
        } else {
          saveJSON(STORAGE_KEY, next)
          setLocalProfile(next)
        }
      },
      async clearProfile() {
        if (userId) {
          await resetProfile(userId)
          setRemote({ userId, profile: null })
        } else {
          removeItem(STORAGE_KEY)
          setLocalProfile(null)
        }
      },
    }),
    [profile, loading, userId],
  )

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export default ProfileProvider
