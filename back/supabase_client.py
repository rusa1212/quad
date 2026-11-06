"""서버용 Supabase 클라이언트. 키는 back/.env 에서 읽습니다 (back/.env.example 참고).

service_role 키를 쓰므로 RLS를 우회합니다. 서버(FastAPI, 수집기)에서만 사용하세요.

연결 확인:  venv/Scripts/python supabase_client.py
"""
import os

from dotenv import load_dotenv
from supabase import Client, create_client

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))


def get_supabase() -> Client:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise RuntimeError("back/.env 에 SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 를 설정하세요.")
    return create_client(url, key)


if __name__ == "__main__":
    client = get_supabase()
    # programs 테이블이 아직 없으면 오류가 나도 '접속'은 된 것입니다.
    try:
        res = client.table("programs").select("id").limit(1).execute()
        print("연결 성공. programs 행 예시:", res.data)
    except Exception as e:  # noqa: BLE001
        print("접속은 됐지만 조회 실패 (테이블 미생성일 수 있음):", e)
