// snapshot.json을 읽어 전체 대시보드를 렌더링한다.
const DATA_URL = './data/snapshot.json';

// ── 유틸 ────────────────────────────────────────────────────
function n(v, digits=2) {
  if (v == null || v === '') return '--';
  const num = parseFloat(v);
  if (isNaN(num)) return v;
  return num.toLocaleString('ko-KR', { maximumFractionDigits: digits, minimumFractionDigits: digits });
}
function pct(v, digits=2) { return v == null ? '--' : n(v, digits) + '%'; }
function sign(v) { const x = parseFloat(v); return x > 0 ? '+' : ''; }

function scoreColor(score) {
  if (score >= 70) return { cls:'green', border:'border-green', bg:'bg-green', badge:'bg-green' };
  if (score >= 55) return { cls:'blue',  border:'border-blue',  bg:'bg-blue',  badge:'bg-blue'  };
  if (score >= 40) return { cls:'yellow',border:'border-yellow',bg:'bg-yellow',badge:'bg-yellow'};
  return { cls:'red', border:'border-red', bg:'bg-red', badge:'bg-red' };
}

function fgLabel(v) {
  if (v == null) return '';
  if (v <= 20) return '극도 공포';
  if (v <= 40) return '공포';
  if (v <= 60) return '중립';
  if (v <= 80) return '탐욕';
  return '극도 탐욕';
}

function scoreBarColor(score) {
  if (score >= 70) return '#3fb950';
  if (score >= 55) return '#58a6ff';
  if (score >= 40) return '#e3b341';
  return '#f85149';
}

function el(id) { return document.getElementById(id); }
function setText(id, txt) { const e = el(id); if (e) e.textContent = txt; }

function makeRow(label, value, colorClass='') {
  return `<div class="indicator-row">
    <span class="ind-label">${label}</span>
    <span class="ind-value ${colorClass}">${value}</span>
  </div>`;
}

function makeChart(canvasId, labels, datasets, opts={}) {
  const ctx = el(canvasId);
  if (!ctx) return;
  new Chart(ctx, {
    type: opts.type || 'line',
    data: { labels, datasets },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: opts.legend || false } },
      scales: {
        x: { ticks: { color: '#8b949e', maxTicksLimit: opts.maxTicks || 8 }, grid: { color: '#21262d' } },
        y: { ticks: { color: '#8b949e', callback: opts.yFormat || (v=>v) }, grid: { color: '#21262d' },
             min: opts.yMin, max: opts.yMax },
      },
      ...( opts.extra || {} )
    }
  });
}

// ── 메인 렌더 ───────────────────────────────────────────────
async function init() {
  let snap;
  try {
    const res = await fetch(DATA_URL + '?t=' + Date.now());
    snap = await res.json();
  } catch(e) {
    el('loading').textContent = '데이터 로드 실패: ' + e.message;
    return;
  }

  el('loading').style.display = 'none';
  el('main').style.display = 'grid';

  const d = snap.data;
  const upd = new Date(snap.updatedAt);
  el('updated-at').textContent = '최종 갱신: ' + upd.toLocaleString('ko-KR', {timeZone:'Asia/Seoul'}) + ' KST';

  renderHero(d);
  renderKpi(d);
  renderScoreChart(d);
  renderExpert(d);
  renderTechnical(d);
  renderSentiment(d);
  renderOnchain(d);
  renderMacro(d);
  renderBtcChart(d);
  renderFgChart(d);
  renderForecast(d);
  renderWhale(d);
  renderStructure(d);
  renderBreakdown(d);
  renderTiming(d);
  renderChecklist(d);
  renderCycle(d);
  renderAltSeason(d);
}

// ① 히어로
function renderHero(d) {
  const main = d.api_dashboard || {};
  const timing = d.api_dashboard_buy_timing || {};
  const score = main.score;
  const { cls, border, bg } = scoreColor(score);

  el('hero-score').textContent = score ?? '--';
  const ring = el('score-ring');
  ring.classList.add(border, bg);

  const badge = el('signal-badge');
  badge.textContent = main.signalDisplay || main.signalLabel || '--';
  badge.classList.add('badge', cls === 'green' ? 'bg-green' : cls === 'blue' ? 'bg-blue' : cls === 'yellow' ? 'bg-yellow' : 'bg-red');
  badge.style.color = 'white';

  setText('hero-action', timing.actionLabel || main.signalDisplay || '--');
  setText('hero-reason', timing.actionReason || '');
}

