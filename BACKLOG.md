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
