import { useEffect, useState } from 'react'

// Supabase는 같은 주소로 60초 안에 다시 보내면 거절하므로 그동안 버튼을 막아둠
const COOLDOWN_SECONDS = 60

// 메일 다시 보내기 버튼. onSend는 실패 시 throw하는 async 함수
function ResendButton({ onSend, label, sentMessage, startCoolingDown = false }) {
  const [secondsLeft, setSecondsLeft] = useState(startCoolingDown ? COOLDOWN_SECONDS : 0)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (secondsLeft <= 0) return
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [secondsLeft])

  async function handleClick() {
    setSending(true)
    setMessage('')
    setError('')
    try {
      await onSend()
      setMessage(sentMessage)
      setSecondsLeft(COOLDOWN_SECONDS)
    } catch (e) {
      setError(e.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="login-resend">
      <button type="button" className="button-secondary" onClick={handleClick} disabled={sending || secondsLeft > 0}>
        {sending ? '보내는 중…' : secondsLeft > 0 ? `${label} (${secondsLeft}초 후 가능)` : label}
      </button>
      {message && (
        <p className="field-hint" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="login-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export default ResendButton
