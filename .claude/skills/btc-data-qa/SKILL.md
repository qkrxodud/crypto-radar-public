---
name: btc-data-qa
description: "btctiming.co.kr 변경사항의 QA 검증 절차서. snapshot.json 키-코드 경계면 교차 검증, 로컬 서버 + Playwright 렌더링/모바일 확인, 링크·콘솔 에러 검사. '검증해줘', 'QA', '제대로 되는지 확인', '모바일 확인', '배포 전 점검', 기능 구현·페이지 수정 완료 직후에 반드시 이 스킬을 사용할 것."
---

# BTC Data QA — 데이터 정합성 · 렌더링 검증 절차

이 사이트의 버그는 코드 단독으로는 보이지 않고 **경계면**에서 드러난다: JS가 참조하는 snapshot 키가 실제 데이터에 없거나 shape이 다를 때, 데스크톱에서 멀쩡한 레이아웃이 모바일에서 깨질 때. 따라서 QA는 정적 검사 + 실제 렌더링 두 축으로 수행한다.

## 검증 절차

### 1. 정적 검사 — 키 바인딩 교차 검증

```bash
python3 .claude/skills/btc-data-qa/scripts/check_bindings.py
```

- **MISSING**: 코드가 참조하지만 snapshot에 없는 키 → 즉시 FAIL, 작성자에게 반려
- **NO-DATA**: `hasData:false`인 키 → 코드에 폴백 가드가 있는지 해당 참조 지점을 직접 읽어 확인
- **UNUSED**: 미사용 키 → 결함 아님, 리포트에 참고로만 기재

스크립트는 톱레벨 키만 검사하므로, 변경 요약에 명시된 **하위 키 경로**(예: `bt.dcaZones[].pct`)는 수동으로 교차 확인한다:

```bash
python3 .claude/skills/btc-dashboard-feature/scripts/dump_schema.py <톱레벨키>
```

코드가 기대하는 필드명·타입과 실제 shape을 나란히 비교한다. "키가 존재한다"가 아니라 "코드가 읽는 그대로 생겼다"를 확인하는 것이 핵심이다.

**단위·스케일 의미 검증** — shape이 맞아도 단위가 틀리면 잘못된 수치가 그대로 표시된다 (실측 사례: 비율값 "-0.0602"를 퍼센트로 표시해 100배 축소). 같은 의미의 값이 복수 필드에 존재하면 반드시 상호 대조한다:
- 요약 필드 vs 시계열 최신값 (예: `ethBtcPerformance` vs `ethBtcHistory[마지막].value`) — 두 값이 ~100배 차이면 비율/퍼센트 혼용을 의심
- 표시값 vs snapshot 원본값 — 렌더된 숫자가 원본과 자릿수가 다르면 변환 로직을 추적
- 비교 대상이 없는 단독 값은 자릿수의 상식성(도미넌스 0.56% vs 56%)으로 판단

**defer 캡처 레이스 검증** — `defer` 스크립트가 제공하는 API(예: `window.BTCI18N`)를 인라인 스크립트가 **파싱 시점에 캡처**하면, defer 실행 전이라 폴백 값이 영구 고정된다 (실측 사례: 타이핑 헤드라인이 en/zh 모드에서 한국어로 고정). 인라인 스크립트가 defer API를 쓰는 곳을 찾아 ① 호출 시점마다 window에서 읽는 접근자 패턴인지 ② 또는 DOMContentLoaded 이후에 시작하는지 확인하라. 둘 다 아니면 결함이다. 이런 레이스는 정적 검사로 코드를 읽어야 보이고, 실브라우저에서는 동적 텍스트(애니메이션·지연 렌더)를 수 초 기다린 뒤 확인해야 잡힌다.

### 2. 렌더링 검사 — 실제 브라우저

`file://`로는 snapshot fetch가 CORS로 막히므로 로컬 서버가 필수다:

```bash
python3 -m http.server 8765 &   # 백그라운드 실행, 끝나면 kill
```

Playwright MCP 도구로 확인 (도구가 없으면 ToolSearch로 `playwright` 검색 후 로드):

1. `browser_navigate` → `http://localhost:8765/` (또는 변경된 페이지)
2. `browser_console_messages` — JS 에러 0건 확인. `init()`은 단일 함수라 에러 하나가 전체 렌더를 죽인다
3. `browser_snapshot` — 변경된 카드/섹션이 실제 값(`--`가 아닌)으로 렌더됐는지 확인
4. `browser_resize`(390×844) → 모바일 뷰포트에서 변경 영역 재확인 — 가로 스크롤 발생, 겹침, 잘림 여부
5. `browser_take_screenshot` — 데스크톱/모바일 각 1장을 `_workspace/`에 저장 (증거)

### 3. 무결성 검사 (페이지 추가·링크 변경 시)

- 변경 페이지의 내부 링크가 모두 실존 파일을 가리키는지
- 새 페이지가 `sitemap.xml`에 등록됐는지
- nav `active` 클래스가 올바른 페이지에 있는지

### 3.5 리디자인 패리티 검사 (기존 페이지 교체·재디자인 시) — **무손실 게이트**

> 재디자인은 디자인만 바꾼다. 기존에 노출되던 모든 것이 V2에도 있어야 한다. 이 검사를 통과 못 하면 PASS 금지.

원본(예: `guide.html`)과 V2(예: `guide-v2.html`)를 **항목별로 1:1 대조**한다. Phase 1의 `{page}_parity.md`가 있으면 그것을 체크리스트로 사용:

