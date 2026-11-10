import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/auth.js'
import { isSupabaseConfigured } from '../lib/supabase.js'
import ResendButton from '../components/ResendButton.jsx'
import './LoginPage.css'

import { MIN_PASSWORD } from '../data/constants.js'

const LEADS = {
  login: '로그인하면 프로필과 관심 프로그램이 계정에 저장돼 어느 기기에서든 이어서 볼 수 있어요.',
  signup: '이메일로 가입해요. 지금 이 브라우저에 저장된 프로필과 관심 프로그램은 계정으로 옮겨져요.',
  forgot: '가입한 이메일을 입력하면 비밀번호를 다시 정할 수 있는 링크를 보내드려요.',
}

const SUBMIT_LABELS = { login: '로그인', signup: '가입하기', forgot: '재설정 메일 보내기' }

// location.state: { from: 로그인 후 돌아갈 주소, mode: 'login' | 'signup' | 'forgot' }
function LoginPage() {
  const { user, loading, linkError, clearLinkError, signIn, signUp, resendConfirmation, requestPasswordReset } =
    useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from ?? '/'

  const [mode, setMode] = useState(location.state?.mode ?? 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null) // { message, code }
  const [sent, setSent] = useState(null) // 메일을 보낸 뒤 안내 화면: { kind: 'signup' | 'reset', email }

  if (!loading && user) return <Navigate to={redirectTo} replace />

  function switchMode(next) {
    setMode(next)
    setError(null)
    setPassword('')
    setPasswordConfirm('')
    setSent(null)
    clearLinkError()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    clearLinkError()
    const trimmed = email.trim()

    if (mode === 'signup') {
      if (password.length < MIN_PASSWORD) return setError({ message: `비밀번호는 ${MIN_PASSWORD}자 이상이어야 해요.` })
      if (password !== passwordConfirm) return setError({ message: '비밀번호 확인이 일치하지 않아요.' })
    }

    setSubmitting(true)
    try {
      if (mode === 'login') {
        await signIn(trimmed, password)
        navigate(redirectTo, { replace: true })
      } else if (mode === 'signup') {
        const { needsConfirm } = await signUp(trimmed, password)
        if (needsConfirm) setSent({ kind: 'signup', email: trimmed })
        else navigate(redirectTo, { replace: true })
      } else {
        await requestPasswordReset(trimmed)
        setSent({ kind: 'reset', email: trimmed })
      }
    } catch (err) {
      setError({ message: err.message, code: err.code })
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    const isSignup = sent.kind === 'signup'
    return (
      <section className="login-page">
        <div className="panel login-panel">
          <h1>메일함을 확인해 주세요</h1>
          <p className="login-lead">
            <strong>{sent.email}</strong> 으로{' '}
            {isSignup
              ? '인증 메일을 보냈어요. 메일의 링크를 누르면 가입이 끝나고 자동으로 로그인돼요.'
              : '비밀번호 재설정 메일을 보냈어요(가입된 이메일인 경우). 메일의 링크를 눌러 새 비밀번호를 정해주세요.'}
          </p>
          <p className="field-hint">메일이 안 보이면 스팸함도 확인해 주세요.</p>
          <ResendButton
            startCoolingDown
            label={isSignup ? '인증 메일 다시 보내기' : '재설정 메일 다시 보내기'}
            sentMessage="메일을 다시 보냈어요."
            onSend={() => (isSignup ? resendConfirmation(sent.email) : requestPasswordReset(sent.email))}
          />
          <button type="button" className="login-link" onClick={() => switchMode('login')}>
            로그인 화면으로
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="login-page">
      <div className="panel login-panel">
        {mode === 'forgot' ? (
          <h1>비밀번호 찾기</h1>
        ) : (
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
        )}

        <p className="login-lead">{LEADS[mode]}</p>

        {!isSupabaseConfigured && (
          <p className="login-error" role="alert">
            front/.env 에 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY 를 설정해야 로그인할 수 있어요.
          </p>
        )}

        {linkError && (
          <p className="login-error" role="alert">
            {linkError} 가입 인증이 안 됐다면 로그인을 시도한 뒤 인증 메일을 다시 받을 수 있어요.
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

          {mode !== 'forgot' && (
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
          )}

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
              {error.message}
            </p>
          )}

          <button type="submit" className="button-primary" disabled={submitting || !isSupabaseConfigured}>
            {submitting ? '처리 중…' : SUBMIT_LABELS[mode]}
          </button>
        </form>

        {/* 인증 안 된 계정으로 로그인 시도 → 그 자리에서 인증 메일 재발송 */}
        {error?.code === 'email_not_confirmed' && (
          <ResendButton
            label="인증 메일 다시 보내기"
            sentMessage={`${email.trim()} 으로 인증 메일을 다시 보냈어요.`}
            onSend={() => resendConfirmation(email.trim())}
          />
        )}

        {mode === 'login' && (
          <button type="button" className="login-link" onClick={() => switchMode('forgot')}>
            비밀번호를 잊으셨나요?
          </button>
        )}
        {mode === 'forgot' && (
          <button type="button" className="login-link" onClick={() => switchMode('login')}>
            로그인 화면으로
          </button>
        )}
      </div>
    </section>
  )
}

export default LoginPage
