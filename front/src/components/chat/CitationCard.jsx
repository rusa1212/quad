import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { DdayBadge, TypeBadge } from '../Badges.jsx'

function CitationCard({ citation, active }) {
  const ref = useRef(null)
  const hasUrl = citation.url && citation.url !== '#'

  // 본문의 [n] 을 누르면 해당 카드로 스크롤
  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [active])

  return (
    <article ref={ref} className={active ? 'citation-card active' : 'citation-card'}>
      <div className="citation-head">
        <span className="citation-num">{citation.n}</span>
        {citation.type && <TypeBadge type={citation.type} />}
        <DdayBadge applyEnd={citation.apply_end} />
      </div>
      <Link to={`/programs/${citation.program_id}`} className="citation-title">
        {citation.title}
      </Link>
      {citation.host_org && <p className="citation-org">{citation.host_org}</p>}
      {citation.snippet && (
        <blockquote className="citation-snippet">
          {citation.section && <span className="citation-section">{citation.section}</span>}
          {citation.snippet}
        </blockquote>
      )}
      <div className="citation-links">
        <Link to={`/programs/${citation.program_id}`}>상세 보기</Link>
        {hasUrl && (
          <a href={citation.url} target="_blank" rel="noreferrer">
            원문 공고 ↗
          </a>
        )}
      </div>
    </article>
  )
}

export default CitationCard
