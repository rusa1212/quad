import { useEffect, useRef, useState } from 'react'

const MAX_LENGTH = 500

// Enter 전송, Shift+Enter 줄바꿈. 답변 중에는 전송 버튼이 중지 버튼으로 바뀜
function ChatInput({ busy, onSend, onStop }) {
  const [value, setValue] = useState('')
  const ref = useRef(null)

  // 내용에 맞춰 높이 자동 조절 (최대 6줄 정도)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [value])

  function submit() {
    const text = value.trim()
    if (!text || busy) return
    onSend(text)
    setValue('')
  }

  function handleKeyDown(e) {
    // 한글 조합 중 Enter 는 글자 확정용이므로 무시
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <form
      className="chat-input"
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
    >
      <label htmlFor="chat-question" className="sr-only">
        질문 입력
      </label>
      <textarea
        id="chat-question"
        ref={ref}
        rows={1}
        value={value}
        maxLength={MAX_LENGTH}
        placeholder="예: 서울에서 대학생이 지원할 수 있는 창업 프로그램 알려줘"
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      {busy ? (
        <button type="button" className="chat-send stop" onClick={onStop} aria-label="답변 중지">
          <span className="stop-icon" aria-hidden="true" />
        </button>
      ) : (
        <button type="submit" className="chat-send" disabled={!value.trim()} aria-label="질문 보내기">
          ↑
        </button>
      )}
    </form>
  )
}

export default ChatInput
