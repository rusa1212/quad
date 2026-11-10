import { useEffect, useMemo, useState } from 'react'
import { AuthContext } from './auth.js'
import { isSupabaseConfigured, supabase, urlAuthError } from '../lib/supabase.js'

// Supabase Auth 오류 → 화면에 보여줄 문장
const ERROR_MESSAGES = {
  invalid_credentials: '이메일 또는 비밀번호가 맞지 않아요.',
  email_not_confirmed: '이메일 인증을 아직 안 했어요. 메일함의 인증 링크를 눌러주세요.',
  user_already_exists: '이미 가입된 이메일이에요. 로그인해 주세요.',
  weak_password: '비밀번호가 너무 약해요. 6자 이상으로 정해주세요.',
  same_password: '이전과 같은 비밀번호예요. 다른 비밀번호를 정해주세요.',
  email_address_invalid: '이메일 주소 형식이 올바르지 않아요.',
  over_email_send_rate_limit: '메일을 너무 자주 보냈어요. 잠시 후 다시 시도해 주세요.',
  over_request_rate_limit: '요청이 너무 많아요. 잠시 후 다시 시도해 주세요.',
  otp_expired: '메일 링크가 만료됐거나 이미 사용됐어요. 메일을 다시 받아주세요.',
  access_denied: '메일 링크가 유효하지 않아요. 메일을 다시 받아주세요.',
}

// 화면에서 오류 종류에 따라 다르게 처리할 수 있도록 code를 남겨둠 (예: email_not_confirmed → 재발송 버튼)
function toKoreanError(error) {
  const result = new Error(ERROR_MESSAGES[error.code] ?? error.message)
  result.code = error.code
  return result
}

function requireSupabase() {
  if (!supabase) throw new Error('front/.env 에 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY 를 설정하세요.')
  return supabase
}

// 메일 링크를 눌렀을 때 돌아올 주소. Supabase 대시보드 Redirect URLs에 허용돼 있어야 함
const redirectUrl = (path) => window.location.origin + path
const SIGNUP_REDIRECT = '/login' // 인증 성공이면 로그인 페이지가 바로 원래 화면으로 보내고, 실패면 안내 + 재발송
const RECOVERY_REDIRECT = '/reset-password'

// 로그인 상태 (Supabase Auth의 auth.users). 세션은 supabase-js가 localStorage에 보관하고 자동 갱신합니다.
function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  // 만료된 메일 링크로 들어온 경우의 안내 문구 (화면에서 확인하면 clearLinkError)
  const [linkError, setLinkError] = useState(() => (urlAuthError ? toKoreanError(urlAuthError).message : ''))

  useEffect(() => {
    if (!supabase) return
    // 첫 호출(INITIAL_SESSION)에 저장된 세션이 들어오고, 이후 로그인/로그아웃마다 다시 호출됨
    // 재설정 메일 링크로 들어오면 PASSWORD_RECOVERY 이벤트와 함께 로그인된 세션이 옴
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      linkError,
      clearLinkError: () => setLinkError(''),
      async signIn(email, password) {
        const { error } = await requireSupabase().auth.signInWithPassword({ email, password })
        if (error) throw toKoreanError(error)
      },
      // 반환값 needsConfirm: 이메일 인증이 켜져 있으면 true (메일 링크를 눌러야 로그인됨)
      async signUp(email, password) {
        const { data, error } = await requireSupabase().auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectUrl(SIGNUP_REDIRECT) },
        })
        if (error) throw toKoreanError(error)
        // 이메일 인증이 켜진 상태에서 이미 가입된 이메일이면 오류 대신 identities가 빈 user가 옴
        if (data.user && data.user.identities?.length === 0) throw toKoreanError({ code: 'user_already_exists' })
        return { needsConfirm: !data.session }
      },
      async resendConfirmation(email) {
        const { error } = await requireSupabase().auth.resend({
          type: 'signup',
          email,
          options: { emailRedirectTo: redirectUrl(SIGNUP_REDIRECT) },
        })
        if (error) throw toKoreanError(error)
      },
      // 가입되지 않은 이메일이어도 Supabase는 성공으로 응답함 (가입 여부 노출 방지)
      async requestPasswordReset(email) {
        const { error } = await requireSupabase().auth.resetPasswordForEmail(email, {
          redirectTo: redirectUrl(RECOVERY_REDIRECT),
        })
        if (error) throw toKoreanError(error)
      },
      // 로그인된 상태(재설정 링크로 들어온 경우 포함)에서 비밀번호 변경
      async updatePassword(password) {
        const { error } = await requireSupabase().auth.updateUser({ password })
        if (error) throw toKoreanError(error)
      },
      async signOut() {
        const { error } = await requireSupabase().auth.signOut()
        if (error) throw toKoreanError(error)
      },
    }),
    [user, loading, linkError],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