1. **내부 링크 개수·대상 일치** (가장 흔한 누락 지점):
   ```bash
   # 원본과 V2의 내부 링크 집합 비교 — 원본에만 있는 링크 = 누락(결함)
   diff <(grep -oE 'href="[^"]+"' 원본.html | sort -u) <(grep -oE 'href="[^"]+"' V2.html | sort -u)
   # 하위 상세페이지(indicators/ 등) 링크 개수는 특히 명시적으로 셈
   grep -oc 'indicators/' 원본.html ; grep -oc 'indicators/' V2.html
   ```
   원본 N개 → V2 N개 미만이면 **[HIGH] 누락 결함**.
2. **콘텐츠 섹션 대조**: 원본의 h1~h3 제목·카드·표·FAQ·면책·CTA가 V2에 모두 존재하는지. 텍스트 단위로 누락 0.
3. **노출 데이터 대조**: 원본이 보여주던 snapshot 값·수치·폼 필드/동작이 V2에도 전부 있는지(값이 `--` 폴백이라도 자리는 있어야).
   - **(필수·기계적) 데이터 키 패리티** — 대시보드/데이터 페이지 리디자인은 이 검사를 통과 못 하면 절대 PASS 금지. 원본이 참조하는 snapshot 키 집합이 V2에 전부 있어야 한다:
     ```bash
     comm -23 <(grep -oE 'api_[a-z_]+' 원본.html | sort -u) <(grep -oE 'api_[a-z_]+' V2.html | sort -u)
     # 출력(=원본에만 있는 키)이 한 줄이라도 있으면 데이터 누락. 각 키가 무슨 섹션/카드인지 원본에서 확인해 [HIGH] 누락으로 보고.
     ```
   - **데이터 컨테이너(DOM id)·섹션 헤딩 대조**: 원본의 `id="..."`(값 바인딩 대상)과 `<h2>/<h3>` 목록을 V2와 diff. 원본에만 있는 카드(예: 뉴스 목록 `newsSentItems`, 성과 히트맵, 레짐, DCA 백테스트)는 누락 결함.
   - 키가 V2에 다른 형태로 흡수됐다면(예: 개별 technical/onchain 값이 `api_dashboard_system.indicatorRows` 표에 통합) "흡수 위치"를 리포트에 명시. 단순히 "디자인에 없어서 뺐다"는 불가.
   - **(필수) 배열·섹션 렌더 개수 패리티** — 키가 참조돼도 데이터를 일부만 그리면 누락이다. 원본이 리스트/섹션의 N개를 모두 렌더하면 V2도 N개를 렌더해야 한다. `sections[0]`만, `items` 생략, `slice(0,1)` 같은 축소가 흔한 함정. 예: `api_ai_digest.sections`(요약+위험+권고 전체), `api_ai_news_sentiment.items`(뉴스 목록 전체), `dcaZones`/`dayOfWeekStats` 등. 원본 렌더 개수와 V2 렌더 개수를 실제 비교(브라우저 DOM)해 일치 확인.
4. **SEO 자산 대조**: title/description/canonical/og/twitter/JSON-LD가 보존됐는지(언어 정책 변경으로 data-en/zh를 뺀 경우는 의도된 변경 — 본문 텍스트·구조화데이터 자체는 유지).
5. **하위 페이지 일괄 변환 시**: 변환 대상 파일 개수 = 원본 개수인지 확인(예: `indicators/*.html` 22개 → V2 22개). 한 개라도 누락/미변환이면 결함.

발견된 누락은 전부 결함 리포트에 `[HIGH] 누락: {항목}`으로 적고 반려한다.

## 리포트 형식

`_workspace/{NN}_qa_report.md`:

```markdown
# QA Report — {대상 작업}
## 검사 결과
| 항목 | 결과 |
|------|------|
| 키 바인딩 (check_bindings) | PASS/FAIL |
| 하위 키 shape 교차 확인 | PASS/FAIL |
| 콘솔 에러 | PASS/FAIL |
| 데스크톱 렌더링 | PASS/FAIL |
| 모바일 렌더링 (390px) | PASS/FAIL |
| 링크/sitemap | PASS/FAIL/N/A |
| 리디자인 패리티 (원본 대비 무손실: 링크 N=N·섹션·데이터·SEO) | PASS/FAIL/N/A |

## 결함
[HIGH] index.html:712 — bt.dcaZone 참조 / 실제 키는 dcaZones / 증거: check_bindings 출력
...
## 증거
- _workspace/03_qa_desktop.png, 03_qa_mobile.png
```

심각도: **HIGH**(렌더 실패·빈 화면·잘못된 수치) / **MED**(폴백 미동작·모바일 깨짐) / **LOW**(스타일 불일치·콘솔 경고).

## 원칙

- 결함을 발견해도 직접 수정하지 않는다 — 작성자에게 리포트로 반려한다. 검증자가 수정하면 다음 검증의 독립성이 사라진다
- 부분 검증만 가능한 상황(샌드박스에서 python3/Playwright 권한 거부, 서버 실행 불가 등)이면 리포트에 미검증 항목을 명시한다. "검사 안 함"과 "PASS"를 섞지 않는다. 미검증 항목은 리더가 직접 보완 검증한다 — 반환 메시지에 보완이 필요한 항목을 명확히 나열하라
- 회귀 확인: 이전 qa_report가 있으면 과거 FAIL 항목부터 재확인한다
