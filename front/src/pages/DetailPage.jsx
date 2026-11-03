import { Link, useParams } from 'react-router-dom'

function DetailPage() {
  const { id } = useParams()

  return (
    <section>
      <Link to="/">← 목록으로</Link>
      <h1>프로그램 상세</h1>
      <p>프로그램 {id}의 요약 카드와 자격요건 대조 결과가 들어갈 자리예요. (4단계)</p>
    </section>
  )
}

export default DetailPage
