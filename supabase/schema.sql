-- work.md 7장 데이터 설계를 Supabase(Postgres)용으로 옮긴 초기 스키마.
-- 실행: Supabase 대시보드 → SQL Editor → 이 파일 내용 붙여넣기 → Run
-- 사용자 계정은 Supabase Auth(auth.users)를 쓰고, 프로필은 profiles 테이블에 둡니다.

create extension if not exists vector;  -- pgvector (RAG용, 8장)

-- ── 7.1 통합 프로그램 ──
create table if not exists public.programs (
  id            text primary key,
  source        text not null check (source in ('KSTARTUP','YOUTH_CENTER','BIZINFO','FILE','USER')),
  source_id     text not null,
  title         text not null,
  type          text not null check (type in ('STARTUP','CONTEST','POLICY','EDUCATION')),
  summary       text,
  host_org      text,
  target_text   text,
  eligibility   jsonb,          -- { grades, regions, majors, age:{min,max}, team, note }
  region        text,
  apply_start   date,
  apply_end     date,
  url           text,
  attachments   jsonb default '[]'::jsonb,
  summary_card  jsonb,          -- 5.5 요약 카드 (LLM 생성 캐시)
  updated_at    timestamptz default now(),
  unique (source, source_id)    -- 중복 수집 방지
);
create index if not exists programs_apply_end_idx on public.programs (apply_end);
create index if not exists programs_type_idx on public.programs (type);

-- ── 7.2 사용자 프로필 (auth.users 1:1) ──
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  grade       smallint check (grade between 1 and 4),
  major       text,
  region      text,
  age         smallint,
  team        text,             -- 'TEAM' | 'SOLO' | null
  interests   text[] default '{}',
  updated_at  timestamptz default now()
);

-- ── 7.2 관심 프로그램 ──
create table if not exists public.bookmarks (
  user_id     uuid not null references auth.users (id) on delete cascade,
  program_id  text not null references public.programs (id) on delete cascade,
  created_at  timestamptz default now(),
  primary key (user_id, program_id)
);

-- ── 7.2 알림 예약/발송 이력 ──
create table if not exists public.notifications (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  program_id  text not null references public.programs (id) on delete cascade,
  kind        text not null check (kind in ('D7','D1')),
  channel     text not null default 'EMAIL' check (channel in ('EMAIL','PUSH')),
  send_at     timestamptz not null,
  sent_at     timestamptz,
  unique (user_id, program_id, kind)
);

-- ── 8장 RAG: 공고 본문/첨부 청크 ──
-- 임베딩 차원(1024)은 쓰는 임베딩 모델에 맞춰 바꾸세요.
create table if not exists public.program_chunks (
  id          bigint generated always as identity primary key,
  program_id  text not null references public.programs (id) on delete cascade,
  section     text,             -- 지원대상 / 지원내용 / 신청방법 / 제출서류 ...
  content     text not null,
  embedding   vector(1024),
  created_at  timestamptz default now()
);

-- ── RLS (anon 키로 접근하는 프론트용 권한) ──
-- 서버는 service_role 키를 쓰므로 RLS의 영향을 받지 않습니다.
alter table public.programs       enable row level security;
alter table public.profiles       enable row level security;
alter table public.bookmarks      enable row level security;
alter table public.notifications  enable row level security;
alter table public.program_chunks enable row level security;

-- 프로그램: 누구나 읽기만 가능
create policy "programs are public" on public.programs
  for select using (true);

-- 프로필/북마크/알림: 본인 것만
create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own bookmarks" on public.bookmarks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own notifications (read)" on public.notifications
  for select using (auth.uid() = user_id);
-- program_chunks 는 정책 없음 → 서버(service_role)만 접근
