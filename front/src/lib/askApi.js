// AI 질문(RAG) API 클라이언트.
//
// 서버 응답은 SSE(text/event-stream)로, 각 이벤트의 data 는 아래 JSON 중 하나입니다.
//   { type: 'delta', text }                                   답변 조각
//   { type: 'citations', items: Citation[] }                  근거 목록
//   { type: 'done', grounded: boolean }                       끝 (grounded=false 면 근거 부족)
//   { type: 'error', message }
// Citation = { n, program_id, title, host_org, type, section, snippet, url, apply_end }
//
// 백엔드가 준비되기 전에는 mock 으로 동작합니다. 실제 서버를 쓰려면 front/.env 에 VITE_ASK_MOCK=false

import { PROGRAM_TYPES, REGIONS } from '../data/constants.js'
import { daysUntil, formatDate } from '../utils/date.js'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
export const ASK_MOCK = import.meta.env.VITE_ASK_MOCK !== 'false'

/**
 * 질문을 보내고 응답 이벤트를 onEvent 로 하나씩 전달합니다.
 * @param {{ question: string, history: {role: string, content: string}[], profile: object | null }} body
 * @param {{ signal?: AbortSignal, onEvent: (event: object) => void, programs?: object[] }} options
 *   programs 는 mock 에서 근거로 쓸 공고 목록
 */
export async function askQuestion(body, { signal, onEvent, programs = [] }) {
  if (ASK_MOCK) return mockAsk(body, { signal, onEvent, programs })

  const res = await fetch(`${API_BASE_URL}/api/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify(body),
    signal,
  })
  if (!res.ok || !res.body) throw new Error(`서버 응답 오류 (${res.status})`)

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
  let buffer = ''
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += value
    const events = buffer.split('\n\n')
    buffer = events.pop()
    for (const raw of events) {
      const data = raw
        .split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trimStart())
        .join('\n')
      if (data) onEvent(JSON.parse(data))
    }
  }
}

// ---------- mock ----------

const TYPE_KEYWORDS = {
  STARTUP: ['창업', '스타트업', '사업화', '예비창업'],
  CONTEST: ['공모전', '경진대회', '대회', '아이디어'],
  POLICY: ['정책', '청년', '지원금', '수당', '주거'],
  EDUCATION: ['교육', '인턴', '일경험', '부트캠프', '취업'],
}

const PARTICLES = /(은|는|이|가|을|를|에|에서|의|로|으로|도|만|랑|하고|알려줘|있어|있나요|할|수)$/

function tokenize(text) {
  return text
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .map((w) => w.replace(PARTICLES, ''))
    .filter((w) => w.length >= 2)
}

function pickPrograms(question, programs) {
  const tokens = tokenize(question)
  const types = Object.keys(TYPE_KEYWORDS).filter((t) => TYPE_KEYWORDS[t].some((k) => question.includes(k)))
  const regions = REGIONS.filter((r) => question.includes(r))
  const thisMonth = /이번\s*달|이달/.test(question)

  return programs
    .filter((p) => daysUntil(p.apply_end) >= 0)
    .filter((p) => !thisMonth || daysUntil(p.apply_end) <= 31)
    .map((p) => {
      const haystack = `${p.title} ${p.summary ?? ''} ${p.target_text ?? ''}`
      let score = tokens.filter((t) => haystack.includes(t)).length
      if (types.includes(p.type)) score += 3
      if (regions.length && regions.some((r) => p.region?.includes(r))) score += 2
      return { p, score }
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || daysUntil(a.p.apply_end) - daysUntil(b.p.apply_end))
    .slice(0, 3)
    .map((x) => x.p)
}

function snippetOf(program) {
  const text = (program.target_text || program.summary || '').replace(/\s+/g, ' ').trim()
  return text.length > 140 ? `${text.slice(0, 140)}…` : text
}

function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('중지됨', 'AbortError'))
    })
  })
}

async function mockAsk({ question }, { signal, onEvent, programs }) {
  await wait(500, signal)
  const picked = pickPrograms(question, programs)

  if (picked.length === 0) {
    const text =
      '공고 원문에서 질문에 맞는 근거를 찾지 못했어요.\n' +
      '유형(창업·공모전·청년정책·교육), 지역, 학년처럼 조건을 더 구체적으로 적어 주시면 다시 찾아볼게요.'
    for (const piece of text.match(/.{1,3}/gsu)) {
      onEvent({ type: 'delta', text: piece })
      await wait(15, signal)
    }
    onEvent({ type: 'done', grounded: false })
    return
  }

  const citations = picked.map((p, i) => ({
    n: i + 1,
    program_id: p.id,
    title: p.title,
    host_org: p.host_org,
    type: p.type,
    section: p.target_text ? '지원대상' : '사업 요약',
    snippet: snippetOf(p),
    url: p.url,
    apply_end: p.apply_end,
  }))
  onEvent({ type: 'citations', items: citations })

  const lines = picked.map(
    (p, i) =>
      `- ${p.title} (${PROGRAM_TYPES[p.type]}, ${p.host_org ?? '기관 미상'}) — 마감 ${formatDate(p.apply_end)} [${i + 1}]`,
  )
  const text =
    `질문하신 조건과 관련된 모집 중 공고를 ${picked.length}개 찾았어요.\n\n` +
    `${lines.join('\n')}\n\n` +
    '세부 자격요건은 공고마다 다르니 아래 근거 카드에서 원문을 꼭 확인해 주세요.'

  for (const piece of text.match(/.{1,3}/gsu)) {
    onEvent({ type: 'delta', text: piece })
    await wait(18, signal)
  }
  onEvent({ type: 'done', grounded: true })
}
