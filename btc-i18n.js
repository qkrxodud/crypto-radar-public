/* ===========================================================================
 * btc-i18n.js — BTC 타이밍 레이더 다국어(i18n) 런타임
 * 한국어(기본) / 영어 전환. (런타임은 zh 라벨도 내장하나 현재 UI 스위처는 KO·EN만 노출)
 * 프레임워크·번들러 없음. 모든 페이지가 공유하는 단일 IIFE.
 *
 * 핵심 동작
 *  1) 언어 결정: ?lang= → localStorage → navigator.language → 기본 ko
 *  2) data-en 속성 기반 정적 텍스트 번역 (ko는 요소 원문 그대로)
 *  3) 언어 스위처(KO · EN) 자동 주입 (V2 topbar/mobile-bar) + 스타일 <style> 주입
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
    /* 밸류에이션·시즌 카드 (레인보우/Mayer/STH/시즌/대기자금·군중극단) */
    '저가 매수': { en: 'Deep Value Buy', zh: '低价买入' },
    '적정 하단': { en: 'Fair Value (Low)', zh: '合理区间下沿' },
    '적정 상단': { en: 'Fair Value (High)', zh: '合理区间上沿' },
    '적정 구간': { en: 'Fair Value', zh: '合理区间' },
    '과열': { en: 'Overheated', zh: '过热' },
    '버블': { en: 'Bubble', zh: '泡沫' },
    '분할 매수': { en: 'Scale In', zh: '分批买入' },
    '비트코인 시즌': { en: 'Bitcoin Season', zh: '比特币季' },
    '알트코인 시즌': { en: 'Altcoin Season', zh: '山寨币季' },
    '알트 시즌': { en: 'Altcoin Season', zh: '山寨币季' },
    '높은 매수연료 — 강세 기대': { en: 'High buying fuel — bullish backdrop', zh: '买入弹药充足 — 看涨背景' },
    '낮은 매수연료 — 약세 주의': { en: 'Low buying fuel — caution', zh: '买入弹药不足 — 谨慎' },
    'STH 원가 프리미엄 — 단기과열 경계': { en: 'Premium over STH cost — short-term overheating watch', zh: '高于短期持有者成本 — 警惕短期过热' },
    'STH 원가 아래 — 역사적 매수 구간': { en: 'Below STH cost — historical buy zone', zh: '低于短期持有者成本 — 历史买入区间' },
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
    '매집 우세': { en: 'Accumulation', zh: '吸筹占优' },
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
    '매도 신호': { en: 'Sell Signal', zh: '卖出信号' },
    '관심 구간': { en: 'Watch zone', zh: '关注区间' },
    '역추세 매수 기회': { en: 'Counter-trend buy opportunity', zh: '逆势买入机会' },

    /* dcaZones[].range */
    '35점 미만': { en: 'Below 35 pts', zh: '35 分以下' },
    '35~49점': { en: '35–49 pts', zh: '35~49 分' },
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
    '미흡': { en: 'Weak', zh: '不足' },

    /* checklist.levelDescription (종합 판정 문장) */
    '대부분의 매수 조건이 충족되었습니다': { en: 'Most buy conditions are met', zh: '大部分买入条件已满足' },
    '상당수 매수 조건이 충족되었습니다': { en: 'Many buy conditions are met', zh: '相当多买入条件已满足' },
    '일부 조건만 충족되었습니다': { en: 'Only some conditions are met', zh: '仅部分条件已满足' },
    '매수 조건이 부족합니다': { en: 'Buy conditions are insufficient', zh: '买入条件不足' },

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
    'Pi사이클': { en: 'Pi Cycle', zh: 'Pi 周期' },
    'Pi 사이클': { en: 'Pi Cycle', zh: 'Pi 周期' },
    '변동성(HV)': { en: 'Volatility (HV)', zh: '波动率(HV)' },
    '반감기사이클': { en: 'Halving Cycle', zh: '减半周期' },
    '채굴자수익': { en: 'Miner Revenue', zh: '矿工收入' },
    'M2 성장률': { en: 'M2 Growth', zh: 'M2 增长率' },
    'M2 증가율': { en: 'M2 Growth', zh: 'M2 增长率' },
    'BTC ETF 유입': { en: 'BTC ETF Inflow', zh: 'BTC ETF 流入' },
    'ETF 순유입': { en: 'ETF Net Inflow', zh: 'ETF 净流入' },
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
    '해시리본 항복': { en: 'Hash Ribbon: capitulation', zh: '哈希丝带投降' },

    /* checklist.items[].reason 상태 라벨 — "<라벨> (<접두>: <값>)" 구조의 라벨 부분.
       괄호 값은 mapLabel의 REASON_RE 분해로 보존되고 라벨만 여기서 매핑된다.
       (백엔드 InvestmentReadinessChecklist.java의 pass/fail 문장 전수) */
    '극단적 공포 구간': { en: 'Extreme fear zone', zh: '极度恐惧区间' },
    '공포 구간 아님': { en: 'Not in fear zone', zh: '非恐惧区间' },
    '과매도 구간': { en: 'Oversold zone', zh: '超卖区间' },
    '과매도 아님': { en: 'Not oversold', zh: '未超卖' },
    '역사적 저평가 구간': { en: 'Historically undervalued', zh: '历史性低估区间' },
    '저평가 아님': { en: 'Not undervalued', zh: '未低估' },
    '김치프리미엄 적정': { en: 'Kimchi premium normal', zh: '泡菜溢价合理' },
    '김치프리미엄 과열': { en: 'Kimchi premium overheated', zh: '泡菜溢价过热' },
    '롱 우세': { en: 'Longs dominant', zh: '多头占优' },
    '숏 우세 = 역발상 매수': { en: 'Shorts dominant = contrarian buy', zh: '空头占优＝逆势买入' },
    'MA200 하회': { en: 'Below MA200', zh: 'MA200 之下' },
    '장기 상승추세 확인': { en: 'Long-term uptrend confirmed', zh: '确认长期上升趋势' },
    '채굴자 건전 상태': { en: 'Miners healthy', zh: '矿工状态健康' },
    '해시리본 항복 진행 중': { en: 'Hash Ribbon capitulation underway', zh: '哈希丝带投降进行中' },
    '기관 매도 또는 유출': { en: 'Institutional selling / outflow', zh: '机构卖出或流出' },
    '기관 매수 확인': { en: 'Institutional buying confirmed', zh: '确认机构买入' }
  };

  /* checklist reason 괄호 안 접두 라벨 ("(현재: 21)"의 "현재" 부분) 매핑 */
  var REASON_PREFIX = {
    '현재': { en: 'Now', zh: '当前' },
    'MA200 대비': { en: 'vs MA200', zh: '相对 MA200' },
    '순유입': { en: 'Net inflow', zh: '净流入' }
  };

  // reason 구조 분해용: "<라벨> (<접두>: <값>)" — 마지막 괄호만 접두:값으로 본다.
  var REASON_RE = /^(.+?)\s*\(([^():]+):\s*(.+)\)$/;

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
    // 체크리스트 reason 처리: "<라벨> (<접두>: <값>)" 구조를 분해해
    // 라벨과 접두만 매핑하고 숫자 값은 그대로 보존한다.
    var r = s.match(REASON_RE);
    if (r) {
      var rLabel = LABELS[r[1].trim()];           // 상태 라벨
      if (rLabel && rLabel[lang]) {
        var pHit = REASON_PREFIX[r[2].trim()];    // 괄호 안 접두
        var pTxt = (pHit && pHit[lang]) ? pHit[lang] : r[2].trim();
        return rLabel[lang] + ' (' + pTxt + ': ' + r[3] + ')';
      }
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
      /* 언어 스위처 — V2 사이드바 레이아웃(topbar/mobile-bar)에 얹는다.
       * 페이지 CSS는 건드리지 않고 이 주입 스타일(head 최후미 삽입)로만 처리.
       * 색상은 페이지 디자인 토큰(--green/--line/--m1/--t1/--mono)을 재사용해
       * 어떤 페이지에 들어가도 톤이 맞는다(토큰 없으면 폴백값 사용). */
      '.btc-lang{display:inline-flex;align-items:center;gap:1px;' +
      'font-family:var(--mono,ui-monospace,monospace);font-size:12px;' +
      'background:rgba(255,255,255,.04);border:1px solid var(--line,#20242e);' +
      'border-radius:100px;padding:3px;flex:none}' +
      '.btc-lang button{appearance:none;border:0;background:transparent;' +
      'color:var(--m1,#8b94a3);font:inherit;cursor:pointer;padding:4px 10px;' +
      'border-radius:100px;line-height:1;transition:.16s;white-space:nowrap;' +
      'letter-spacing:.02em}' +
      '.btc-lang button:hover{color:var(--t1,#e8ecf2)}' +
      '.btc-lang button.on{color:var(--green,#16c784);' +
      'background:rgba(22,199,132,.14)}' +
      /* 데스크톱 topbar 우측 그룹 안에서 날짜/LIVE 앞에 자연스럽게 붙게 */
      '.topbar .right .btc-lang{order:-1}' +
      /* 모바일 바에서는 햄버거 토글 앞, 우측 정렬 */
      '.mobile-bar .btc-lang{margin-left:auto;margin-right:10px}' +
      '@media(max-width:480px){.btc-lang{font-size:11px}' +
      '.btc-lang button{padding:4px 8px}}';
    var st = document.createElement('style');
    st.id = 'btc-i18n-style';
    st.textContent = css;
    (document.head || document.documentElement).appendChild(st);
  }

  // 노출 언어 정의 — 현재 스코프는 한국어/영어 2개.
  // (LABELS 테이블의 zh 값은 무해하게 남겨두되 UI 스위처에는 노출하지 않는다.)
  var SWITCHER_DEFS = [
    { code: 'ko', label: 'KO' },
    { code: 'en', label: 'EN' }
  ];

  // 스위처 DOM 한 벌 생성
  function buildSwitcher() {
    var wrap = document.createElement('div');
    wrap.className = 'btc-lang';
    wrap.setAttribute('role', 'group');
    wrap.setAttribute('aria-label', 'Language / 언어');
    SWITCHER_DEFS.forEach(function (d) {
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
    return wrap;
  }

  // V2 사이드바 레이아웃에 스위처 주입: 데스크톱은 topbar 우측, 모바일은 모바일 바.
  // 두 위치는 각자의 미디어쿼리로 표시/숨김이 갈리므로 둘 다 넣는다(중복 주입 방지).
  function injectSwitcher() {
    // 데스크톱: .topbar .right 앞쪽에
    var right = document.querySelector('.topbar .right');
    if (right && !right.querySelector('.btc-lang')) {
      right.insertBefore(buildSwitcher(), right.firstChild);
    }
    // 모바일: .mobile-bar 의 햄버거 토글 앞에
    var mbar = document.querySelector('.mobile-bar');
    if (mbar && !mbar.querySelector('.btc-lang')) {
      var toggle = mbar.querySelector('.mb-toggle');
      if (toggle) mbar.insertBefore(buildSwitcher(), toggle);
      else mbar.appendChild(buildSwitcher());
    }
  }

  /* ── 6. 언어 변경 (확정 방식: localStorage 저장 후 reload) ───────────── */
  function setLang(code) {
    code = normalize(code) || 'ko';
    if (SUPPORTED.indexOf(code) < 0) code = 'ko';
    // 저장이 실제로 됐는지 확인 — 프라이빗 모드/저장소 차단 브라우저는 조용히 실패한다.
    var stored = false;
    try {
      localStorage.setItem(STORE_KEY, code);
      stored = localStorage.getItem(STORE_KEY) === code;
    } catch (e) {}
    try {
      var url = new URL(location.href);
      if (stored) {
        // 정상 저장 — ?lang= 쿼리를 제거해 store 값과 충돌하지 않게 한다.
        url.searchParams.delete('lang');
      } else {
        // 저장 불가 브라우저 — URL 쿼리로 언어를 실어 리로드해도 전환되게 한다.
        url.searchParams.set('lang', code);
      }
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