// ② KPI
function renderKpi(d) {
  const main = d.api_dashboard || {};
  const check = d.api_dashboard_checklist || {};

  setText('kpi-btc', main.btcClose ? '$' + n(main.btcClose, 0) : '--');
  setText('kpi-date', main.dataDate || '');
  setText('kpi-fg', main.fearGreed ?? '--');
  setText('kpi-fg-hint', fgLabel(main.fearGreed));

  const delta = main.scoreDelta;
  const deltaEl = el('kpi-delta');
  if (deltaEl) {
    deltaEl.textContent = delta != null ? (sign(delta) + delta) : '--';
    deltaEl.className = 'value ' + (delta > 0 ? 'green' : delta < 0 ? 'red' : '');
  }
  setText('kpi-weekly', `주간평균: ${main.weeklyAverageScore ?? '--'}  월간: ${main.monthlyAverageScore ?? '--'}`);
  setText('kpi-check', check.passedCount != null ? `${check.passedCount}/${check.totalCount}` : '--');
  setText('kpi-check-label', check.levelLabel || '');
}

// ③ 점수 차트
function renderScoreChart(d) {
  const history = (d.api_prism_indices?.entries || []);
  const labels = history.map(e => e.date.slice(5));
  const values = history.map(e => e.readinessScore);
  makeChart('score-chart', labels, [{
    label: '종합 점수',
    data: values,
    backgroundColor: values.map(scoreBarColor),
    borderRadius: 3,
  }], { type: 'bar', yMin: 0, yMax: 100 });
}

// 전문가 의견
function renderExpert(d) {
  const ex = d.api_dashboard_expert_opinion || {};
  const color = ex.verdictColor === 'green' ? 'green' : ex.verdictColor === 'red' ? 'red' : 'yellow';
  setText('expert-verdict', ex.verdict || '--');
  el('expert-verdict').className = 'ind-value ' + color;
  setText('expert-summary', ex.summary || '');

  const list = el('expert-signals');
  if (!list) return;
  const signals = [
    ...(ex.bullishSignals || []).map(s => ({ text: s, color: 'green' })),
    ...(ex.bearishSignals || []).map(s => ({ text: s, color: 'red' })),
    ...(ex.neutralSignals || []).map(s => ({ text: s, color: 'yellow' })),
  ].slice(0, 8);
  list.innerHTML = signals.map(s =>
    `<div class="signal-item"><div class="signal-dot" style="background:var(--${s.color})"></div><span>${s.text}</span></div>`
  ).join('');
}

// 기술적
function renderTechnical(d) {
  const t = d.api_dashboard_technical || {};
  const rows = [
    ['RSI (일봉)', t.rsiDaily != null ? `${n(t.rsiDaily,1)} ${t.rsiDaily <= 30 ? '🟢과매도' : t.rsiDaily >= 70 ? '🔴과매수' : ''}` : '--', ''],
    ['RSI (주봉)', n(t.rsiWeekly,1), ''],
    ['RSI (월봉)', n(t.rsiMonthly,1), ''],
    ['MA200 비율', t.ma200Ratio != null ? pct(parseFloat(t.ma200Ratio)*100) : '--', parseFloat(t.ma200Ratio) >= 1 ? 'green' : 'red'],
    ['MA200 거리', t.ma200DistancePct != null ? sign(t.ma200DistancePct)+pct(t.ma200DistancePct) : '--', ''],
    ['역사적 변동성', t.historicalVolatility != null ? pct(parseFloat(t.historicalVolatility)*100) : '--', ''],
    ['Pi Cycle 간격', t.piCycleGap != null ? n(t.piCycleGap,0) : '--', ''],
  ];
  el('technical-rows').innerHTML = rows.map(([l,v,c]) => makeRow(l,v,c)).join('');
}

// 심리
function renderSentiment(d) {
  const s = d.api_dashboard_sentiment || {};
  const rows = [
    ['공포탐욕', `${s.fearGreed ?? '--'} (${fgLabel(s.fearGreed)})`, s.fearGreed <= 30 ? 'green' : s.fearGreed >= 70 ? 'red' : ''],
    ['펀딩비', s.fundingRate != null ? (parseFloat(s.fundingRate)*100).toFixed(5)+'%' : '--', ''],
    ['롱숏 비율', n(s.longShortRatio,2), ''],
    ['미결제약정 비율', n(s.openInterestRatio,2), ''],
    ['테이커 매수/매도', n(s.takerBuySellRatio,2), parseFloat(s.takerBuySellRatio) >= 1 ? 'green' : 'red'],
    ['Put/Call 비율', n(s.putCallRatio,2), ''],
    ['LTH/STH 비율', n(s.lthSthRatio,2), ''],
  ];
  el('sentiment-rows').innerHTML = rows.map(([l,v,c]) => makeRow(l,v,c)).join('');
}

