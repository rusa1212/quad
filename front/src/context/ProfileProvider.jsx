import { useMemo, useState } from 'react'
import { ProfileContext } from './profile.js'
import { loadJSON, removeItem, saveJSON } from '../utils/storage.js'

const STORAGE_KEY = 'program-hub.profile'

// 로그인이 생기기 전까지 프로필은 브라우저(localStorage)에만 저장합니다.
function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(() => loadJSON(STORAGE_KEY, null))

  const value = useMemo(
    () => ({
      profile,
      saveProfile(next) {
        setProfile(next)
        saveJSON(STORAGE_KEY, next)
      },
      clearProfile() {
        setProfile(null)
        removeItem(STORAGE_KEY)
      },
    }),
    [profile],
  )

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export default ProfileProvider
