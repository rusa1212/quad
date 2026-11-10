"""온통청년 청년정책 수집기 (공공데이터포털 15143273 / youthcenter.go.kr, work.md 4.1).

엔드포인트: https://www.youthcenter.go.kr/go/ythip/getPlcy
인증키:    back/.env 의 YOUTH_CENTER_API_KEY

실행 (back 폴더에서):
  venv/Scripts/python -m collectors.youthcenter --dry-run   # API 응답만 확인, DB 저장 안 함
  venv/Scripts/python -m collectors.youthcenter             # 신청 가능한 정책을 programs 테이블에 upsert
  venv/Scripts/python -m collectors.youthcenter --all       # 마감 정책까지 전부
"""
import argparse
import json
import os
import sys
from datetime import date, datetime, timezone

import httpx
from dotenv import load_dotenv

from collectors.kstartup import parse_date

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

BASE_URL = "https://www.youthcenter.go.kr/go/ythip/getPlcy"
DETAIL_URL = "https://www.youthcenter.go.kr/youthPolicy/ythPlcyTotalSearch/ythPlcyDetail/{}"
PER_PAGE = 500

# 신청기간 구분 코드 (aplyPrdSeCd)
APLY_PERIOD_FIXED = "0057001"  # 특정기간
APLY_PERIOD_ALWAYS = "0057002"  # 상시
APLY_PERIOD_CLOSED = "0057003"  # 마감

# zipCd(시군구 코드) 앞 2자리 → 프론트 REGIONS 값
SIDO_BY_PREFIX = {
    "11": "서울", "26": "부산", "27": "대구", "28": "인천", "29": "광주",
    "30": "대전", "31": "울산", "36": "세종", "41": "경기", "42": "강원",
    "43": "충북", "44": "충남", "45": "전북", "46": "전남", "47": "경북",
    "48": "경남", "50": "제주", "51": "강원", "52": "전북",
    "12": "광주·전남",  # 2026 전남광주통합특별시
}
NATIONWIDE_MIN_SIDO = 15  # 이 이상 시도에 걸치면 전국 대상으로 봄


def fetch_page(client: httpx.Client, api_key: str, page: int) -> dict:
    params = {"apiKeyNm": api_key, "pageNum": page, "pageSize": PER_PAGE, "rtnType": "json"}
    res = client.get(BASE_URL, params=params, timeout=60)
    if res.status_code != 200:
        raise RuntimeError(f"HTTP {res.status_code}: {res.text[:500]}")
    try:
        body = res.json()
    except ValueError:
        raise RuntimeError(f"JSON이 아닌 응답: {res.text[:500]}") from None
    if body.get("resultCode") != 200:
        raise RuntimeError(f"API 오류 {body.get('resultCode')}: {body.get('resultMessage')}")
    return body.get("result") or {}


def fetch_all(api_key: str, max_pages: int | None = None) -> list[dict]:
    items: list[dict] = []
    with httpx.Client() as client:
        page = 1
        while True:
            result = fetch_page(client, api_key, page)
            data = result.get("youthPolicyList") or []
            items.extend(data)
            total = (result.get("pagging") or {}).get("totCount") or 0
            print(f"  page {page}: {len(data)}건 (누적 {len(items)} / {total})")
            if not data or len(items) >= total or (max_pages and page >= max_pages):
                break
            page += 1
    return items


def parse_apply_period(item: dict) -> tuple[str | None, str | None]:
    """aplyYmd '20261101 ~ 20261115' → ('2026-11-01', '2026-11-15'). 상시는 (None, None)."""
    if item.get("aplyPrdSeCd") == APLY_PERIOD_ALWAYS:
        return None, None
    raw = item.get("aplyYmd") or ""
    # 기간이 여러 개 들어오는 경우가 있어 첫 시작일 ~ 마지막 종료일로 합침
    parts = [p.strip() for chunk in raw.split("\\N") for p in chunk.split("~")]
    dates = [d for d in (parse_date(p) for p in parts) if d]
    if not dates:
        return None, None
    return min(dates), max(dates)


