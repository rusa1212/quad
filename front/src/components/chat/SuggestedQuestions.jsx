const SUGGESTIONS = [
  'AI 전공 2학년이 이번 달 지원할 수 있는 창업 프로그램 알려줘',
  '서울에 사는 대학생이 받을 수 있는 청년정책 있어?',
  '팀 없이 혼자 참여할 수 있는 공모전 찾아줘',
  '방학 동안 할 수 있는 인턴·일경험 프로그램은?',
]

function SuggestedQuestions({ onPick }) {
  return (
    <div className="chat-suggestions">
      {SUGGESTIONS.map((q) => (
        <button key={q} type="button" className="chat-suggestion" onClick={() => onPick(q)}>
          {q}
        </button>
      ))}
    </div>
  )
}

export default SuggestedQuestions
