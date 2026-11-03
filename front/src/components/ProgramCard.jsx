import { Link } from 'react-router-dom'
import { ApplyStatusBadge, DdayBadge, EligibilityBadge, TypeBadge } from './Badges.jsx'
import BookmarkButton from './BookmarkButton.jsx'
import { formatPeriod } from '../utils/date.js'
import './ProgramCard.css'

// eligibilityStatus: 'ELIGIBLE' | 'CHECK' | 'INELIGIBLE' | undefined(프로필 없음)
// 카드 전체가 클릭되도록 제목 링크를 카드 크기로 늘리고(::after), 관심 저장 버튼만 그 위에 둠
function ProgramCard({ program, eligibilityStatus }) {
  return (
    <article className="program-card">
      <div className="program-card-top">
        <div className="badges">
          <TypeBadge type={program.type} />
          <ApplyStatusBadge program={program} />
          <EligibilityBadge status={eligibilityStatus} />
        </div>
        <div className="program-card-actions">
          <DdayBadge applyEnd={program.apply_end} />
          <BookmarkButton programId={program.id} />
        </div>
      </div>

      <h3 className="program-card-title">
        <Link to={`/programs/${program.id}`} className="program-card-link">
          {program.title}
        </Link>
      </h3>
      <p className="program-card-summary">{program.summary}</p>

      <dl className="program-card-meta">
        <div>
          <dt>주관</dt>
          <dd>{program.host_org}</dd>
        </div>
        <div>
          <dt>지역</dt>
          <dd>{program.region}</dd>
        </div>
        <div>
          <dt>기간</dt>
          <dd>{formatPeriod(program.apply_start, program.apply_end)}</dd>
        </div>
      </dl>
    </article>
  )
}

export default ProgramCard
