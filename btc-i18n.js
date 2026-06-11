/* ===========================================================================
 * btc-i18n.js — BTC 타이밍 레이더 다국어(i18n) 런타임
 * 한국어(기본) / 영어 / 중국어(간체) 3개 언어 전환.
 * 프레임워크·번들러 없음. 모든 페이지가 공유하는 단일 IIFE.
 *
 * 핵심 동작
 *  1) 언어 결정: ?lang= → localStorage → navigator.language → 기본 ko
 *  2) data-en / data-zh 속성 기반 정적 텍스트 번역 (ko는 요소 원문 그대로)
 *  3) 언어 스위처(KO · EN · 中文) 자동 주입 + 스타일 <style> 주입
 *  4) snapshot 한국어 라벨 → 현재 언어 매핑 테이블 (mapLabel)
 *  5) 인라인 스크립트용 t({ko,en,zh}) / locale 제공
 *
 * ko 모드에서는 DOM 순회를 생략한다(플래시·성능 회피). en/zh만 apply().
 * ========================================================================= */
(function () {
  'use strict';

  /* ── 1. 언어 결정 ────────────────────────────────────────────────────── */
  // 지원 언어 화이트리스트
  var SUPPORTED = ['ko', 'en', 'zh'];
  var STORE_KEY = 'btc_lang';

  // 코드 정규화: zh-CN/zh-TW… → zh, en-US… → en, 그 외 → ko
  function normalize(code) {
    if (!code) return null;
    code = String(code).toLowerCase();
    if (code.indexOf('zh') === 0) return 'zh';
    if (code.indexOf('en') === 0) return 'en';
    if (code.indexOf('ko') === 0) return 'ko';
    return null;
  }

  // URL 쿼리 ?lang= 읽기
  function fromQuery() {
    try {
      var m = location.search.match(/[?&]lang=([^&]+)/i);
      return m ? normalize(decodeURIComponent(m[1])) : null;
    } catch (e) { return null; }
  }

  // localStorage 읽기
  function fromStore() {
    try { return normalize(localStorage.getItem(STORE_KEY)); }
    catch (e) { return null; }
  }

  // navigator 언어 읽기
  function fromNav() {
    try { return normalize(navigator.language || (navigator.languages || [])[0]); }
    catch (e) { return null; }
  }

  // 우선순위에 따라 최종 언어 결정. 쿼리로 들어오면 store에도 반영한다.
  var queryLang = fromQuery();
  var lang = queryLang || fromStore() || fromNav() || 'ko';
  if (SUPPORTED.indexOf(lang) < 0) lang = 'ko';
  if (queryLang) {
    try { localStorage.setItem(STORE_KEY, queryLang); } catch (e) {}
  }

  // 로케일 매핑 (숫자/날짜 포맷용)
  var LOCALE = { ko: 'ko-KR', en: 'en-US', zh: 'zh-CN' };
  var HTML_LANG = { ko: 'ko', en: 'en', zh: 'zh-CN' };

  // <html lang> 즉시 설정
  try { document.documentElement.lang = HTML_LANG[lang]; } catch (e) {}

  /* ── 2. snapshot 한국어 라벨 매핑 테이블 ─────────────────────────────────
   * 키: snapshot이 내려주는 한국어 원문 그대로.
   * 값: { en, zh }. 매핑에 없으면 원문(ko) 그대로 반환 — 절대 깨지지 않게.
   * 백엔드 enum의 다른 값(현재 snapshot에 안 보이는 변형)도 가능한 한 포함. */
  var LABELS = {
    /* signalDisplay / toneDisplay / labelDisplay / label · 매수 신호 계열 */
    '중립': { en: 'Neutral', zh: '中性' },
    '매수': { en: 'Buy', zh: '买入' },
    '강한 매수': { en: 'Strong Buy', zh: '强力买入' },
    '강력 매수': { en: 'Strong Buy', zh: '强力买入' },
    '약한 매수': { en: 'Weak Buy', zh: '弱买入' },
    '매도': { en: 'Sell', zh: '卖出' },
    '강한 매도': { en: 'Strong Sell', zh: '强力卖出' },
    '강력 매도': { en: 'Strong Sell', zh: '强力卖出' },
    '약한 매도': { en: 'Weak Sell', zh: '弱卖出' },

    /* signalMeta 라벨 (매집/분배) */
    '강력 매집': { en: 'Strong Accumulation', zh: '强力吸筹' },
    '완만한 매집': { en: 'Mild Accumulation', zh: '温和吸筹' },
    '분배 우세': { en: 'Distribution', zh: '派发占优' },
    '강력 분배': { en: 'Strong Distribution', zh: '强力派发' },

    /* actionLabel */
    '대기': { en: 'Wait', zh: '等待' },
    '관망': { en: 'Hold off', zh: '观望' },
    '매집': { en: 'Accumulate', zh: '吸筹' },
    '분배': { en: 'Distribute', zh: '派发' },

    /* halvingPhase / cycle.phaseLabel */
    '사이클 초기': { en: 'Early cycle', zh: '周期初期' },
    '사이클 중기': { en: 'Mid cycle', zh: '周期中期' },
    '사이클 후기': { en: 'Late cycle', zh: '周期后期' },
    '과열 구간 (Q3)': { en: 'Overheated zone (Q3)', zh: '过热区间 (Q3)' },
    '과열 구간': { en: 'Overheated zone', zh: '过热区间' },
    '바닥 구간': { en: 'Bottom zone', zh: '底部区间' },
    '회복 구간': { en: 'Recovery zone', zh: '复苏区间' },

    /* marketSeason */
    '혼합 시장': { en: 'Mixed market', zh: '混合市场' },
    '강세 시장': { en: 'Bull market', zh: '牛市' },
    '약세 시장': { en: 'Bear market', zh: '熊市' },

    /* altseasonLabel / alt_season.label */
    'BTC 시즌': { en: 'BTC Season', zh: 'BTC 季节' },
    '알트 시즌': { en: 'Altcoin Season', zh: '山寨季' },
    '알트시즌': { en: 'Altcoin Season', zh: '山寨季' },
    '중립 구간': { en: 'Neutral zone', zh: '中性区间' },

    /* dcaZones[].signal ('강력 매수'는 위 매수 계열에서 이미 정의) */
    '매수 신호': { en: 'Buy Signal', zh: '买入信号' },
    '관심 구간': { en: 'Watch zone', zh: '关注区间' },

    /* dcaZones[].range */
    '50~64점': { en: '50–64 pts', zh: '50~64 分' },
    '65~79점': { en: '65–79 pts', zh: '65~79 分' },
    '80점 이상': { en: '80+ pts', zh: '80 分以上' },

    /* dcaBacktest[].label */
    '50점 이상 매수': { en: 'Buy at 50+', zh: '50 分以上买入' },
    '55점 이상 매수': { en: 'Buy at 55+', zh: '55 分以上买入' },
    '65점 이상 매수': { en: 'Buy at 65+', zh: '65 分以上买入' },

    /* predictionCorrelation[].period */
    '1일후': { en: 'After 1d', zh: '1天后' },
    '3일후': { en: 'After 3d', zh: '3天后' },
    '7일후': { en: 'After 7d', zh: '7天后' },

    /* strength (predictionCorrelation / scoreCorrelations) */
    '강함': { en: 'Strong', zh: '强' },
    '약함': { en: 'Weak', zh: '弱' },
    '보통': { en: 'Moderate', zh: '中等' },
    '강한 양의 상관': { en: 'Strong positive', zh: '强正相关' },
    '보통 양의 상관': { en: 'Moderate positive', zh: '中等正相关' },
    '약한 양의 상관': { en: 'Weak positive', zh: '弱正相关' },
    '강한 음의 상관': { en: 'Strong negative', zh: '强负相关' },
    '보통 음의 상관': { en: 'Moderate negative', zh: '中等负相关' },
    '약한 음의 상관': { en: 'Weak negative', zh: '弱负相关' },

    /* priceDivergence[].divergenceType */
    '긍정 다이버전스': { en: 'Bullish divergence', zh: '看涨背离' },
    '부정 다이버전스': { en: 'Bearish divergence', zh: '看跌背离' },
    '수렴': { en: 'Convergence', zh: '收敛' },

    /* windowComparison[].window */
    '30일': { en: '30d', zh: '30天' },
    '60일': { en: '60d', zh: '60天' },
    '90일': { en: '90d', zh: '90天' },

    /* checklist.levelLabel */
    '좋음': { en: 'Good', zh: '良好' },
    '보통임': { en: 'Average', zh: '一般' },
    '나쁨': { en: 'Poor', zh: '较差' },
    '매우 좋음': { en: 'Excellent', zh: '极佳' },

    /* liquidation.cascadeLabel */
    '하락 청산 위험': { en: 'Downside liquidation risk', zh: '下行清算风险' },
    '상승 청산 위험': { en: 'Upside liquidation risk', zh: '上行清算风险' },
    '청산 위험 낮음': { en: 'Low liquidation risk', zh: '清算风险偏低' },

    /* net_liquidity.signalLabel */
    '유동성 축소': { en: 'Liquidity contraction', zh: '流动性收缩' },
    '유동성 확대': { en: 'Liquidity expansion', zh: '流动性扩张' },
    '유동성 중립': { en: 'Liquidity neutral', zh: '流动性中性' },

    /* options_regime.ivLabel / skewLabel */
    '극단적 공포': { en: 'Extreme fear', zh: '极度恐惧' },
    '극단적 탐욕': { en: 'Extreme greed', zh: '极度贪婪' },
    '콜 수요 우세': { en: 'Call demand dominant', zh: '看涨需求占优' },
    '풋 수요 우세': { en: 'Put demand dominant', zh: '看跌需求占优' },
    '중립적': { en: 'Neutral', zh: '中性' },

    /* performance.dayOfWeekStats[].day (요일) */
    '월': { en: 'Mon', zh: '周一' },
    '화': { en: 'Tue', zh: '周二' },
    '수': { en: 'Wed', zh: '周三' },
    '목': { en: 'Thu', zh: '周四' },
    '금': { en: 'Fri', zh: '周五' },
    '토': { en: 'Sat', zh: '周六' },
    '일': { en: 'Sun', zh: '周日' },

    /* performance.monthlyData[].monthName (월) */
    '1월': { en: 'Jan', zh: '1月' }, '2월': { en: 'Feb', zh: '2月' },
    '3월': { en: 'Mar', zh: '3月' }, '4월': { en: 'Apr', zh: '4月' },
    '5월': { en: 'May', zh: '5月' }, '6월': { en: 'Jun', zh: '6月' },
    '7월': { en: 'Jul', zh: '7月' }, '8월': { en: 'Aug', zh: '8月' },
    '9월': { en: 'Sep', zh: '9月' }, '10월': { en: 'Oct', zh: '10月' },
    '11월': { en: 'Nov', zh: '11月' }, '12월': { en: 'Dec', zh: '12月' },

    /* rolling_correlation.regimeLabel */
    '독립': { en: 'Decoupled', zh: '独立' },
    '독립/헤지 성격': { en: 'Decoupled / hedge', zh: '独立/对冲属性' },
    '헤지 성격': { en: 'Hedge', zh: '对冲属性' },
    '동조화': { en: 'Correlated', zh: '同步' },

    /* sentiment.ivRv.label */
    '과대': { en: 'Overpriced', zh: '高估' },
    '과소': { en: 'Underpriced', zh: '低估' },
    '적정': { en: 'Fair', zh: '合理' },

    /* stablecoin.signalLabel */
    '공급 축소': { en: 'Supply contraction', zh: '供应收缩' },
    '공급 확대': { en: 'Supply expansion', zh: '供应扩张' },

    /* system.regimeMatrix.label */
    '극도 위험': { en: 'Extreme risk', zh: '极度风险' },
    '위험': { en: 'Risk', zh: '风险' },
    '안전': { en: 'Safe', zh: '安全' },

    /* system.apiUsage[].status / limit */
    '정상': { en: 'OK', zh: '正常' },
    '지연': { en: 'Delayed', zh: '延迟' },
    '오류': { en: 'Error', zh: '错误' },
    '무료 티어': { en: 'Free tier', zh: '免费层' },
    '무제한': { en: 'Unlimited', zh: '无限制' },

    /* technical.adx.strengthLabel / macd.crossLabel */
    '강한 하락 추세': { en: 'Strong downtrend', zh: '强下降趋势' },
    '강한 상승 추세': { en: 'Strong uptrend', zh: '强上升趋势' },
    '약한 추세': { en: 'Weak trend', zh: '弱趋势' },
    '추세 없음': { en: 'No trend', zh: '无趋势' },
    '크로스 없음': { en: 'No cross', zh: '无交叉' },
    '골든 크로스': { en: 'Golden cross', zh: '金叉' },
    '데드 크로스': { en: 'Dead cross', zh: '死叉' },

    /* expert_opinion.verdict */
    '중립 — 관망': { en: 'Neutral — Hold off', zh: '中性 — 观望' },
    '매수 — 분할 진입': { en: 'Buy — Scale in', zh: '买入 — 分批进场' },
    '매도 — 차익 실현': { en: 'Sell — Take profit', zh: '卖出 — 获利了结' },

    /* indicatorRows / indicatorBreakdown 지표명 (IMAP 한국어 표기 포함) */
    '공포탐욕': { en: 'Fear & Greed', zh: '恐惧贪婪' },
    '공포탐욕 지수': { en: 'Fear & Greed Index', zh: '恐惧贪婪指数' },
    '롱숏비율': { en: 'Long/Short Ratio', zh: '多空比' },
    '롱/숏 비율': { en: 'Long/Short Ratio', zh: '多空比' },
    '펀딩비': { en: 'Funding Rate', zh: '资金费率' },
    'OI비율': { en: 'OI Ratio', zh: '未平仓合约比' },
    '미결제약정 비율': { en: 'Open Interest Ratio', zh: '未平仓合约比' },
    '테이커비율': { en: 'Taker Ratio', zh: '主动成交比' },
    '테이커 매수/매도': { en: 'Taker Buy/Sell', zh: '主动买/卖' },
    'RSI(주)': { en: 'RSI (Weekly)', zh: 'RSI(周)' },
    'RSI(일)': { en: 'RSI (Daily)', zh: 'RSI(日)' },
    'RSI 주봉': { en: 'RSI (Weekly)', zh: 'RSI(周线)' },
    'RSI 일봉': { en: 'RSI (Daily)', zh: 'RSI(日线)' },
    'MA200비율': { en: 'MA200 Ratio', zh: 'MA200 比率' },
    '200일 평균 비율': { en: '200-day MA Ratio', zh: '200日均线比率' },
    '변동성(HV)': { en: 'Volatility (HV)', zh: '波动率(HV)' },
    '반감기사이클': { en: 'Halving Cycle', zh: '减半周期' },
    '채굴자수익': { en: 'Miner Revenue', zh: '矿工收入' },
    'M2 성장률': { en: 'M2 Growth', zh: 'M2 增长率' },
    'M2 증가율': { en: 'M2 Growth', zh: 'M2 增长率' },
    'BTC ETF 유입': { en: 'BTC ETF Inflow', zh: 'BTC ETF 流入' },
    'BTC도미넌스': { en: 'BTC Dominance', zh: 'BTC 占比' },
    'BTC 점유율': { en: 'BTC Dominance', zh: 'BTC 占比' },
    '김치프리미엄': { en: 'Kimchi Premium', zh: '泡菜溢价' },
    '김치 프리미엄': { en: 'Kimchi Premium', zh: '泡菜溢价' },
    'ETH/BTC': { en: 'ETH/BTC', zh: 'ETH/BTC' },
    'ETH/BTC 비율': { en: 'ETH/BTC Ratio', zh: 'ETH/BTC 比率' },
    'MVRV Z': { en: 'MVRV-Z', zh: 'MVRV-Z' },
    'MVRV-Z': { en: 'MVRV-Z', zh: 'MVRV-Z' },
    '스테이블코인': { en: 'Stablecoin', zh: '稳定币' },
    'Puell Multiple': { en: 'Puell Multiple', zh: 'Puell 倍数' },
    'Active Addresses': { en: 'Active Addresses', zh: '活跃地址' },
    '활성 지갑 수': { en: 'Active Addresses', zh: '活跃地址数' },
    'Hash Rate': { en: 'Hash Rate', zh: '算力' },
    '채굴 강도': { en: 'Hash Rate', zh: '算力' },
    'DXY': { en: 'DXY', zh: '美元指数' },
    '달러 지수': { en: 'Dollar Index', zh: '美元指数' },
    'S&P500': { en: 'S&P 500', zh: '标普500' },
    'S&P 500': { en: 'S&P 500', zh: '标普500' },
    'Put/Call': { en: 'Put/Call', zh: '看跌/看涨' },
    '옵션 Put/Call': { en: 'Options Put/Call', zh: '期权看跌/看涨' },
    'VIX': { en: 'VIX', zh: 'VIX' },
    '공포 지수(VIX)': { en: 'VIX', zh: '恐慌指数(VIX)' },
    'SOPR': { en: 'SOPR', zh: 'SOPR' },
    'NUPL': { en: 'NUPL', zh: 'NUPL' },
    'NVT': { en: 'NVT', zh: 'NVT' },
    'M2Growth': { en: 'M2 Growth', zh: 'M2 增长' },
    'FFR': { en: 'Fed Funds Rate', zh: '联邦基金利率' },
    '기준금리': { en: 'Policy Rate', zh: '基准利率' },

    /* whale_activity.signal / activityLevel (snapshot이 한국어로 줄 경우 대비) */
    '매집 중': { en: 'Accumulating', zh: '吸筹中' },
    '분배 중': { en: 'Distributing', zh: '派发中' },
    '높음': { en: 'High', zh: '高' },
    '낮음': { en: 'Low', zh: '低' },

    /* 뉴스 센티먼트 labelDisplay 등 */
    '긍정': { en: 'Positive', zh: '正面' },
    '부정': { en: 'Negative', zh: '负面' },
    '극도 공포': { en: 'Extreme Fear', zh: '极度恐惧' },
    '공포': { en: 'Fear', zh: '恐惧' },
    '탐욕': { en: 'Greed', zh: '贪婪' },
    '극도 탐욕': { en: 'Extreme Greed', zh: '极度贪婪' },

    /* checklist.items[].name — "지표명 + 비교연산자 + 값" 복합 문자열의 지표명 부분.
       부등호 앞 지표명만 mapLabel 분해 매핑되므로 단일 어휘로 등록한다. */
    'RSI': { en: 'RSI', zh: 'RSI' },
    'MVRV': { en: 'MVRV', zh: 'MVRV' },
    '김프': { en: 'Kimchi Premium', zh: '泡菜溢价' },
    'MA200': { en: 'MA200', zh: 'MA200' },
    /* 연산자 없는 복합 항목명은 전체 매핑으로 처리 */
    'MA200 위': { en: 'Above MA200', zh: 'MA200 之上' },
    'MA200 아래': { en: 'Below MA200', zh: 'MA200 之下' },
    '해시리본 비항복': { en: 'Hash Ribbon: no capitulation', zh: '哈希丝带未投降' },
    '해시리본 항복': { en: 'Hash Ribbon: capitulation', zh: '哈希丝带投降' }
  };

  // 비교연산자 (체크리스트 "지표명 < 값" 복합 문자열 분해용)
  var CMP_RE = /\s*(<=|>=|≤|≥|<|>|=)\s*/;

  // snapshot 한국어 라벨 → 현재 언어. 매핑 없으면 원문 그대로.
  function mapLabel(ko) {
    if (ko == null) return ko;
    if (lang === 'ko') return ko;
    var s = String(ko).trim();
    var hit = LABELS[s];
    if (hit && hit[lang]) {
      // 원문에 앞뒤 공백이 있었다면 보존
      return String(ko).replace(s, hit[lang]);
    }
    // 복합 문자열 처리: "공포탐욕 < 25" 처럼 비교연산자가 있으면
    // 연산자 앞 지표명 부분만 매핑하고 나머지(연산자+값)는 그대로 보존한다.
    var m = s.match(CMP_RE);
    if (m && m.index > 0) {
      var name = s.slice(0, m.index).trim();      // 지표명 부분
      var rest = s.slice(m.index);                 // 연산자+값 (앞 공백 포함)
      var nHit = LABELS[name];
      if (nHit && nHit[lang]) return nHit[lang] + rest;
    }
    return ko; // 폴백: 한국어 원문
  }

  /* ── 3. 인라인 스크립트용 t({ko,en,zh}) ─────────────────────────────── */
  function t(dict) {
    if (dict == null) return '';
    if (typeof dict === 'string') return dict;
    return dict[lang] != null ? dict[lang] : (dict.ko != null ? dict.ko : '');
  }

  /* ── 4. 정적 텍스트 번역 (data-en / data-zh) ────────────────────────── */
  // 속성 번역 대상 화이트리스트
  var ATTR_LIST = ['placeholder', 'aria-label', 'content', 'alt', 'title'];

  // 단일 요소 번역
  function translateEl(el) {
    var key = 'data-' + lang; // data-en / data-zh
    // 본문 텍스트
    if (el.hasAttribute(key)) {
      var val = el.getAttribute(key);
      if (el.getAttribute('data-i18n-html') === '1') el.innerHTML = val;
      else el.textContent = val;
    }
    // 속성 번역: data-en-placeholder 등
    for (var i = 0; i < ATTR_LIST.length; i++) {
      var attr = ATTR_LIST[i];
      var dkey = key + '-' + attr; // data-en-placeholder
      if (el.hasAttribute(dkey)) el.setAttribute(attr, el.getAttribute(dkey));
    }
  }

  // 루트 하위의 모든 번역 대상 순회
  function apply(root) {
    if (lang === 'ko') return; // ko는 원문 그대로 — 순회 생략
    root = root || document;
    // 본문/속성 번역 후보 수집 (data-en 또는 data-zh 또는 속성 변형 보유)
    var sel = '[data-' + lang + '],' +
      ATTR_LIST.map(function (a) { return '[data-' + lang + '-' + a + ']'; }).join(',');
    var nodes = root.querySelectorAll(sel);
    for (var i = 0; i < nodes.length; i++) translateEl(nodes[i]);
    // <title>은 head에 있어 위 셀렉터에 잡히지만, 혹시 누락 대비 명시 처리
    var ttl = document.querySelector('title[data-' + lang + ']');
    if (ttl) document.title = ttl.getAttribute('data-' + lang);
  }

  /* ── 5. 언어 스위처 자동 주입 + 스타일 ──────────────────────────────── */
  // 스타일은 btc-base.css를 건드리지 않고 JS가 <style>로 주입한다.
  function injectStyle() {
    if (document.getElementById('btc-i18n-style')) return;
    var css =
      /* ── 헤더 겹침 방지(회귀 수정) ──────────────────────────────────────
       * 스위처 주입으로 헤더 폭이 늘면, white-space:nowrap인 .brand 텍스트가
       * 박스 밖으로 오버플로하며 CTA/스위처와 겹쳤다. 두 헤더 구조(브랜드가 a /
       * 브랜드가 div) 모두에 공통 적용한다. 페이지 CSS는 건드리지 않고
       * 이 주입 스타일(head 최후미 삽입 → 동일 특정성에서 우선)로 해소한다.
       *  - .brand: 줄어들 수 있게(min-width:0, flex-shrink:1)
       *  - .brand 텍스트 span(로고 .dot 제외): 말줄임 처리
       *  - .dot / CTA / nav-pill / 스위처: 찌그러지지 않게 flex-shrink:0 */
      'header.nav .nav-inner .brand{min-width:0;flex-shrink:1;overflow:hidden}' +
      'header.nav .nav-inner .brand>span:not(.dot){min-width:0;overflow:hidden;' +
      'text-overflow:ellipsis;white-space:nowrap}' +
      'header.nav .nav-inner .brand .dot{flex-shrink:0}' +
      'header.nav .nav-inner .nav-cta,header.nav .nav-inner .nav-pill{flex-shrink:0}' +
      '.btc-lang{display:inline-flex;align-items:center;gap:2px;font-family:var(--mono);' +
      'font-size:12px;background:rgba(255,255,255,.05);border:1px solid var(--border);' +
      'border-radius:100px;padding:3px;margin-left:4px;flex:none;flex-shrink:0}' +
      '.btc-lang button{appearance:none;border:0;background:transparent;color:var(--muted);' +
      'font:inherit;cursor:pointer;padding:4px 9px;border-radius:100px;line-height:1;' +
      'transition:.16s;white-space:nowrap}' +
      '.btc-lang button:hover{color:var(--text)}' +
      '.btc-lang button.on{color:var(--text);background:var(--brand-soft,rgba(247,147,26,.12));' +
      'box-shadow:inset 0 0 0 1px rgba(247,147,26,.25)}' +
      /* 모바일: 헤더가 좁아도 스위처는 항상 보이게. nav-pill만 숨고 스위처는 유지 */
      '@media(max-width:820px){.btc-lang{margin-left:auto}}' +
      '@media(max-width:480px){.btc-lang{font-size:11px}.btc-lang button{padding:4px 7px}}' +
      /* 극소형: 스위처를 컴팩트화해 brand 텍스트 가용폭 확보 */
      '@media(max-width:360px){.btc-lang{gap:0;margin-left:8px;padding:2px}' +
      '.btc-lang button{padding:3px 5px}}';
    var st = document.createElement('style');
    st.id = 'btc-i18n-style';
    st.textContent = css;
    (document.head || document.documentElement).appendChild(st);
  }

  // 스위처 DOM 생성 후 nav-inner에 주입
  function injectSwitcher() {
    var navInner = document.querySelector('header.nav .nav-inner');
    if (!navInner || navInner.querySelector('.btc-lang')) return;
    var wrap = document.createElement('div');
    wrap.className = 'btc-lang';
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', 'Language / 语言 / 언어');
    var defs = [
      { code: 'ko', label: 'KO' },
      { code: 'en', label: 'EN' },
      { code: 'zh', label: '中文' }
    ];
    defs.forEach(function (d) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = d.label;
      b.setAttribute('data-lang', d.code);
      if (d.code === lang) {
        b.className = 'on';
        b.setAttribute('aria-current', 'true');
      }
      b.addEventListener('click', function () { setLang(d.code); });
      wrap.appendChild(b);
    });
    // nav-pill 앞에 두어 시각적으로 우측 정렬 그룹에 묶이게 한다.
    var pill = navInner.querySelector('.nav-pill');
    if (pill) navInner.insertBefore(wrap, pill);
    else navInner.appendChild(wrap);
  }

  /* ── 6. 언어 변경 (확정 방식: localStorage 저장 후 reload) ───────────── */
  function setLang(code) {
    code = normalize(code) || 'ko';
    if (SUPPORTED.indexOf(code) < 0) code = 'ko';
    try { localStorage.setItem(STORE_KEY, code); } catch (e) {}
    // ?lang= 쿼리가 붙어 있으면 제거해 store 값과 충돌하지 않게 한다.
    try {
      var url = new URL(location.href);
      url.searchParams.delete('lang');
      location.replace(url.toString());
      return;
    } catch (e) {
      location.reload();
    }
  }

  /* ── 7. 전역 API 노출 ───────────────────────────────────────────────── */
  window.BTCI18N = {
    lang: lang,
    locale: LOCALE[lang],
    htmlLang: HTML_LANG[lang],
    setLang: setLang,
    apply: apply,
    mapLabel: mapLabel,
    t: t
  };

  /* ── 8. 초기 구동 ───────────────────────────────────────────────────── */
  function boot() {
    injectStyle();
    injectSwitcher();
    apply(document); // ko면 내부에서 즉시 반환
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