// 온체인
function renderOnchain(d) {
  const o = d.api_dashboard_onchain || {};
  const rows = [
    ['SOPR', n(o.sopr,4), parseFloat(o.sopr) >= 1 ? 'green' : 'red'],
    ['NUPL', n(o.nupl,3), parseFloat(o.nupl) >= 0 ? 'green' : 'red'],
    ['MVRV-Z Score', n(o.mvrvZScore,2), ''],
    ['LTH/STH 비율', n(o.lthSthRatio,2), ''],
    ['거래소 순유입', o.exchangeNetFlow != null ? n(o.exchangeNetFlow,0)+' BTC' : '--', parseFloat(o.exchangeNetFlow) > 0 ? 'red' : 'green'],
    ['거래소 보유량', o.exchangeReserve != null ? n(o.exchangeReserve,0)+' BTC' : '--', ''],
    ['Puell Multiple', n(o.puellMultiple,2), ''],
    ['활성 주소', o.activeAddresses != null ? n(o.activeAddresses,0) : '--', ''],
  ];
  el('onchain-rows').innerHTML = rows.map(([l,v,c]) => makeRow(l,v,c)).join('');
}

// 매크로
function renderMacro(d) {
  const m = d.api_dashboard_macro || {};
  const rows = [
    ['DXY (달러지수)', n(m.dxy,2), ''],
    ['S&P 500', n(m.sp500,0), ''],
    ['김치 프리미엄', m.kimchiPremium != null ? pct(m.kimchiPremium) : '--', parseFloat(m.kimchiPremium) > 0 ? 'green' : 'red'],
    ['스테이블코인 점유율', m.stablecoinDominance != null ? pct(m.stablecoinDominance) : '--', ''],
    ['BTC ETF 순유입', m.btcEtfNetFlow != null ? '$'+n(m.btcEtfNetFlow,0)+'M' : '--', parseFloat(m.btcEtfNetFlow) > 0 ? 'green' : 'red'],
    ['글로벌 M2 성장률', m.globalM2Growth != null ? pct(m.globalM2Growth) : '--', ''],
    ['미국채 10년', m.usTreasury10y != null ? pct(m.usTreasury10y) : '--', ''],
    ['VIX', n(m.vix,1), parseFloat(m.vix) > 25 ? 'red' : 'green'],
  ];
  el('macro-rows').innerHTML = rows.map(([l,v,c]) => makeRow(l,v,c)).join('');
}

// BTC 차트
function renderBtcChart(d) {
  const hist = d.api_prism_indices?.entries || [];
  const labels = hist.map(e => e.date.slice(5));
  const values = hist.map(e => e.btcClose ? parseFloat(e.btcClose) : null);
  makeChart('btc-chart', labels, [{
    label:'BTC', data:values, borderColor:'#f7931a',
    backgroundColor:'rgba(247,147,26,.08)', fill:true, tension:.3, pointRadius:2
  }], { yFormat: v=>'$'+v.toLocaleString() });
}

// 공포탐욕 차트
function renderFgChart(d) {
  const hist = d.api_prism_indices?.entries || [];
  const labels = hist.map(e => e.date.slice(5));
  const values = hist.map(e => e.fearGreed);
  makeChart('fg-chart', labels, [{
    label:'공포탐욕', data:values,
    borderColor:'#58a6ff', backgroundColor:'rgba(88,166,255,.08)',
    fill:true, tension:.3, pointRadius:2
  }], { yMin:0, yMax:100 });
}

// 예측
function renderForecast(d) {
  const f = d.api_dashboard_forecast || {};
  setText('fc-today', f.todayScore ?? '--');
  const predEl = el('fc-pred');
  if (predEl) {
    predEl.textContent = f.predictedScore ?? '--';
    predEl.className = 'ind-value ' + (f.predictedScore > f.todayScore ? 'green' : 'red');
  }
  const diffEl = el('fc-diff');
  if (diffEl && f.scoreDiff != null) {
    diffEl.textContent = (f.scoreDiff > 0 ? '+' : '') + f.scoreDiff;
    diffEl.className = 'ind-value ' + (f.scoreDiff > 0 ? 'green' : 'red');
  }
  setText('fc-r2', f.r2 != null ? n(f.r2,3) : '--');
}

// 고래
function renderWhale(d) {
  const w = d.api_dashboard_whale_activity || {};
  const rows = [
    ['활동 레벨', w.activityLevel || '--', ''],
    ['신호', w.signal || '--', ''],
    ['7일 순유입', w.netFlowSum7d != null ? n(w.netFlowSum7d,0)+' BTC' : '--', parseFloat(w.netFlowSum7d) > 0 ? 'red' : 'green'],
    ['7일 보유 변화', w.reserveChange7d != null ? sign(w.reserveChange7d)+n(w.reserveChange7d,0)+' BTC' : '--', ''],
  ];
  el('whale-rows').innerHTML = rows.map(([l,v,c]) => makeRow(l,v,c)).join('');
}

