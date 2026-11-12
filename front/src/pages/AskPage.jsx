import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import ChatInput from '../components/chat/ChatInput.jsx'
import ChatMessage from '../components/chat/ChatMessage.jsx'
import SuggestedQuestions from '../components/chat/SuggestedQuestions.jsx'
import { useProfile } from '../context/profile.js'
import { usePrograms } from '../context/programs.js'
import { ASK_MOCK, askQuestion } from '../lib/askApi.js'
import './AskPage.css'

const STORAGE_KEY = 'program-hub.ask'
const HISTORY_TURNS = 6 // 서버에 넘길 최근 메시지 수

// 대화는 탭을 닫으면 사라지도록 sessionStorage 에 저장 (막힌 환경이면 저장 안 함)
function loadMessages() {
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? '[]')
    // 새로고침으로 끊긴 답변은 '중지됨'으로 표시
    return saved.map((m) => (m.status === 'streaming' ? { ...m, status: 'stopped' } : m))
  } catch {
    return []
  }
}

function saveMessages(messages) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  } catch {
    // 무시
  }
}

function describeProfile(profile) {
  if (!profile) return ''
  return [profile.grade && `${profile.grade}학년`, profile.major, profile.region].filter(Boolean).join(' · ')
}

let idSeq = 0
const newId = () => `${Date.now()}-${idSeq++}`

function AskPage() {
  const { profile } = useProfile()
  const { programs } = usePrograms()
  const [messages, setMessages] = useState(loadMessages)
  const [useProfileFilter, setUseProfileFilter] = useState(true)
  const [activeCitation, setActiveCitation] = useState(null) // { messageId, n }
  const abortRef = useRef(null)

  const busy = messages.some((m) => m.status === 'streaming')
  const profileText = describeProfile(profile)

  useEffect(() => {
    saveMessages(messages)
  }, [messages])

  // 새 질문을 보내면 맨 아래로, 답변 조각이 올 때는 사용자가 맨 아래 근처에 있을 때만 따라감
  // (위로 올려 읽는 중에는 끌어내리지 않음. 하단 고정 입력창에 가리지 않도록 문서 끝까지 스크롤)
  const lastContent = messages.at(-1)?.content
  const stickToBottom = useRef(true)
  useEffect(() => {
    const onScroll = () => {
      const { scrollY, innerHeight } = window
      stickToBottom.current = scrollY + innerHeight >= document.documentElement.scrollHeight - 120
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => {
    stickToBottom.current = true
  }, [messages.length])
  useEffect(() => {
    if (stickToBottom.current) window.scrollTo({ top: document.documentElement.scrollHeight })
  }, [messages.length, lastContent])

  // 페이지를 떠나면 진행 중인 요청 취소
  useEffect(() => () => abortRef.current?.abort(), [])

  function patchMessage(id, patch) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...(typeof patch === 'function' ? patch(m) : patch) } : m)))
  }

  async function run(question, history) {
    const answerId = newId()
    setMessages((prev) => [...prev, { id: answerId, role: 'assistant', content: '', citations: [], status: 'streaming' }])

    const controller = new AbortController()
    abortRef.current = controller
    try {
      await askQuestion(
        {
          question,
          history: history.slice(-HISTORY_TURNS).map(({ role, content }) => ({ role, content })),
          profile: useProfileFilter ? profile : null,
        },
        {
          signal: controller.signal,
          programs,
          onEvent(event) {
            if (event.type === 'delta') patchMessage(answerId, (m) => ({ content: m.content + event.text }))
            else if (event.type === 'citations') patchMessage(answerId, { citations: event.items })
            else if (event.type === 'done') patchMessage(answerId, { status: 'done', grounded: event.grounded })
            else if (event.type === 'error') throw new Error(event.message)
          },
        },
      )
      // 서버가 done 없이 끝낸 경우
      patchMessage(answerId, (m) => (m.status === 'streaming' ? { status: 'done' } : {}))
    } catch (e) {
      if (e.name === 'AbortError') patchMessage(answerId, { status: 'stopped' })
      else patchMessage(answerId, { status: 'error', error: e.message })
    } finally {
      if (abortRef.current === controller) abortRef.current = null
    }
  }

  function send(question) {
    if (busy) return
    const history = messages.filter((m) => m.status !== 'error' && m.content)
    setMessages((prev) => [...prev, { id: newId(), role: 'user', content: question }])
    setActiveCitation(null)
    run(question, history)
  }

  // 실패한 답변을 지우고 같은 질문으로 다시 요청
  function retry(answerId) {
    const index = messages.findIndex((m) => m.id === answerId)
    const question = messages[index - 1]
    if (!question || question.role !== 'user') return
    const history = messages.slice(0, index - 1).filter((m) => m.status !== 'error' && m.content)
    setMessages((prev) => prev.filter((m) => m.id !== answerId))
    run(question.content, history)
  }

  function reset() {
    abortRef.current?.abort()
    setMessages([])
    setActiveCitation(null)
  }

  return (
    <section className="ask-page">
      <header className="ask-header">
        <div>
          <h1>AI 질문</h1>
          <p className="ask-subtitle">공고 원문을 근거로 답하고, 출처를 함께 보여드려요.</p>
        </div>
        {messages.length > 0 && (
          <button type="button" className="button-secondary ask-reset" onClick={reset}>
            새 대화
          </button>
        )}
      </header>

      {ASK_MOCK && (
        <p className="ask-mock-note">
          미리보기 모드예요. 실제 AI 대신 공고 목록에서 키워드로 찾은 예시 답변을 보여줘요.
        </p>
      )}

      <div className="ask-messages">
        {messages.length === 0 ? (
          <div className="ask-empty">
            <h2>무엇이든 물어보세요</h2>
            <p>학년·전공·지역 같은 조건을 함께 적으면 더 정확하게 찾아드려요.</p>
            <SuggestedQuestions onPick={send} />
          </div>
        ) : (
          messages.map((m) => (
            <ChatMessage
              key={m.id}
              message={m}
              activeCitation={activeCitation?.messageId === m.id ? activeCitation.n : null}
              onCitationClick={(messageId, n) => setActiveCitation({ messageId, n })}
              onRetry={() => retry(m.id)}
            />
          ))
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        {busy ? '답변을 작성하고 있어요' : messages.length > 0 ? '답변이 완료됐어요' : ''}
      </p>

      <div className="ask-composer">
        {profileText ? (
          <label className="ask-profile-chip">
            <input
              type="checkbox"
              checked={useProfileFilter}
              onChange={(e) => setUseProfileFilter(e.target.checked)}
            />
            내 프로필 조건 반영 ({profileText})
          </label>
        ) : (
          <p className="ask-profile-hint">
            <Link to="/profile">프로필</Link>을 입력하면 내 조건에 맞춰 답해드려요.
          </p>
        )}
        <ChatInput busy={busy} onSend={send} onStop={() => abortRef.current?.abort()} />
        <p className="ask-disclaimer">AI 답변은 틀릴 수 있어요. 지원 전 원문 공고를 꼭 확인하세요.</p>
      </div>
    </section>
  )
}

export default AskPage
