# crypto-radar-public 강화 백로그

React 대시보드(`/react/dashboard`)의 데이터를 정적 GitHub Pages 사이트에 순차적으로 반영한다.
모든 데이터는 `data/snapshot.json`에서 읽는다 (실시간 없음, 마지막 수집값 사용).

---

## 완료 기준
- `index.html` + `app.js` 수정으로 구현
- `data/snapshot.json` 키를 그대로 참조
- 커밋 메시지: `feat(static): B-XX 제목`

---

## Phase 1 — 매수 타이밍 섹션 강화

### B-01 DCA 존 시각화 (dcaZones)
- **데이터**: `api_dashboard_buy_timing.dcaZones` (배열)
- **구현**: 점수 구간별 색상 바 + 현재 점수 포인터 표시
- **위치**: 매수 타이밍 분석 카드 하단

### B-02 점수 히스토그램 (scoreHistogram)
- **데이터**: `api_dashboard_buy_timing.scoreHistogram`
- **구현**: 바 차트 — x축 점수구간, y축 발생일수
- **위치**: 매수 타이밍 분석 카드 내 새 canvas

### B-03 가격-점수 다이버전스 차트 (priceDivergence)
- **데이터**: `api_dashboard_buy_timing.priceDivergence`
- **구현**: 이중 축 라인 차트 (BTC가격 + 점수)
- **위치**: 매수 타이밍 카드 내 새 canvas

### B-04 창 비교 테이블 (windowComparison)
- **데이터**: `api_dashboard_buy_timing.windowComparison`
- **구현**: 1주/1월/3월/6월 수익률 비교 테이블
- **위치**: 매수 타이밍 카드 하단

---

## Phase 2 — 사이클 분석 섹션 (신규)

### B-05 90일 점수 + BTC 복합 차트 (score90History)
- **데이터**: `api_dashboard_cycle.score90History` (date, score, btcClose)
- **구현**: 이중 Y축 라인 차트 — 점수(왼쪽) + BTC가격(오른쪽)
- **위치**: 종합 점수 추이 카드 아래 새 카드로 추가

### B-06 반감기 사이클 히트맵 (heatmapDates/heatmapRows)
- **데이터**: `api_dashboard_cycle.heatmapDates`, `heatmapRows`
- **구현**: 주별 × 연도별 히트맵 — CSS grid, 점수별 색상
- **위치**: 사이클 분석 카드 (신규)

---

## Phase 3 — 성과 & 계절성 섹션 (신규)

### B-07 월별 평균 점수 바 차트 (monthlyData)
- **데이터**: `api_dashboard_performance.monthlyData` (month, avgScore)
- **구현**: 12개월 바 차트, 현재 월 강조
- **위치**: 성과 분석 카드 (신규)

### B-08 요일별 점수 패턴 (dayOfWeekStats)
- **데이터**: `api_dashboard_performance.dayOfWeekStats`
- **구현**: 요일별(Mon~Sun) 수평 바 차트
- **위치**: 성과 분석 카드 내

### B-09 기간별 수익률 테이블 (periodPerformance)
- **데이터**: `api_dashboard_performance.periodPerformance`
- **구현**: 1주/1월/3월/6월/1년 수익률 + 신호 조건별 비교 테이블
- **위치**: 성과 분석 카드 내

### B-10 점수 히트맵 (heatmapDays)
- **데이터**: `api_dashboard_performance.heatmapDays`
- **구현**: 날짜별 점수 히트맵 (GitHub contribution graph 스타일)
- **위치**: 성과 분석 카드 내

---

## Phase 4 — 온체인 차트 보강

### B-11 SOPR/NUPL/MVRV 히스토리 차트
- **데이터**: `api_prism_indices.entries` (sopr, nupl, mvrvZScore 필드)
- **구현**: 3개 라인 차트 (각 canvas 별도)
- **위치**: 온체인 지표 카드 하단

### B-12 LTH/STH 비율 추이
- **데이터**: `api_prism_indices.entries` (lthSthRatio 또는 별도 필드)
- **구현**: 라인 차트
- **위치**: 온체인 지표 카드

---

## Phase 5 — 전문가 지표 카드 (신규)

### B-13 레인보우 차트 카드
- **데이터**: `api_dashboard_buy_timing.dcaBacktest` 또는 prism entries
- **구현**: BTC 가격 구간별 색상 밴드 시각화
- **위치**: 전문가 분석 섹션 아래 신규 카드

### B-14 와이코프 국면 패널
- **데이터**: `api_dashboard_system.regimeMatrix` + 온체인 지표 조합
- **구현**: 축적/분산/마크업/마크다운 4단계 시각적 표시
- **위치**: 시장 구조 카드 옆

### B-15 신호 매트릭스 (Signal Matrix)
- **데이터**: `api_prism_indices.entries` 30일치 → 지표별 +/-/0 매트릭스
- **구현**: 30일 × 27지표 색상 그리드
- **위치**: 전체 지표 상세 아래 신규 카드

---

## Phase 6 — UI/UX 개선

### B-16 섹션 구분선 + 번호 헤더
- React의 `SectionHeader num="01"` 스타일 적용
- 각 주요 섹션 앞에 번호 배지 추가

### B-17 모바일 그리드 반응형 보완
- g4 → 모바일에서 g2로 fallback
- 테이블 horizontal scroll 처리

### B-18 스냅샷 갱신 시각 강조 배너
- 히어로 하단에 "마지막 갱신: X월 X일 오전 9시 5분" 배너 추가

