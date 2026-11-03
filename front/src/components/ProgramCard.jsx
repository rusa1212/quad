import { Link } from 'react-router-dom'
import { ApplyStatusBadge, DdayBadge, TypeBadge } from './Badges.jsx'
import { formatPeriod } from '../utils/date.js'
import './ProgramCard.css'

function ProgramCard({ program }) {
  return (
    <Link to={`/programs/${program.id}`} className="program-card">
      <div className="program-card-top">
        <div className="badges">
          <TypeBadge type={program.type} />
          <ApplyStatusBadge program={program} />
        </div>
        <DdayBadge applyEnd={program.apply_end} />
      </div>

      <h3 className="program-card-title">{program.title}</h3>
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
    </Link>
  )
}

export default ProgramCard
