import { usePrograms } from '../context/programs.js'

// 프로그램 데이터를 불러오는 중이거나 실패했을 때 보여줄 화면. 정상이면 null
function LoadState() {
  const { loading, error, reload } = usePrograms()

  if (loading) {
    return (
      <div className="empty-state" role="status">
        <p>프로그램을 불러오는 중이에요…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="empty-state" role="alert">
        <p>프로그램을 불러오지 못했어요.</p>
        <p className="panel-note">{error.message}</p>
        <button type="button" className="button-secondary" onClick={reload}>
          다시 시도
        </button>
      </div>
    )
  }

  return null
}

export default LoadState
