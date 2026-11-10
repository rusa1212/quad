import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/auth.js'
import { MIN_PASSWORD } from '../data/constants.js'
import './LoginPage.css'

// 비밀번호 재설정 메일의 링크가 열리는 페이지.
// 링크를 누르면 supabase-js가 주소의 토큰으로 로그인시켜 주고, 여기서 새 비밀번호를 저장함
function ResetPasswordPage() {
  const { user, loading, linkError, clearLinkError, updatePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < MIN_PASSWORD) return setError(`비밀번호는 ${MIN_PASSWORD}자 이상이어야 해요.`)
    if (password !== passwordConfirm) return setError('비밀번호 확인이 일치하지 않아요.')

    setSubmitting(true)
    try {
      await updatePassword(password)
      setDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="empty-state" role="status">
        <p>확인하는 중이에요…</p>
      </div>
    )
  }

  // 링크가 만료됐거나, 링크 없이 들어왔는데 로그인도 안 된 경우
  if (linkError || !user) {
    return (
      <section className="login-page">
        <div className="panel login-panel">
          <h1>비밀번호 재설정</h1>
          <p className="login-error" role="alert">
            {linkError || '재설정 링크가 유효하지 않아요. 메일의 링크로 다시 들어오거나 새 메일을 받아주세요.'}
          </p>
          <Link to="/login" state={{ mode: 'forgot' }} className="button-primary" onClick={clearLinkError}>
            재설정 메일 다시 받기
          </Link>
        </div>
      </section>
    )
  }

  if (done) {
    return (
      <section className="login-page">
        <div className="panel login-panel">
          <h1>비밀번호를 바꿨어요</h1>
          <p className="login-lead">새 비밀번호로 로그인된 상태예요. 다음부터는 새 비밀번호로 로그인해 주세요.</p>
          <Link to="/" className="button-primary">
            홈으로
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="login-page">
      <div className="panel login-panel">
        <h1>새 비밀번호 정하기</h1>
        <p className="login-lead">
          <strong>{user.email}</strong> 계정의 새 비밀번호를 입력해 주세요.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div>
            <label className="field-label" htmlFor="new-password">
              새 비밀번호
            </label>
            <input
              id="new-password"
              type="password"
              className="field-input"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="field-hint">{MIN_PASSWORD}자 이상</p>
          </div>

          <div>
            <label className="field-label" htmlFor="new-password-confirm">
              새 비밀번호 확인
            </label>
            <input
              id="new-password-confirm"
              type="password"
              className="field-input"
              autoComplete="new-password"
              required
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
            />
          </div>

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="button-primary" disabled={submitting}>
            {submitting ? '저장 중…' : '비밀번호 바꾸기'}
          </button>
        </form>
      </div>
    </section>
  )
}

export default ResetPasswordPage
