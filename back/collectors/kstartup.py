"""K-Startup 지원사업 공고 수집기 (공공데이터포털 15125364, work.md 4.1).

엔드포인트: https://apis.data.go.kr/B552735/kisedKstartupService01/getAnnouncementInformation01
인증키:    back/.env 의 DATA_GO_KR_SERVICE_KEY (일반 인증키 Decoding 값)

실행 (back 폴더에서):
  venv/Scripts/python -m collectors.kstartup --dry-run   # API 응답만 확인, DB 저장 안 함
  venv/Scripts/python -m collectors.kstartup             # 모집중 공고를 programs 테이블에 upsert
  venv/Scripts/python -m collectors.kstartup --all       # 마감 공고까지 전부
"""
import argparse
import json
import os
import sys
from datetime import date, datetime, timezone

import httpx
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

BASE_URL = "https://apis.data.go.kr/B552735/kisedKstartupService01/getAnnouncementInformation01"
PER_PAGE = 100


def fetch_page(client: httpx.Client, service_key: str, page: int, only_open: bool) -> dict:
    params = {
        "serviceKey": service_key,
        "page": page,
        "perPage": PER_PAGE,
        "returnType": "json",
    }
    if only_open:
        params["cond[rcrt_prgs_yn::EQ]"] = "Y"
    res = client.get(BASE_URL, params=params, timeout=30)
    if res.status_code != 200:
        raise RuntimeError(f"HTTP {res.status_code}: {res.text[:500]}")
    try:
        return res.json()
    except ValueError:
        # 키 오류 등은 XML/텍스트로 오는 경우가 있음
        raise RuntimeError(f"JSON이 아닌 응답: {res.text[:500]}") from None


def fetch_all(service_key: str, only_open: bool, max_pages: int | None = None) -> list[dict]:
    items: list[dict] = []
    with httpx.Client() as client:
        page = 1
        while True:
            body = fetch_page(client, service_key, page, only_open)
            data = body.get("data") or []
            items.extend(data)
            total = body.get("matchCount") or body.get("totalCount") or 0
            print(f"  page {page}: {len(data)}건 (누적 {len(items)} / {total})")
            if not data or len(items) >= total or (max_pages and page >= max_pages):
                break
            page += 1
    return items


def parse_date(value) -> str | None:
    """'20261107' / '2026-11-07' / '20261107 00:00' 등 → '2026-11-07'"""
    if not value:
        return None
    digits = "".join(ch for ch in str(value) if ch.isdigit())[:8]
    if len(digits) != 8:
        return None
    try:
        return date(int(digits[:4]), int(digits[4:6]), int(digits[6:8])).isoformat()
    except ValueError:
        return None


def normalize(item: dict) -> dict | None:
    """K-Startup 응답 1건 → programs 행 (work.md 7.1).

    eligibility / summary_card 는 LLM 단계에서 채우므로 여기서 넣지 않음 (upsert 시 기존 값 보존).
    """
    source_id = item.get("pbanc_sn")
    title = item.get("biz_pbanc_nm")
    if not source_id or not title:
        return None
    return {
        "id": f"KSTARTUP-{source_id}",
        "source": "KSTARTUP",
        "source_id": str(source_id),
        "title": title.strip(),
        "type": "STARTUP",
        "summary": item.get("pbanc_ctnt"),
        "host_org": item.get("pbanc_ntrp_nm") or item.get("sprv_inst"),
        "target_text": item.get("aply_trgt_ctnt") or item.get("aply_trgt"),
        "region": item.get("supt_regin"),
        "apply_start": parse_date(item.get("pbanc_rcpt_bgng_dt")),
        "apply_end": parse_date(item.get("pbanc_rcpt_end_dt")),
        "url": item.get("detl_pg_url") or item.get("biz_aply_url") or item.get("biz_gdnc_url"),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="1페이지만 받아 원본/변환 결과 출력, DB 저장 안 함")
    parser.add_argument("--all", action="store_true", help="모집 마감 공고까지 수집")
    args = parser.parse_args()

    service_key = os.getenv("DATA_GO_KR_SERVICE_KEY")
    if not service_key:
        sys.exit("back/.env 에 DATA_GO_KR_SERVICE_KEY 를 설정하세요.")

    print("K-Startup 공고 수집 시작")
    items = fetch_all(service_key, only_open=not args.all, max_pages=1 if args.dry_run else None)
    rows = [r for r in (normalize(i) for i in items) if r]
    # 같은 공고가 여러 페이지에 걸쳐 중복될 수 있으니 id 기준으로 정리
    rows = list({r["id"]: r for r in rows}.values())
    print(f"수신 {len(items)}건 → 변환 {len(rows)}건")

    if args.dry_run:
        if items:
            print("\n[원본 1건]")
            print(json.dumps(items[0], ensure_ascii=False, indent=2))
            print("\n[변환 결과 1건]")
            print(json.dumps(rows[0] if rows else None, ensure_ascii=False, indent=2))
        return

    from supabase_client import get_supabase

    sb = get_supabase()
    for i in range(0, len(rows), 500):
        sb.table("programs").upsert(rows[i : i + 500], on_conflict="id").execute()
    print(f"programs 테이블에 {len(rows)}건 upsert 완료")


if __name__ == "__main__":
    main()