def parse_region(zip_codes: str | None) -> str | None:
    sidos: list[str] = []
    for code in (zip_codes or "").split(","):
        name = SIDO_BY_PREFIX.get(code.strip()[:2])
        if name:
            for n in name.split("·"):
                if n not in sidos:
                    sidos.append(n)
    if not sidos:
        return None
    if len(sidos) >= NATIONWIDE_MIN_SIDO:
        return "전국"
    return "·".join(sidos)


def parse_type(item: dict) -> str:
    large = item.get("lclsfNm") or ""
    middle = item.get("mclsfNm") or ""
    if "창업" in middle:
        return "STARTUP"
    if "교육" in large:
        return "EDUCATION"
    return "POLICY"


def is_open(item: dict, apply_end: str | None, today: str) -> bool:
    if item.get("aplyPrdSeCd") == APLY_PERIOD_CLOSED:
        return False
    return apply_end is None or apply_end >= today


def normalize(item: dict) -> dict | None:
    """온통청년 응답 1건 → programs 행 (work.md 7.1).

    eligibility / summary_card 는 LLM 단계에서 채우므로 여기서 넣지 않음 (upsert 시 기존 값 보존).
    """
    source_id = item.get("plcyNo")
    title = item.get("plcyNm")
    if not source_id or not title:
        return None
    apply_start, apply_end = parse_apply_period(item)

    target_parts = []
    min_age, max_age = item.get("sprtTrgtMinAge"), item.get("sprtTrgtMaxAge")
    if item.get("sprtTrgtAgeLmtYn") != "Y" and (min_age not in (None, "", "0") or max_age not in (None, "", "0")):
        target_parts.append(f"연령: 만 {min_age or ''}세 ~ {max_age or ''}세")
    for key in ("addAplyQlfcCndCn", "ptcpPrpTrgtCn"):
        value = (item.get(key) or "").strip()
        if value:
            target_parts.append(("[참여 제한] " if key == "ptcpPrpTrgtCn" else "") + value)

    summary_parts = [(item.get(k) or "").strip() for k in ("plcyExplnCn", "plcySprtCn")]

    return {
        "id": f"YOUTH_CENTER-{source_id}",
        "source": "YOUTH_CENTER",
        "source_id": str(source_id),
        "title": title.strip(),
        "type": parse_type(item),
        "summary": "\n\n".join(p for p in summary_parts if p) or None,
        "host_org": item.get("sprvsnInstCdNm") or item.get("operInstCdNm") or item.get("rgtrInstCdNm"),
        "target_text": "\n".join(target_parts) or None,
        "region": parse_region(item.get("zipCd")),
        "apply_start": apply_start,
        "apply_end": apply_end,
        "url": DETAIL_URL.format(source_id),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="1페이지만 받아 원본/변환 결과 출력, DB 저장 안 함")
    parser.add_argument("--all", action="store_true", help="마감된 정책까지 수집")
    args = parser.parse_args()

    api_key = os.getenv("YOUTH_CENTER_API_KEY")
    if not api_key:
        sys.exit("YOUTH_CENTER_API_KEY 가 없습니다. 로컬은 back/.env, GitHub Actions 는 저장소 Secrets 에 설정하세요.")

    print("온통청년 청년정책 수집 시작")
    items = fetch_all(api_key, max_pages=1 if args.dry_run else None)
    today = date.today().isoformat()
    rows = []
    for item in items:
        row = normalize(item)
        if row and (args.all or is_open(item, row["apply_end"], today)):
            rows.append(row)
    rows = list({r["id"]: r for r in rows}.values())
    print(f"수신 {len(items)}건 → 저장 대상 {len(rows)}건" + ("" if args.all else " (마감 제외)"))

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
