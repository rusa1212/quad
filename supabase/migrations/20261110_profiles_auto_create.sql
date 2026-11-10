-- 회원가입(auth.users 생성) 시 profiles 행 자동 생성 + 이메일 표시용 컬럼 추가
-- 실행: Supabase 대시보드 → SQL Editor → 이 파일 내용 붙여넣기 → Run (여러 번 실행해도 안전)
-- 새로 DB를 만드는 경우엔 supabase/schema.sql 에 이미 포함돼 있어 따로 실행할 필요 없음

-- 1) Table Editor에서 누구의 프로필인지 알아보기 위한 이메일 컬럼
alter table public.profiles add column if not exists email text;

-- 2) 가입 시 실행될 함수
--    security definer: 가입 요청자 권한이 아니라 함수 소유자 권한으로 실행 (RLS 우회)
--    search_path = '': 다른 스키마의 같은 이름 객체가 끼어들지 못하게 고정
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 3) auth.users 에 행이 생길 때마다 위 함수 실행
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4) 이메일을 바꾸면 profiles.email 도 따라가게
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

-- 5) 트리거를 만들기 전에 가입한 기존 회원도 profiles 행 채우기
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do update set email = excluded.email;
