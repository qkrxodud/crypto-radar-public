#!/usr/bin/env python3
"""data/snapshot.json의 키 구조를 트리로 출력한다.

새 카드/차트를 만들기 전에 어떤 데이터가 있는지 파악하는 용도.
사용법:
  python3 dump_schema.py                 # 전체 톱레벨 키 + hasData 상태
  python3 dump_schema.py api_dashboard_buy_timing   # 특정 키의 하위 구조 상세
"""
import json, sys, os

# 저장소 루트 기준 snapshot 경로 탐색 (스크립트 위치와 무관하게 동작)
def find_snapshot():
    d = os.path.abspath(os.getcwd())
    while d != "/":
        p = os.path.join(d, "data", "snapshot.json")
        if os.path.exists(p):
            return p
        d = os.path.dirname(d)
    sys.exit("[ERROR] data/snapshot.json not found. Run inside the repo.")

def describe(v, depth=0, max_depth=3):
    pad = "  " * depth
    if isinstance(v, dict):
        out = []
        for k, vv in v.items():
            out.append(f"{pad}{k}: {type_label(vv)}")
            if depth < max_depth and isinstance(vv, (dict, list)):
                out.append(describe(vv, depth + 1, max_depth))
        return "\n".join(x for x in out if x)
    if isinstance(v, list) and v:
        head = v[0]
        out = [f"{pad}[0..{len(v)-1}] 항목 예시:"]
        if isinstance(head, dict):
            for k, vv in head.items():
                out.append(f"{pad}  {k}: {type_label(vv)} (예: {trunc(vv)})")
        else:
            out.append(f"{pad}  {type_label(head)} (예: {trunc(head)})")
        return "\n".join(out)
    return ""

def type_label(v):
    if isinstance(v, dict):  return f"object({len(v)} keys)"
    if isinstance(v, list):  return f"array[{len(v)}]"
    if isinstance(v, bool):  return "bool"
    if isinstance(v, (int, float)): return "number"
    if v is None: return "null"
    return "string"

def trunc(v, n=40):
    s = json.dumps(v, ensure_ascii=False)
    return s if len(s) <= n else s[:n] + "…"

snap = json.load(open(find_snapshot(), encoding="utf-8"))
data = snap.get("data", {})
print(f"updatedAt: {snap.get('updatedAt')}\n")

if len(sys.argv) > 1:
    key = sys.argv[1]
    if key not in data:
        sys.exit(f"[ERROR] key '{key}' not in snapshot. Available: {', '.join(data.keys())}")
    print(f"## {key}")
    print(describe(data[key]))
else:
    for k, v in data.items():
        has = v.get("hasData", "?") if isinstance(v, dict) else "?"
        nkeys = len(v) if isinstance(v, dict) else "-"
        print(f"{'OK' if has is True else 'NG'}  {k}  ({nkeys} keys)")
    print("\nDetail: python3 dump_schema.py <key>")
