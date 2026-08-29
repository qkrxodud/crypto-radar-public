# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> 주의: 상위 디렉터리(`~/Downloads/CLAUDE.md`)의 Spring Boot/TDD 가이드는 이 저장소와 무관하다. 이 저장소는 빌드 도구·테스트·프레임워크가 전혀 없는 순수 정적 사이트다.

## 프로젝트 개요

**BTC 타이밍 레이더** — 비트코인 매수 타이밍 지표 대시보드. GitHub Pages로 배포되는 한국어 정적 사이트 (커스텀 도메인: `btctiming.co.kr`, CNAME 파일). `main` 브랜치에 push하면 곧바로 배포된다.

## 아키텍처

핵심 구조: **로컬 백엔드 → 스냅샷 JSON → 정적 페이지** 단방향 파이프라인.

1. `scripts/build_snapshot.py` — 로컬에서 실행 중인 invest-view Spring Boot 앱(`http://localhost:8080`)의 대시보드 API 27개를 호출해 `data/snapshot.json` 하나로 합친다. 키 변환 규칙: `/api/dashboard/buy-timing` → `api_dashboard_buy_timing` (슬래시·하이픈 → 언더스코어).
2. `scripts/refresh.sh` — 위 스크립트 실행 후 변경이 있으면 `chore: refresh snapshot <UTC시각>` 커밋을 만들어 `origin main`에 push한다. **cron이 20분마다 자동 실행 중** (`crontab -l` 확인 가능, 로그: `logs/refresh.log`). 작업 중 스냅샷 갱신 커밋이 끼어들 수 있으니 push 전 rebase가 필요할 수 있다.
3. 페이지(`index.html` 등)는 `./data/snapshot.json`만 fetch한다. 실시간 API 호출 없음 — 항상 마지막 수집값 표시.

### 프런트엔드

- 프레임워크·번들러 없음. 메인 대시보드 로직은 전부 `index.html` 하단 `<script>` 인라인 (IIFE, vanilla JS). 차트는 라이브러리 없이 canvas 직접 그리기 (`lineChart`, `diverge` 등 헬퍼).
- 공유 자산: `btc-base.css` (디자인 토큰·공통 컴포넌트), `btc-reveal.js` (스크롤 리빌).
- 페이지: `index.html`(대시보드), `about.html`, `guide.html`(지표 가이드), `contact.html`, `disclaimer.html`, `privacy.html`. 새 페이지 추가 시 `sitemap.xml` 갱신.
- `btctiming/` 디렉터리는 gitignore된 로컬 원본/스크린샷 보관소 — 배포 대상 아님, 수정하지 말 것.

## 자주 쓰는 명령

```bash
# 스냅샷 수동 갱신 (invest-view가 localhost:8080에 떠 있어야 함)
python3 scripts/build_snapshot.py data/snapshot.json

# 스냅샷 갱신 + 커밋 + push 한 번에
bash scripts/refresh.sh

# 로컬 미리보기 (file://로는 snapshot.json fetch가 막히므로 서버 필요)
python3 -m http.server 8000   # → http://localhost:8000
```

## 컨벤션

- 기능 작업은 `BACKLOG.md` 기준으로 진행. 커밋 메시지: `feat(static): B-XX 제목`, 스냅샷 갱신은 `chore: refresh snapshot ...`.
- 데이터는 항상 `data/snapshot.json`의 키를 그대로 참조 (`api_dashboard_buy_timing.dcaZones` 등). 데이터가 없을 수 있으므로 `hasData` 체크와 `--` 폴백 표시를 유지한다.
- 코드 주석은 한글로 작성.
- UI 텍스트는 한국어, 숫자 포맷은 `toLocaleString('ko-KR')`.
- AdSense가 붙어 있다 (`ads.txt`, 페이지 내 광고 스크립트) — 광고 관련 태그를 임의로 제거하지 말 것.

## 하네스: BTC 타이밍 레이더

**목표:** 대시보드 기능 구현·콘텐츠/SEO·QA 검증을 에이전트 팀(생성-검증 패턴)으로 수행한다.

**트리거:** 이 사이트의 실질적 변경 작업(기능 추가/수정, BACKLOG 구현, 페이지/콘텐츠 작업, 배포 전 점검, 이전 결과 수정·보완·재실행) 요청 시 `btc-radar-orchestrator` 스킬을 사용하라. 단순 질문·코드 설명은 직접 응답 가능.

**변경 이력:**
| 날짜 | 변경 내용 | 대상 | 사유 |
|------|----------|------|------|
| 2026-06-10 | 초기 구성 (에이전트 3 + 스킬 4) | 전체 | - |
| 2026-06-11 | 실행 모드를 서브 에이전트(생성-검증)로 전환, 환경 제약 6항 명문화 | skills/btc-radar-orchestrator | 실행 테스트: 팀 도구(TeamCreate/SendMessage) 부재, 커스텀 타입 미등록, 에이전트 샌드박스 제한 확인 |
| 2026-06-11 | 단위·스케일 의미 검증 절차 추가, 리더 보완 검증 명시 | skills/btc-data-qa | 실행 테스트: 100배 단위 결함이 shape 검증을 통과하고 실렌더링 검증에서만 발견됨 |
| 2026-06-11 | defer 캡처 레이스 검증 절차 추가 | skills/btc-data-qa | i18n QA: 인라인 스크립트가 defer API를 파싱 시점 캡처해 ko 폴백 고정되는 결함 발견·수정 |
| 2026-06-23 | 리디자인 무손실(콘텐츠 패리티) 원칙·인벤토리·게이트 추가 | skills/btc-radar-orchestrator, skills/btc-data-qa | V2 리디자인 중 guide-v2가 indicators/ 상세페이지 22개 링크를 통째로 누락 → "디자인만 바꾸고 기존 노출 데이터·링크·콘텐츠는 전부 보존" 강제. Phase 1 패리티 인벤토리 + Phase 3 무손실 게이트(링크 N=N 대조) 도입 |
| 2026-06-24 | 패리티 게이트에 **데이터 키 집합 대조** 추가(기계적) | skills/btc-radar-orchestrator, skills/btc-data-qa | 링크 패리티는 통과했으나 index-v2가 시장 뉴스 목록·과거 성과 통계·F&G 레짐·DCA 백테스트(api_ai_news_sentiment.items, api_dashboard_performance/buy_timing)를 누락 → `comm -23` snapshot 키 집합 diff를 필수화. 데이터 페이지는 키 누락 0 아니면 PASS 금지 |
