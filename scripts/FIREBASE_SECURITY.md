# Firebase RTDB 보안 — 방문자 카운터/접속자 (2026-11-27 리뷰 묶음3)

## 1단계 (지금 적용 가능 · 클라이언트 변경 불필요)
`firebase-database-rules.json` 이 1단계 규칙이다. 반영은 **사용자 조치**:
Firebase 콘솔 → Realtime Database → 규칙 → 파일 내용 붙여넣기 → 게시 (콘솔의 규칙 시뮬레이터로 아래 확인).

막는 것:
- presence: 임의 키 이름·true 이외 값 쓰기 차단(push 키 형식 `-` + 19자만), 값 덮어쓰기 차단(true→true만 허용)
- counters: 카운터 **삭제(null 쓰기) 차단**(기존엔 .write 식이 null을 막지 못함), counters 아래 임의 노드 생성 차단, 날짜 키 형식 검증(RTDB matches()는 정규식 일부만 지원해 그룹/| 대신 단순 문자 클래스 사용)
- 루트: 정의되지 않은 경로 읽기/쓰기 전부 차단

**남은 위험** — 못 막는 것(인증 없이는 불가): 남의 presence 키 삭제, presence 대량 생성, 카운터 +1 반복 호출.

시뮬레이터 확인 항목: presence/-NabcdefghijklmnopqR ← true 허용 / ← 5 거부 / presence/foo ← true 거부 /
counters/total ← null 거부 / counters/daily/2026-11-27 ← +1 허용 / counters/daily/abcd ← 1 거부 / counters/x ← 1 거부.

## 2단계 (권장 · 사용자 조치 + 클라이언트 변경 필요)
1. 콘솔에서 Authentication → 익명 로그인 활성화, App Check(reCAPTCHA v3/Enterprise) 등록 후 RTDB 적용
2. GCP 콘솔 → API 키(AIzaSyA0…)에 HTTP referrer 제한: `https://btctiming.co.kr/*`
3. 클라이언트: firebase-auth-compat 로드 → `firebase.auth().signInAnonymously()` 후 presence를 `presence/{uid}`로, 방문 마커를 `visits/{date}/{uid}`로 기록
4. 규칙: `presence/$uid .write: auth != null && auth.uid === $uid`,
   `visits/$date/$uid .write: auth.uid === $uid && !data.exists()`,
   카운터는 클라이언트 쓰기 금지 후 Cloud Function(visits onCreate)로 집계 — 또는 카운터 노출을 제거하고 GA 수치로 대체
