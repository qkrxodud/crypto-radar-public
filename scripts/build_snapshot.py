#!/usr/bin/env python3
"""invest-view 대시보드 API 전체를 수집해 data/snapshot.json을 생성한다."""
import json, sys, urllib.request
from datetime import datetime, timezone

BASE = "http://localhost:8080"
OUT  = sys.argv[1] if len(sys.argv) > 1 else "data/snapshot.json"

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
    "/api/dashboard/illiquid-supply",
    "/api/dashboard/liquidation-heatmap",
    "/api/dashboard/rolling-correlation",
    "/api/dashboard/options-regime",
    "/api/dashboard/system",
    "/api/prism/indices",
    "/api/ai/digest",
    "/api/ai/digest?lang=en",
    "/api/ai/news-sentiment",
    "/api/analysis/score-history",   # 종합점수·BTC 180일 시계열 (대형 오버레이 차트용)
    "/api/report/signal-accuracy",   # 매수 신호 사후 적중률·base rate·lift (신호 검증 패널용)
    "/api/analysis/scores",          # 복합 분석 점수 38종 (한글/영문 표시명 포함 — 전문가 분석 패널용)
    "/api/expert/rainbow-chart",     # 레인보우 차트 존 (로그회귀 적정가 대비 괴리)
    "/api/analysis/mayer-multiple",  # Mayer Multiple 현재값 + 90일 시계열
    "/api/expert/sth-cost-basis",    # 단기 보유자(STH) 원가선 프리미엄
    "/api/analysis/season-scores",   # BTC/알트/대형알트 시즌 점수 + 전략
    "/api/expert/dry-powder",        # 스테이블 대기 자금 게이지
    "/api/expert/crowd-extreme",     # 군중 극단(역발상) 지수
    "/api/analysis/exchange-flow",   # 거래소 순유입/유출 90일 (온체인 자금 흐름 바 차트용)
]

# 쿼리스트링이 붙어 자동 키 생성이 불가한 엔드포인트는 명시적으로 키를 지정한다.
KEY_OVERRIDES = {
    "/api/ai/digest?lang=en": "api_ai_digest_en",  # AI 다이제스트 영어판
}

def get(path):
    try:
        with urllib.request.urlopen(BASE + path, timeout=30) as r:
            return json.loads(r.read())
    except Exception as e:
        print(f"  [WARN] {path}: {e}")
        return {"hasData": False, "errorMessage": str(e)}

print("[build_snapshot] Fetching all endpoints...")
data = {}
for ep in ENDPOINTS:
    key = KEY_OVERRIDES.get(ep) or ep.lstrip("/").replace("/", "_").replace("-", "_").replace("?days=90","")
    data[key] = get(ep)
    print(f"  {'OK' if data[key].get('hasData') else 'NG'}  {ep}")

snapshot = {"hasData": True, "updatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "data": data}
with open(OUT, "w", encoding="utf-8") as f:
    json.dump(snapshot, f, ensure_ascii=False, indent=2)

m = data.get("api_dashboard", {})
print(f"\n[build_snapshot] → {OUT}")
print(f"  date={m.get('dataDate')}  score={m.get('score')}  signal={m.get('signalDisplay')}")
