#!/usr/bin/env python3
"""HTML/JS 코드가 참조하는 snapshot 키와 실제 data/snapshot.json을 교차 검증한다.

검사 항목:
  1. 코드가 참조하는 api_* 키가 snapshot에 실제로 존재하는가
  2. 참조된 키의 hasData가 false인가 (폴백 UI가 필요한 키 식별)
  3. snapshot에 있지만 어떤 페이지도 사용하지 않는 키 (기능 기회)

사용법: 저장소 루트에서  python3 check_bindings.py
종료 코드: 누락 키 참조가 있으면 1, 아니면 0
"""
import json, re, sys, os, glob

def find_root():
    d = os.path.abspath(os.getcwd())
    while d != "/":
        if os.path.exists(os.path.join(d, "data", "snapshot.json")):
            return d
        d = os.path.dirname(d)
    sys.exit("[ERROR] repo root with data/snapshot.json not found")

root = find_root()
snap = json.load(open(os.path.join(root, "data", "snapshot.json"), encoding="utf-8"))
data = snap.get("data", {})

# 배포 대상 파일만 스캔 (gitignore된 btctiming/ 등은 제외)
targets = [p for p in glob.glob(os.path.join(root, "*.html")) + glob.glob(os.path.join(root, "*.js"))]

referenced = {}  # key -> [file...]
pat = re.compile(r"\bapi_[a-z0-9_]+\b")
for path in targets:
    src = open(path, encoding="utf-8").read()
    for m in set(pat.findall(src)):
        referenced.setdefault(m, []).append(os.path.basename(path))

missing, nodata = [], []
for key, files in sorted(referenced.items()):
    if key not in data:
        missing.append((key, files))
    elif isinstance(data[key], dict) and data[key].get("hasData") is False:
        nodata.append((key, files))

unused = sorted(set(data.keys()) - set(referenced.keys()))

print(f"[check_bindings] scanned {len(targets)} files, {len(referenced)} keys referenced\n")

if missing:
    print("MISSING — referenced in code but absent from snapshot:")
    for k, f in missing:
        print(f"  {k}  ← {', '.join(f)}")
if nodata:
    print("NO-DATA — referenced but hasData=false (fallback UI must handle):")
    for k, f in nodata:
        print(f"  {k}  ← {', '.join(f)}")
if unused:
    print("UNUSED — in snapshot but not referenced by any page:")
    for k in unused:
        print(f"  {k}")

if not missing and not nodata:
    print("All referenced keys exist with hasData=true.")

sys.exit(1 if missing else 0)
