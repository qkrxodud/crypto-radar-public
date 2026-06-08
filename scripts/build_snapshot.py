#!/usr/bin/env python3
"""
invest-view 대시보드 API 전체를 호출해 data/snapshot.json을 생성한다.
"""
import json
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone

BASE    = "http://localhost:8080"
OUT     = sys.argv[1] if len(sys.argv) > 1 else "data/snapshot.json"

ENDPOINTS = [
    "/api/dashboard",
    "/api/dashboard/technical",
    "/api/dashboard/onchain",
    "/api/dashboard/macro",
    "/api/dashboard/sentiment",
    "/api/dashboard/cycle",
    "/api/dashboard/market-overview",
    "/api/dashboard/buy-timing",
    "/api/dashboard/checklist",
    "/api/dashboard/performance",
    "/api/dashboard/forecast",
    "/api/dashboard/expert-opinion",
    "/api/dashboard/whale-activity",
    "/api/dashboard/market-structure",
    "/api/dashboard/accumulation-score",
    "/api/dashboard/alt-season",
    "/api/dashboard/stablecoin-supply",
    "/api/dashboard/net-liquidity",
    "/api/dashboard/altcoin",
    "/api/prism/indices",
]


def get(path):
    try:
        with urllib.request.urlopen(BASE + path, timeout=30) as r:
            return json.loads(r.read())
    except Exception as e:
        print(f"  [WARN] {path}: {e}")
        return {"hasData": False, "errorMessage": str(e)}


print("[build_snapshot] Fetching all dashboard endpoints...")
data = {}
for ep in ENDPOINTS:
    key = ep.lstrip("/").replace("/", "_").replace("-", "_")
    data[key] = get(ep)
    score_info = ""
    if "score" in data[key]:
        score_info = f" score={data[key]['score']}"
    print(f"  {ep}{score_info}")

snapshot = {
    "hasData":   True,
    "updatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "data":      data,
}

with open(OUT, "w", encoding="utf-8") as f:
    json.dump(snapshot, f, ensure_ascii=False, indent=2)

main = data.get("api_dashboard", {})
print(f"\n[build_snapshot] saved → {OUT}")
print(f"  date={main.get('dataDate')}  score={main.get('score')}  signal={main.get('signalDisplay')}")
