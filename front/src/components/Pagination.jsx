import './Pagination.css'

const WINDOW = 2 // 현재 페이지 앞뒤로 보여줄 번호 수

// [1, '…', 4, 5, 6, '…', 20] 형태의 번호 목록
function getPageItems(page, totalPages) {
  const items = []
  const start = Math.max(2, page - WINDOW)
  const end = Math.min(totalPages - 1, page + WINDOW)

  items.push(1)
  if (start > 2) items.push('gap-start')
  for (let p = start; p <= end; p += 1) items.push(p)
  if (end < totalPages - 1) items.push('gap-end')
  if (totalPages > 1) items.push(totalPages)
  return items
}

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null

  return (
    <nav className="pagination" aria-label="페이지">
      <button type="button" className="page-button" onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="이전 페이지">
        ‹
      </button>
      {getPageItems(page, totalPages).map((item) =>
        typeof item === 'number' ? (
          <button
            key={item}
            type="button"
            className={item === page ? 'page-button active' : 'page-button'}
            onClick={() => onChange(item)}
            aria-current={item === page ? 'page' : undefined}
          >
            {item}
          </button>
        ) : (
          <span key={item} className="page-gap" aria-hidden="true">
            …
          </span>
        ),
      )}
      <button
        type="button"
        className="page-button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="다음 페이지"
      >
        ›
      </button>
    </nav>
  )
}

export default Pagination
