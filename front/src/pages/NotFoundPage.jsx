import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <section>
      <h1>페이지를 찾을 수 없어요</h1>
      <p>
        주소가 잘못되었거나 삭제된 페이지예요. <Link to="/">프로그램 찾기로 돌아가기</Link>
      </p>
    </section>
  )
}

export default NotFoundPage