---

## 진행 상태

| ID | 제목 | 상태 |
|----|------|------|
| B-01 | DCA 존 시각화 | 완료 |
| B-02 | 점수 히스토그램 | 완료 |
| B-03 | 가격-점수 다이버전스 차트 | 완료 |
| B-04 | 창 비교 테이블 | 완료 |
| B-05 | 90일 점수+BTC 복합 차트 | 완료 |
| B-06 | 반감기 사이클 히트맵 | 완료 |
| B-07 | 월별 평균 점수 바 차트 | 완료 |
| B-08 | 요일별 점수 패턴 | 완료 |
| B-09 | 기간별 수익률 테이블 | 완료 |
| B-10 | 점수 히트맵 | 완료 |
| B-11 | SOPR/NUPL/MVRV 히스토리 | 완료 |
| B-12 | LTH/STH 추이 | 완료 |
| B-13 | 레인보우 차트 카드 | 완료 |
| B-14 | 와이코프 국면 패널 | 완료 |
| B-15 | 신호 매트릭스 | 완료 |
| B-16 | 섹션 번호 헤더 | 완료 |
| B-17 | 모바일 반응형 | 완료 |
| B-18 | 갱신 시각 배너 | 완료 |

---

## Phase 7 — AdSense 재심사 대응 (2026-10-30 착수)

반려 사유 "가치가 별로 없는 콘텐츠". 평가자 세션 진단 순서: ① 홈이 툴로 읽힘 ② 저자·AI 고지 부재 ③ 신규 글 0건·일괄 생성 ④ 템플릿 균일.
재신청은 **수정 완료 2주 뒤**(글 10편 이상 누적 후) 권장.

### A-01 홈 편집 콘텐츠 상단 배치 (완료 2026-10-30)
- 히어로 바로 아래 `#todayNote` "오늘의 해설"(주간 리뷰 요약, 600자+) + 최신 글 3개
- 방문자 카운터 전 페이지 숨김(`.sb-visitor{display:none}`), `<footer>` 시맨틱, 홈 h1
- 지표 사전 22카드 → 이름 칩(guide.html과 설명 중복 제거, 링크 22개 유지)

### A-02 저자·AI 고지 (완료 2026-10-30)
- about.html `#operator` 운영자 섹션(필명 태영 · 백엔드 개발자 · 1인 운영 · 자격 없음 명시), 가중치 34/21/16/15/14 정합
- 지표 22편·guide: byline(발행·수정일) + JSON-LD author Person + `<meta name="author">`
- 홈 "전문가 종합 의견" → "AI 요약 · 자동 생성 · 참고용" + gpt-4o-mini 생성 고지, 뉴스 감성 AI 분류 고지, "전문가 분석 점수" → "복합 분석 점수 · 규칙 기반"

### A-03 글(posts/) 신설 (진행 중 — 3/12)
- 생성기: 세션 스크래치 `gen_posts.py` (indicators/rsi.html 셸 재사용). 새 글은 같은 셸로 작성, `posts/index.html`·`sitemap.xml`·홈 `#todayNote` 최신 글 갱신 필수.
- **게시 일정 (하루에 몰아 올리지 말 것 — 일괄 생성 패턴 재발 방지)**

| 예정일 | 제목(주제) | 데이터 소스 |
|---|---|---|
| 2026-10-30 ✅ | 주간 지표 리뷰 (10-30): 종합 62·중립 53일째·공포탐욕 51→30 | api_dashboard, timing_verdict |
| 2026-10-30 ✅ | 사이클 고점·저점 10곳 검증 — 9/10 적중과 2021-04 빗나감 | timing_verdict.landmarks |
| 2026-10-30 ✅ | 매수 기준 65 vs 그림자 70 — lift 음수일 때 | report_shadow_threshold, signal_accuracy |
| 2026-11-03 | 방법론 ① 데이터 출처와 실측 vs 프록시 — 27개 지표는 어디서 오나 | about 데이터 출처, CollectIndicatorsService |
| 2026-11-06 | 주간 지표 리뷰 (11-06) | 당일 snapshot |
| 2026-11-10 | 분배 구간을 54/49로 다시 그은 이유 — 2,061일에서 점수 53 이하의 30일 뒤 | V15-01 재보정 근거, timing_verdict.bands |
| 2026-11-13 | 주간 지표 리뷰 (11-13) | 당일 snapshot |
| 2026-11-17 | 월간 신호 성적표 읽는 법 — 2022-11 +20.5%p와 2025-03 −33.1%p | signal_accuracy.monthly |
| 2026-11-20 | 주간 지표 리뷰 (11-20) | 당일 snapshot |
| 2026-11-24 | 중립이 53일 이어진다는 것 — 라벨 전환 212회 중 39%가 2일 내 되돌아감 | timing_verdict.stability |
| 2026-11-27 | 주간 지표 리뷰 (11-27) | 당일 snapshot |
| 2026-12-01 | 2022년 6월 94점이 바닥이 아니었던 이유 — 강력 매집 구간의 90일 뒤 44% | bands UNDERVALUED, landmarks |

### A-04 지표 상세 템플릿 차별화 (진행 중)
- 각 지표 페이지에 `오늘의 값 · 종합점수 내 위치` 데이터 섹션(snapshot 렌더: 현재값·정규화 점수·가중치·7일 추이), 지표별 FAQ 수 2~5로 변화, dateModified 실갱신
