---
name: btc-dashboard-feature
description: "btctiming.co.kr 대시보드에 카드/canvas 차트/테이블/히트맵을 추가·수정하는 모든 작업의 절차서. snapshot.json 데이터 바인딩, 인라인 JS 컨벤션, 디자인 토큰, 모바일 반응형 규칙 포함. BACKLOG B-XX 구현, '대시보드에 ~ 추가', '차트 만들어줘', '지표 카드 수정', 기존 카드 개선·보완·재작업 요청 시 반드시 이 스킬을 사용할 것."
---

# BTC Dashboard Feature — 대시보드 기능 구현 절차

`index.html` 하나에 마크업·스타일·JS가 모두 들어있는 의존성 없는 정적 대시보드다. 이 구조를 깨지 않는 것이 최우선 원칙이다 — 빌드 도구나 외부 차트 라이브러리를 도입하면 cron 자동 배포 파이프라인과 페이지 로딩 성능이 깨진다.

## 작업 절차

### 1. 데이터 확인 (구현 전 필수)

```bash
python3 .claude/skills/btc-dashboard-feature/scripts/dump_schema.py            # 전체 키 + hasData 상태
python3 .claude/skills/btc-dashboard-feature/scripts/dump_schema.py <키이름>   # 하위 구조 상세
```

키 이름과 shape을 추측하지 말고 반드시 실제 출력으로 확인한다. snapshot은 백엔드 API 응답을 그대로 저장한 것이라 null 필드·빈 배열·`hasData:false`가 흔하다.

### 2. 마크업 — 기존 카드 패턴 복제

새 카드는 기존 카드의 구조를 복제해 시작한다. 표준 골격:

```html
<section class="block reveal">
  <div class="sec-h"><h2><span class="ic">📊</span> 섹션 제목</h2><span class="hint">설명</span></div>
  <div class="card chart-card">
    <div class="ch-top">
      <div><div class="ch-title">카드 제목</div><div class="ch-sub">부제</div></div>
      <div class="ch-val"><div class="n" id="myValue">--</div></div>
    </div>
    <canvas class="chart" id="myChart"></canvas>
  </div>
</section>
```

- 스크롤 등장 애니메이션은 `reveal` 클래스만 붙이면 된다 (`btc-reveal.js`가 처리, 지연은 `d1`~`d4`)
- 색상·폰트는 반드시 CSS 변수 사용: `var(--brand)` `var(--neon)` `var(--red)` `var(--amber)` `var(--muted)` `var(--mono)` 등. 하드코딩 hex는 점수 색상 함수(`colorFor`, `signalMeta`) 안에만 존재한다
- 페이지 전용 스타일은 `<head>`의 인라인 `<style>` 블록에 추가 (btc-base.css는 페이지 공통만)

### 3. JS — 인라인 IIFE 내부에 작성

모든 로직은 `index.html` 하단 `<script>`의 IIFE 안에 있다. 기존 헬퍼를 재사용한다:

| 헬퍼 | 용도 |
|------|------|
| `ge(id)` | getElementById 단축 |
| `fN(v, d)` | null 안전 숫자 포맷 (ko-KR 로케일, 실패 시 `'--'`) |
| `mk(tag, cls, html)` | 엘리먼트 생성 |
| `lineChart(id, data, color, opts)` | canvas 라인 차트 (그라데이션·glow·마지막 점 도트 포함) |
| `diverge(container, rows, maxv, posC, negC)` | 중앙 기준 양방향 바 |
| `colorFor(s)` / `signalMeta(score)` | 점수 → 색상/라벨 |
| `animateGauge` / `animateBars` | 게이지·바 채움 애니메이션 |

새 차트 유형이 필요하면 `lineChart`를 참고해 같은 스타일(dpr 스케일링, `rgba(255,255,255,.05)` 그리드, 색상+`'44'` 그라데이션)로 작성한다.

데이터 접근 패턴 — `init()` 안에서:

```javascript
var bt=d.api_dashboard_buy_timing||{};
if(bt.hasData&&bt.dcaZones&&bt.dcaZones.length){ /* 렌더 */ }
// 데이터 없으면 해당 영역에 '--' 또는 카드 자체를 숨김
```

모든 바인딩에 null 가드가 필요한 이유: snapshot 갱신은 cron이 백엔드 상태와 무관하게 돌므로, 어떤 키든 언제든 `hasData:false`로 내려올 수 있다. 가드가 없으면 카드 하나의 에러가 `init()` 전체를 죽여 페이지가 빈 화면이 된다.

### 4. 모바일 반응형

기존 브레이크포인트를 따른다: `900px`(3→2열), `820px`(2→1열), `560px`(1열). 새 그리드를 만들면 같은 지점에서 미디어쿼리를 추가한다. 테이블은 좁은 화면에서 가로 스크롤 컨테이너로 감싼다. blur/backdrop-filter는 모바일에서 비용이 크므로 768px 이하에서 제거하는 기존 패턴을 유지한다.

### 5. 완료 기준

- [ ] `dump_schema.py` 출력에 존재하는 키만 참조
- [ ] `hasData` 가드 + `--` 폴백 처리
- [ ] 모바일 브레이크포인트 처리
- [ ] `python3 .claude/skills/btc-data-qa/scripts/check_bindings.py` 통과
- [ ] 변경 요약을 `_workspace/{NN}_developer_changes.md`에 기록 (사용 키, 새 DOM id)
- [ ] 커밋 메시지: `feat(static): B-XX 제목` (BACKLOG 항목) 또는 `feat(static): 제목`

## 주의사항

- `data/snapshot.json`을 직접 수정하지 않는다 — cron이 20분마다 덮어쓴다. 테스트 데이터가 필요하면 별도 사본으로 실험한다
- push 전 `git pull --rebase` — cron의 `chore: refresh snapshot` 커밋과 충돌할 수 있다
- AdSense 스크립트·ads.txt를 건드리지 않는다
- 미사용 키(check_bindings.py의 UNUSED 목록)는 신규 기능 후보다 — 새 기능 요청이 모호하면 이 목록에서 제안한다
