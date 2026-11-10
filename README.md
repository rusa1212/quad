# quad

대학생 참여 프로그램 통합 플랫폼. 흩어진 창업·공모전·청년정책 공고를 한곳에 모아, 내가 지원 가능한 것만 보여줍니다.
개발 계획과 진행 현황은 [docs/work.md](docs/work.md)를 참고하세요.

```
quad/
├─ front/      React + Vite 웹 화면
├─ back/       Python 수집기 (공공 API → Supabase), 추후 FastAPI 서버
├─ supabase/   DB 스키마 (schema.sql)
└─ docs/       개발 계획서
```

## 처음 한 번만 하는 설정

### 1. 준비물
- Node.js (npm 포함)
- Python 3.12 이상
- Supabase 프로젝트, 공공데이터포털 API 키

### 2. DB 테이블 만들기
Supabase 대시보드 → SQL Editor → `supabase/schema.sql` 내용 전체 붙여넣기 → Run

이미 DB를 만든 뒤에 스키마가 바뀌면 `supabase/migrations/` 안의 파일 중 아직 실행하지 않은 것만 같은 방법으로 실행합니다.

### 3. 환경변수 파일 만들기
예시 파일을 복사한 뒤 값을 채웁니다. `.env`는 git에 올라가지 않습니다.

```powershell
copy back\.env.example back\.env
copy front\.env.example front\.env
```

| 파일 | 필요한 값 |
|---|---|
| `back/.env` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DATA_GO_KR_SERVICE_KEY` (공공데이터포털 일반 인증키 **Decoding**) |
| `front/.env` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |

### 4. 패키지 설치

```powershell
# 백엔드 (back 폴더)
cd back
python -m venv venv
venv\Scripts\pip install -r requirements.txt
cd ..

# 프론트엔드 (front 폴더)
cd front
npm install
cd ..
```

## 실행

### 데이터 수집 (back 폴더)

```powershell
cd back

# Supabase 연결 확인
venv\Scripts\python supabase_client.py

# K-Startup 공고 수집
venv\Scripts\python -m collectors.kstartup --dry-run   # API 응답만 확인 (DB 저장 안 함)
venv\Scripts\python -m collectors.kstartup             # 모집중 공고를 DB에 저장
venv\Scripts\python -m collectors.kstartup --all       # 마감된 공고까지 전부 저장
```

여러 번 실행해도 같은 공고는 중복 저장되지 않고 최신 내용으로 갱신됩니다.

### 자동 수집 (GitHub Actions)

`.github/workflows/collect.yml`이 **매일 06:00 (KST)** 위 수집기를 실행합니다. 웹 화면은 새로고침하면 새 공고가 보입니다.

- 저장소 Settings → Secrets and variables → Actions 에 `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DATA_GO_KR_SERVICE_KEY` 등록
- 예약 실행은 이 파일이 **main 브랜치**에 있어야 동작합니다
- 바로 돌려보려면 Actions 탭 → Collect programs → Run workflow

### 웹 화면 (front 폴더)

```powershell
cd front

npm run dev       # 개발 서버 실행 → http://localhost:5173
npm run lint      # 코드 검사
npm run build     # 배포용 빌드 (front/dist)
npm run preview   # 빌드 결과 미리보기
```

화면은 Supabase의 `programs` 테이블을 직접 읽으므로, 목록이 비어 있으면 먼저 데이터 수집을 실행하세요.

> 명령어는 Windows PowerShell 기준입니다. macOS/Linux에서는 `venv\Scripts\python` 대신 `venv/bin/python`, `copy` 대신 `cp`를 쓰세요.
