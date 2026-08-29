---
name: btc-content-seo
description: "btctiming.co.kr 정적 페이지의 콘텐츠·SEO 작업 절차서. about/guide/contact/disclaimer/privacy 수정, 새 페이지 신설, 메타태그/OG/sitemap/robots 관리, 지표 설명 글 작성·수정·보완. '페이지 만들어줘', '소개 글 수정', 'SEO 개선', '메타태그', '글 다듬어줘' 요청 시 반드시 이 스킬을 사용할 것."
---

# BTC Content & SEO — 정적 페이지 콘텐츠 작업 절차

투자 정보 사이트의 콘텐츠는 두 가지 제약 아래 있다: (1) 투자 조언이 아닌 정보 제공으로 읽혀야 하고(법적 면책), (2) AdSense 정책(수익 보장·과장 금지)을 지켜야 한다. 모든 문장이 이 둘을 통과해야 하는 이유는 위반 시 광고 계정 정지와 법적 리스크가 사이트 존속을 위협하기 때문이다.

## 톤 & 문장 규칙

- 차분한 설명체. 데이터가 말하게 하고 단정하지 않는다
  - 나쁨: "지금이 매수 타이밍입니다", "반드시 오릅니다"
  - 좋음: "과거 데이터에서 이 구간은 평균적으로 ~한 경향을 보였습니다"
- 모든 분석성 페이지 하단에 면책 문구 유지 (기존 footer 패턴 참조). disclaimer.html 링크를 제거하지 않는다
- 수치를 쓰면 출처(어떤 지표·기간)를 함께 쓴다. 확인 불가한 수치는 쓰지 않는다
- 독자는 투자 입문자~중급자: 전문 용어(SOPR, MVRV 등)는 첫 등장 시 한 줄 설명을 붙인다

## 페이지 구조 컨벤션

모든 페이지는 같은 골격을 공유한다 — 기존 페이지에서 복제해 시작한다:

```
<head> 메타태그 블록 → btc-base.css + 인라인 <style> → AdSense 스크립트
<body> .bg-field(배경) → header.nav → .wrap 본문 → footer → btc-reveal.js
```

- nav의 현재 페이지 링크에 `class="active"` 지정
- 본문 섹션은 `.card` + `.reveal` 패턴, 제목 계층은 `.page-head h1` → `.sec-h h2`
- 디자인 토큰(`var(--brand)` 등)만 사용, 새 hex 색상 도입 금지

## 메타태그 체크리스트 (페이지 생성·수정 시)

```html
<title>페이지명 — BTC 투자 타이밍 레이더</title>
<meta name="description" content="...">          <!-- 80~160자, 키워드 자연 포함 -->
<link rel="canonical" href="https://btctiming.co.kr/페이지.html">
<meta property="og:type|url|site_name|title|description|locale" ...>  <!-- locale: ko_KR -->
```

## 새 페이지 신설 시 추가 작업

1. `sitemap.xml`에 `<url>` 항목 추가 (lastmod 갱신)
2. 모든 기존 페이지의 nav/footer에 링크 추가 여부 판단 — nav는 핵심 페이지만, footer는 전체
3. 내부 링크는 상대 경로(`about.html`), 도메인 하드코딩은 canonical/OG에만

## 완료 기준

- [ ] 단정·보장성 표현 없음 (위 톤 규칙 통과)
- [ ] 메타태그 체크리스트 완료
- [ ] 새 페이지면 sitemap.xml 갱신
- [ ] 전문 용어 첫 등장 시 설명 존재
- [ ] 변경 요약을 `_workspace/{NN}_content_changes.md`에 기록
- [ ] 커밋 메시지: `docs(content): 제목` 또는 `feat(seo): 제목`

## 주의사항

- AdSense 스크립트(`adsbygoogle`)와 `ads.txt`를 수정·제거하지 않는다
- `btctiming/` 디렉토리는 gitignore된 로컬 보관소 — 수정 금지 (배포되지 않음)
- 대시보드 데이터 바인딩(JS)이 필요한 콘텐츠는 dashboard-developer에게 위임한다
