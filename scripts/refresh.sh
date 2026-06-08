#!/usr/bin/env bash
# 하루 1회 invest-view API를 호출해 data/snapshot.json을 갱신하고 GitHub에 푸시한다.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
API_URL="http://localhost:8080/api/public/snapshot"
OUT="$REPO_DIR/data/snapshot.json"

echo "[refresh] Fetching $API_URL ..."
curl -sf --max-time 30 "$API_URL" -o "$OUT"
echo "[refresh] Saved to $OUT"

cd "$REPO_DIR"
git add data/snapshot.json
if git diff --staged --quiet; then
  echo "[refresh] No changes, skipping commit."
  exit 0
fi

git commit -m "chore: refresh snapshot $(date -u +%Y-%m-%dT%H:%M:%SZ)"
git push origin main
echo "[refresh] Done."
