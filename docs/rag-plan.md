# RAG 채팅 구현 계획

공고 원문을 근거로 자격요건·제출서류·일정 질문에 출처와 함께 답하는 AI 질문 기능의 구현 순서입니다.
전체 설계는 [work.md 8장 RAG 설계](work.md)를 따릅니다.

## 현재 상태

| 항목 | 상태 |
|---|---|
| 채팅 UI (`front/src/pages/AskPage.jsx`, `components/chat/`) | ✅ 완료, mock 응답으로 동작 |
| 응답 규격 (SSE 이벤트) | ✅ `front/src/lib/askApi.js` 상단 주석에 정의 |
| `program_chunks` 테이블 (`vector(1024)`) | ✅ 생성됨, 데이터 없음 |
| 청킹·임베딩 파이프라인 | ⬜ |
| 검색 함수 (Supabase RPC) | ⬜ |
| FastAPI `/api/ask` | ⬜ (`back/`에 서버 코드 없음) |

## 진행 순서

**데이터 → 검색 → 서버 → 연결 → 평가** 순서로 진행합니다.
세그먼트 0~5를 공고 본문만으로 먼저 끝까지 연결해 동작을 확인한 뒤, 6(PDF)과 7(평가)로 품질을 올립니다.

---

### 세그먼트 0. 준비

- [ ] 임베딩 모델 선정: **한국어 지원 + 출력 차원 1024**
  - 차원이 다르면 `supabase/schema.sql`의 `vector(1024)`도 함께 변경
- [ ] `back/.env`에 `EMBEDDING_API_KEY`, `ANTHROPIC_API_KEY` 입력 (`.env.example`에도 키 이름 추가)
- [ ] `back/requirements.txt`에 임베딩 SDK, `anthropic`, `pymupdf` 추가

### 세그먼트 1. 청킹 (본문 우선)

- [ ] `back/rag/chunker.py` 작성
- [ ] `programs`의 공고 본문을 섹션 단위로 분할: 지원대상 / 지원내용 / 신청방법 / 제출서류
- [ ] 긴 섹션은 토큰 기준으로 재분할하고, 앞뒤 청크가 조금씩 겹치게 함
- [ ] 청크마다 `program_id`, `section` 부여
  - 지역·유형·마감일은 검색할 때 `programs`와 join → 청크에 중복 저장하지 않음

### 세그먼트 2. 임베딩과 적재

- [ ] `back/rag/embed.py` 작성: 청크를 배치로 임베딩한 뒤 `program_chunks`에 upsert
- [ ] 내용 해시를 저장해 변경된 공고만 다시 임베딩 (비용 절감)
- [ ] GitHub Actions 수집 스케줄러에 "수집 → 임베딩" 단계 추가

### 세그먼트 3. 검색 (Supabase SQL)

`supabase/migrations/`에 마이그레이션 추가

- [ ] `embedding` 컬럼 HNSW 인덱스
- [ ] 키워드 검색용 인덱스. 한국어는 Postgres 기본 full-text 검색이 약하므로 `pg_trgm` 병행 권장
- [ ] `match_chunks(query_embedding, query_text, filters, k)` RPC 함수
  1. 메타데이터로 먼저 걸러냄 (마감 전, 지역)
  2. 벡터 점수와 키워드 점수를 합산 (RRF)
  3. 상위 k개 반환
- [ ] Python에서 샘플 질문으로 검색 결과를 직접 확인

### 세그먼트 4. FastAPI `/api/ask`

- [ ] `back/main.py`에 FastAPI 앱 작성, CORS 허용 (`http://localhost:5173`)
- [ ] 요청 `{ question, history, profile }` 처리 흐름
  1. 질문 임베딩
  2. `match_chunks`로 근거 청크 검색
  3. 점수가 기준보다 낮으면 바로 `done, grounded:false` → **근거 없으면 답변 보류**
  4. 근거가 있으면 `citations` 전송 → LLM 답변을 `delta`로 스트리밍 → `done`
- [ ] 시스템 프롬프트: 근거 청크 안의 내용만 사용, 문장마다 `[n]`으로 출처 표시
- [ ] 응답은 `askApi.js`에 정의된 SSE 규격을 그대로 따름 (프론트 수정 불필요)

```
{ type: 'delta', text }                       답변 조각
{ type: 'citations', items: Citation[] }      근거 목록
{ type: 'done', grounded: boolean }           끝 (grounded=false 면 근거 부족)
{ type: 'error', message }
Citation = { n, program_id, title, host_org, type, section, snippet, url, apply_end }
```

### 세그먼트 5. 프론트 연결

- [ ] `front/.env`에서 `VITE_ASK_MOCK=false`로 바꾸고 `VITE_API_BASE_URL` 확인
- [ ] 실제 서버로 스트리밍 중지, 에러 표시, 근거 카드 링크 점검

### 세그먼트 6. 첨부 PDF 확장

- [ ] PyMuPDF로 첨부 PDF 텍스트 추출 → 세그먼트 1~2 파이프라인에 그대로 투입
- 스캔본·표 처리 같은 변수가 많아 본문 흐름이 동작한 뒤에 진행

### 세그먼트 7. 평가와 개선

- [ ] 테스트 질의 30~50개 + 정답(공고·섹션) 작성
- [ ] 측정 지표
  - 검색 적중률: 정답 청크가 top-k 안에 드는 비율
  - 근거 일치율: 답변 내용이 인용한 근거와 일치하는 비율
- [ ] 결과를 보고 청크 크기, k, 점수 기준, 키워드/벡터 가중치 조정

---

## 파일 구성 (예정)

```
back/
├─ main.py            FastAPI 앱, /api/ask (SSE)
└─ rag/
   ├─ chunker.py      섹션 단위 청킹
   ├─ embed.py        임베딩 생성·적재
   └─ retrieve.py     match_chunks 호출
supabase/migrations/
└─ YYYYMMDD_rag_search.sql   인덱스 + match_chunks 함수
```
