import { Link } from 'react-router-dom'
import CitationCard from './CitationCard.jsx'

// 한 줄 안의 [n] 을 근거 버튼으로 바꿈 (해당 번호의 근거가 있을 때만)
function renderInline(line, citationNums, onCitationClick) {
  return line.split(/(\[\d+\])/g).map((part, i) => {
    const match = part.match(/^\[(\d+)\]$/)
    if (match && citationNums.has(Number(match[1]))) {
      const n = Number(match[1])
      return (
        <button
          key={i}
          type="button"
          className="chat-cite"
          onClick={() => onCitationClick(n)}
          aria-label={`근거 ${n} 보기`}
        >
          {n}
        </button>
      )
    }
    return part
  })
}

// 줄바꿈 → 문단, "- " 로 시작하는 연속된 줄 → 목록
function renderContent(text, citations, onCitationClick) {
  const nums = new Set(citations.map((c) => c.n))
  const blocks = []
  for (const line of text.split('\n')) {
    const isItem = line.startsWith('- ')
    const last = blocks.at(-1)
    if (isItem && last?.type === 'list') last.items.push(line.slice(2))
    else if (isItem) blocks.push({ type: 'list', items: [line.slice(2)] })
    else if (line.trim()) blocks.push({ type: 'p', text: line })
  }
  return blocks.map((block, i) =>
    block.type === 'list' ? (
      <ul key={i}>
        {block.items.map((item, j) => (
          <li key={j}>{renderInline(item, nums, onCitationClick)}</li>
        ))}
      </ul>
    ) : (
      <p key={i}>{renderInline(block.text, nums, onCitationClick)}</p>
    ),
  )
}

function ChatMessage({ message, activeCitation, onCitationClick, onRetry }) {
  if (message.role === 'user') {
    return (
      <div className="chat-row user">
        <div className="chat-bubble user">{message.content}</div>
      </div>
    )
  }

  const citations = message.citations ?? []
  const streaming = message.status === 'streaming'

  return (
    <div className="chat-row assistant">
      <div className="chat-avatar" aria-hidden="true">
        AI
      </div>
      <div className="chat-answer">
        <div className="chat-bubble assistant">
          {message.content ? (
            renderContent(message.content, citations, (n) => onCitationClick(message.id, n))
          ) : streaming ? (
            <span className="chat-typing" aria-label="답변 작성 중">
              <span />
              <span />
              <span />
            </span>
          ) : null}
          {streaming && message.content && <span className="chat-caret" aria-hidden="true" />}
          {message.status === 'stopped' && <p className="chat-meta">답변을 중지했어요.</p>}
        </div>

        {message.status === 'error' && (
          <div className="chat-error" role="alert">
            <span>답변을 받지 못했어요. {message.error}</span>
            <button type="button" className="button-secondary" onClick={onRetry}>
              다시 시도
            </button>
          </div>
        )}

        {message.status === 'done' && message.grounded === false && (
          <p className="chat-meta">
            근거 없이 추측해서 답하지 않아요. <Link to="/">필터로 직접 찾아보기</Link>
          </p>
        )}

        {citations.length > 0 && (
          <div className="chat-citations">
            <p className="chat-citations-title">근거 공고 {citations.length}건</p>
            {citations.map((c) => (
              <CitationCard key={c.n} citation={c} active={activeCitation === c.n} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatMessage
