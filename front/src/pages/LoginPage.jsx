import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth.js'
import { isSupabaseConfigured } from '../lib/supabase.js'
import './LoginPage.css'

const MIN_PASSWORD = 6 // Supabase Auth 기본 최소 길이

function LoginPage() {
  const { user, loading, signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from ?? '/'

  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [confirmSentTo, setConfirmSentTo] = useState('') // 인증 메일을 보낸 주소

  if (!loading && user) return <Navigate to={redirectTo} replace />

  function switchMode(next) {
    setMode(next)
    setError('')
    setPasswordConfirm('')
    setConfirmSentTo('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (mode === 'signup') {
      if (password.length < MIN_PASSWORD) return setError(`비밀번호는 ${MIN_PASSWORD}자 이상이어야 해요.`)
      if (password !== passwordConfirm) return setError('비밀번호 확인이 일치하지 않아요.')
    }

    setSubmitting(true)
    try {
      if (mode === 'login') {
        await signIn(email.trim(), password)
        navigate(redirectTo, { replace: true })
      } else {
        const { needsConfirm } = await signUp(email.trim(), password)
        if (needsConfirm) setConfirmSentTo(email.trim())
        else navigate(redirectTo, { replace: true })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (confirmSentTo) {
    return (
      <section className="login-page">
        <div className="panel login-panel">
          <h1>메일함을 확인해 주세요</h1>
          <p className="login-lead">
            <strong>{confirmSentTo}</strong> 으로 인증 메일을 보냈어요. 메일의 링크를 누르면 가입이 끝나고 자동으로 로그인돼요.
          </p>
          <button type="button" className="button-secondary" onClick={() => switchMode('login')}>
            로그인 화면으로
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="login-page">
      <div className="panel login-panel">
        <div className="login-tabs" role="tablist">
          {[
            ['login', '로그인'],
            ['signup', '회원가입'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={mode === value}
              className={mode === value ? 'login-tab active' : 'login-tab'}
              onClick={() => switchMode(value)}
            >
              {label}
            </button>
          ))}
        </div>

        <p className="login-lead">
          {mode === 'login'
            ? '로그인하면 프로필과 관심 프로그램이 계정에 저장돼 어느 기기에서든 이어서 볼 수 있어요.'
            : '이메일로 가입해요. 지금 이 브라우저에 저장된 프로필과 관심 프로그램은 계정으로 옮겨져요.'}
        </p>

        {!isSupabaseConfigured && (
          <p className="login-error" role="alert">
            front/.env 에 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY 를 설정해야 로그인할 수 있어요.
          </p>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div>
            <label className="field-label" htmlFor="email">
              이메일
            </label>
            <input
              id="email"
              type="email"
              className="field-input"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="field-label" htmlFor="password">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              className="field-input"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {mode === 'signup' && <p className="field-hint">{MIN_PASSWORD}자 이상</p>}
          </div>

          {mode === 'signup' && (
            <div>
              <label className="field-label" htmlFor="password-confirm">
                비밀번호 확인
              </label>
              <input
                id="password-confirm"
                type="password"
                className="field-input"
                autoComplete="new-password"
                required
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
              />
            </div>
          )}

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="button-primary" disabled={submitting || !isSupabaseConfigured}>
            {submitting ? '처리 중…' : mode === 'login' ? '로그인' : '가입하기'}
          </button>
        </form>
      </div>
    </section>
  )
}

export default LoginPage
