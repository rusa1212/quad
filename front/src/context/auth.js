import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)

// { user, loading, signIn(email, pw), signUp(email, pw), signOut() }
// user가 null이면 비로그인 (프로필·북마크는 브라우저에만 저장)
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth는 AuthProvider 안에서만 사용할 수 있어요.')
  return context
}
