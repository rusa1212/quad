// localStorage 읽기/쓰기. 시크릿 모드나 저장소가 막힌 환경에서도 앱이 멈추지 않도록 실패는 무시합니다.

export function loadJSON(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function saveJSON(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // 저장 실패 시 새로고침하면 사라질 뿐, 화면 동작에는 영향 없음
  }
}

export function removeItem(key) {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // 무시
  }
}
