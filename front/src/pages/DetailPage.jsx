import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApplyStatusBadge, DdayBadge, TypeBadge } from '../components/Badges.jsx'
import { SOURCES } from '../data/constants.js'
import { getProgramById } from '../data/programs.js'
import { formatDate, formatPeriod } from '../utils/date.js'
import { describeEligibility } from '../utils/eligibility.js'
import './DetailPage.css'

function DetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const program = getProgramById(id)

  // 목록에서 들어왔으면 뒤로가기(필터 유지), 주소로 바로 들어왔으면 목록으로
  function goBack() {
    if (window.history.state?.idx > 0) navigate(-1)
    else navigate('/')
  }

  if (!program) {
    return (
      <section className="empty-state">
        <h1>프로그램을 찾을 수 없어요</h1>
        <p>삭제되었거나 주소가 잘못되었어요.</p>
        <Link to="/">프로그램 목록으로</Link>
      </section>
    )
  }

  const card = program.summary_card
  const hasUrl = program.url && program.url !== '#'

  return (
    <article>
      <button type="button" className="back-link" onClick={goBack}>
        ← 목록으로
      </button>

      <header className="detail-header">
        <div className="badges">
          <TypeBadge type={program.type} />
          <ApplyStatusBadge program={program} />
          <DdayBadge applyEnd={program.apply_end} />
        </div>
        <h1>{program.title}</h1>
        <p>{program.summary}</p>
      </header>

      <div className="detail-layout">
        <div className="detail-main">
          <section className="panel">
            <div className="panel-title">
              <h2>한눈에 보는 요약</h2>
              <span className="ai-label">AI 요약</span>
            </div>
            <dl className="summary-list">
              <div>
                <dt>지원 대상</dt>
                <dd>{card.target}</dd>
              </div>
              <div>
                <dt>지원 내용</dt>
                <dd>{card.benefits}</dd>
              </div>
              <div>
                <dt>신청 기간</dt>
                <dd>{formatPeriod(program.apply_start, program.apply_end)}</dd>
              </div>
              <div>
                <dt>제출 서류</dt>
                <dd>
                  <ul>
                    {card.documents.map((doc) => (
                      <li key={doc}>{doc}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            </dl>
            <p className="panel-note">AI가 공고 원문을 요약한 내용이에요. 정확한 내용은 원문을 확인하세요.</p>
          </section>

          <section className="panel">
            <h2>자격요건</h2>
            <table className="eligibility-table">
              <tbody>
                {describeEligibility(program.eligibility).map((row) => (
                  <tr key={row.label} className={row.needsCheck ? 'needs-check' : ''}>
                    <th scope="row">{row.label}</th>
                    <td>{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="original-text">
              <h3>원문 지원대상</h3>
              <p>{program.target_text}</p>
            </div>
          </section>
        </div>

        <aside className="detail-aside">
          <section className="panel">
            <h2>신청 정보</h2>
            <dl className="info-list">
              <div>
                <dt>주관기관</dt>
                <dd>{program.host_org}</dd>
              </div>
              <div>
                <dt>대상 지역</dt>
                <dd>{program.region}</dd>
              </div>
              <div>
                <dt>신청 시작</dt>
                <dd>{formatDate(program.apply_start)}</dd>
              </div>
              <div>
                <dt>신청 마감</dt>
                <dd>{formatDate(program.apply_end)}</dd>
              </div>
              <div>
                <dt>정보 출처</dt>
                <dd>{SOURCES[program.source]}</dd>
              </div>
            </dl>

            {hasUrl ? (
              <a href={program.url} target="_blank" rel="noreferrer" className="button-primary">
                공고 원문 보기 ↗
              </a>
            ) : (
              <span className="button-primary disabled">원문 링크 없음</span>
            )}

            {program.attachments.length > 0 && (
              <div className="attachments">
                <h3>첨부파일</h3>
                <ul>
                  {program.attachments.map((file) => (
                    <li key={file.name}>{file.name}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="panel-note">마지막 수집: {program.updated_at.replace('T', ' ').slice(0, 16)}</p>
          </section>
        </aside>
      </div>
    </article>
  )
}

export default DetailPage
