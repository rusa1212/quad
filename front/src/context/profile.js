import { createContext, useContext } from 'react'

export const ProfileContext = createContext(null)

// { profile, saveProfile, clearProfile }
// profile이 null이면 아직 프로필을 입력하지 않은 상태
export function useProfile() {
  const context = useContext(ProfileContext)
  if (!context) throw new Error('useProfile은 ProfileProvider 안에서만 사용할 수 있어요.')
  return context
}