// 시장구조
function renderStructure(d) {
  const s = d.api_dashboard_market_structure || {};
  const rows = [
    ['구조', s.structure || '--', s.structure?.includes('강세') ? 'green' : s.structure?.includes('약세') ? 'red' : ''],
    ['직전 고점', s.lastHigh != null ? '$'+n(s.lastHigh,0) : '--', ''],
    ['직전 저점', s.lastLow != null ? '$'+n(s.lastLow,0) : '--', ''],
    ['다음 저항', s.nextResistance != null ? '$'+n(s.nextResistance,0) : '--', 'red'],
    ['다음 지지', s.nextSupport != null ? '$'+n(s.nextSupport,0) : '--', 'green'],
  ];
  el('structure-rows').innerHTML = rows.map(([l,v,c]) => makeRow(l,v,c)).join('');
}

// 지표 분해
function renderBreakdown(d) {
  const breakdown = d.api_dashboard?.indicatorBreakdown || {};
  const grid = el('breakdown-grid');
  if (!grid) return;
  grid.innerHTML = Object.entries(breakdown).map(([k, v]) => {
    const c = v >= 70 ? '#3fb950' : v >= 50 ? '#58a6ff' : v >= 30 ? '#e3b341' : '#f85149';
    return `<div class="breakdown-item">
      <span style="color:var(--muted)">${k}</span>
      <span style="color:${c};font-weight:600">${v}</span>
    </div>`;
  }).join('');
}

// 타이밍
function renderTiming(d) {
  const t = d.api_dashboard_buy_timing || {};
  const rows = [
    ['시장 국면', t.marketSeason || '--', ''],
    ['추천 포지션', t.positionSizePct != null ? pct(t.positionSizePct,0) : '--', ''],
    ['DCA 분할', t.dcaSplits != null ? t.dcaSplits+'회' : '--', ''],
    ['DCA 간격', t.dcaIntervalDays != null ? t.dcaIntervalDays+'일' : '--', ''],
    ['반감기 경과', t.halvingDaysAfter != null ? t.halvingDaysAfter+'일' : '--', ''],
    ['반감기 단계', t.halvingPhase || d.api_dashboard?.halvingPhase || '--', ''],
  ];
  el('timing-rows').innerHTML = rows.map(([l,v,c]) => makeRow(l,v,c)).join('');
}

// 체크리스트
function renderChecklist(d) {
  const c = d.api_dashboard_checklist || {};
  const items = c.items || [];
  const container = el('checklist-items');
  if (!container) return;

  const pct = c.passedCount != null ? Math.round(c.passedCount/c.totalCount*100) : 0;
  container.innerHTML = `
    <div style="padding:0 0 10px">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--muted);margin-bottom:4px">
        <span>${c.levelLabel || ''}</span><span>${c.passedCount}/${c.totalCount} (${pct}%)</span>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${pct>=70?'#3fb950':pct>=40?'#e3b341':'#f85149'}"></div></div>
      <p style="font-size:12px;color:var(--muted);margin-top:6px">${c.levelDescription||''}</p>
    </div>
  ` + items.map(item => `
    <div class="check-item">
      <span class="check-icon">${item.passed ? '✅' : '❌'}</span>
      <span style="color:${item.passed?'var(--text)':'var(--muted)'}">${item.label}</span>
    </div>
  `).join('');
}

// 사이클
function renderCycle(d) {
  const c = d.api_dashboard || {};
  const container = el('cycle-rows');
  if (!container) return;
  const rows = [
    ['반감기 경과', c.halvingDaysAfter != null ? c.halvingDaysAfter+'일' : '--', ''],
    ['사이클 단계', c.halvingPhase || '--', ''],
    ['주간 평균 점수', c.weeklyAverageScore ?? '--', ''],
    ['월간 평균 점수', c.monthlyAverageScore ?? '--', ''],
  ];
  container.innerHTML = rows.map(([l,v,c]) => makeRow(l,v,c)).join('');
}

// 알트시즌 + 스테이블
function renderAltSeason(d) {
  const alt = d.api_dashboard_alt_season || {};
  const stable = d.api_dashboard_stablecoin_supply || {};
  const rows = [
    ['알트시즌 지수', alt.altSeasonIndex ?? '--', ''],
    ['알트시즌 단계', alt.phase || '--', ''],
    ['BTC 도미넌스', alt.btcDominance != null ? pct(alt.btcDominance) : '--', ''],
    ['스테이블코인 공급', stable.totalSupplyBillions != null ? '$'+n(stable.totalSupplyBillions,1)+'B' : '--', ''],
    ['7일 변화', stable.supplyChange7dBillions != null ? sign(stable.supplyChange7dBillions)+'$'+n(stable.supplyChange7dBillions,2)+'B' : '--',
     parseFloat(stable.supplyChange7dBillions) > 0 ? 'green' : 'red'],
  ];
  el('altseason-rows').innerHTML = rows.map(([l,v,c]) => makeRow(l,v,c)).join('');
}

init();
