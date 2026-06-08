const DATA = './data/snapshot.json';

// ── 유틸 ──────────────────────────────────────────────────────────────
const f = (v,d=2)=>{ if(v==null||v==='')return '--'; const n=parseFloat(v); return isNaN(n)?v:n.toLocaleString('ko-KR',{maximumFractionDigits:d,minimumFractionDigits:d}); };
const pct=(v,d=2)=>v==null?'--':f(v,d)+'%';
const sgn=(v)=>parseFloat(v)>0?'+':'';
const el=(id)=>document.getElementById(id);
const txt=(id,s)=>{ const e=el(id); if(e) e.textContent=s; };

function scColor(s){
  if(s>=70) return {cls:'gr',bdr:'border-gr',bg:'bg-gr'};
  if(s>=55) return {cls:'bl',bdr:'border-bl',bg:'bg-bl'};
  if(s>=40) return {cls:'ye',bdr:'border-ye',bg:'bg-ye'};
  return {cls:'re',bdr:'border-re',bg:'bg-re'};
}
function scBarColor(s){ return s>=70?'#3fb950':s>=55?'#58a6ff':s>=40?'#e3b341':'#f85149'; }
function fgLabel(v){ if(v==null)return ''; if(v<=20)return '극도공포'; if(v<=40)return '공포'; if(v<=60)return '중립'; if(v<=80)return '탐욕'; return '극도탐욕'; }

function row(label, value, colorClass='', trendCls=''){
  return `<div class="row"><span class="rl">${label}</span><span class="rv ${colorClass} ${trendCls}">${value}</span></div>`;
}

function chart(id, labels, datasets, opts={}){
  const ctx=el(id); if(!ctx) return;
  new Chart(ctx,{
    type: opts.type||'line',
    data:{ labels, datasets },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ display: opts.legend||false } },
      scales:{
        x:{ ticks:{color:'#8b949e',maxTicksLimit:opts.maxX||8}, grid:{color:'#21262d'} },
        y:{ ticks:{color:'#8b949e',callback:opts.yFmt||(v=>v)}, grid:{color:'#21262d'}, min:opts.yMin, max:opts.yMax }
      }, ...(opts.extra||{})
    }
  });
}

// ── INIT ──────────────────────────────────────────────────────────────
async function init(){
  let snap;
  try{ const r=await fetch(DATA+'?t='+Date.now()); snap=await r.json(); }
  catch(e){ el('loading').textContent='로드 실패: '+e.message; return; }
  el('loading').style.display='none';
  el('main').style.display='block';

  const upd=new Date(snap.updatedAt);
  el('upd').textContent='갱신: '+upd.toLocaleString('ko-KR',{timeZone:'Asia/Seoul'})+' KST';

  const d=snap.data;
  renderHero(d);
  renderKpi(d);
  renderScoreChart(d);
  renderExpert(d);
  renderIndTable(d);
  renderTechnical(d);
  renderSentiment(d);
  renderOnchain(d);
  renderMacro(d);
  renderBtcChart(d);
  renderFgChart(d);
  renderLiquidation(d);
  renderCorrelation(d);
  renderOptions(d);
  renderNetLiquidity(d);
  renderStablecoin(d);
  renderForecast(d);
  renderWhale(d);
  renderStructure(d);
  renderAltRows(d);
  renderTiming(d);
  renderChecklist(d);
  renderBreakdown(d);
}

// ① 히어로
function renderHero(d){
  const m=d.api_dashboard||{}, t=d.api_dashboard_buy_timing||{};
  const s=m.score; const {cls,bdr,bg}=scColor(s);
  txt('h-score',s??'--');
  const ring=el('ring'); ring.classList.add(bdr,bg);
  const badge=el('h-badge'); badge.textContent=m.signalDisplay||'--';
  badge.classList.add('badge','bg-'+cls); badge.style.color='white';
  txt('h-action', t.actionLabel||m.signalDisplay||'--');
  txt('h-reason', t.actionReason||'');
}

// ② KPI
function renderKpi(d){
  const m=d.api_dashboard||{}, chk=d.api_dashboard_checklist||{}, sys=d.api_dashboard_system||{};
  txt('k-btc', m.btcClose?'$'+f(m.btcClose,0):'--');
  txt('k-date', m.dataDate||'');
  txt('k-fg', m.fearGreed??'--'); txt('k-fg-h', fgLabel(m.fearGreed));
  const dEl=el('k-delta');
  if(dEl){ dEl.textContent=(m.scoreDelta!=null?(m.scoreDelta>0?'+':'')+m.scoreDelta:'--');
    dEl.className='val '+(m.scoreDelta>0?'gr':m.scoreDelta<0?'re':''); }
  txt('k-avg',`주간 ${m.weeklyAverageScore??'--'} / 월간 ${m.monthlyAverageScore??'--'}`);
  txt('k-chk', chk.passedCount!=null?`${chk.passedCount}/${chk.totalCount}`:'--');
  txt('k-chk-h', chk.levelLabel||'');
  const rm=sys.regimeMatrix||{};
  txt('k-quad', rm.label||'--');
  const qEl=el('k-quad'); if(qEl) qEl.className='val '+(rm.color==='green'?'gr':rm.color==='red'?'re':'ye');
  txt('k-quad-h', rm.description||'');
}

// ③ 점수 차트
function renderScoreChart(d){
  const hist=(d.api_prism_indices?.entries||[]);
  const labels=hist.map(e=>e.date.slice(5));
  const vals=hist.map(e=>e.readinessScore);
  chart('score-ch', labels, [{label:'점수',data:vals,backgroundColor:vals.map(scBarColor),borderRadius:3}],
    {type:'bar',yMin:0,yMax:100});
}

// 전문가
function renderExpert(d){
  const ex=d.api_dashboard_expert_opinion||{};
  const c=ex.verdictColor==='green'?'gr':ex.verdictColor==='red'?'re':'ye';
  const vEl=el('ex-verdict'); if(vEl){ vEl.textContent=ex.verdict||'--'; vEl.className='rv '+c; }
  txt('ex-sum', ex.summary||'');
  txt('ex-watch', ex.keyWatch?'👁 '+ex.keyWatch:'');
  const list=el('ex-sigs'); if(!list) return;
  const sigs=[...(ex.bullishSignals||[]).map(s=>({t:s,c:'gr'})),
               ...(ex.bearishSignals||[]).map(s=>({t:s,c:'re'})),
               ...(ex.neutralSignals||[]).map(s=>({t:s,c:'ye'}))].slice(0,10);
  list.innerHTML=sigs.map(s=>`<div class="sig-item"><div class="sig-dot" style="background:var(--${s.c})"></div><span>${s.text||s.t}</span></div>`).join('');
}

// ④ 전체 지표 테이블
function renderIndTable(d){
  const rows=(d.api_dashboard_system?.indicatorRows||[]);
  const tb=el('ind-table'); if(!tb) return;
  tb.innerHTML=rows.map(r=>{
    const sc=r.score??0;
    const tc=r.trend>0?'trend-up':r.trend<0?'trend-dn':'';
    const cc=sc>=70?'gr':sc>=50?'bl':sc>=30?'ye':'re';
    return `<tr>
      <td>${r.name}</td>
      <td>${r.value??'--'}</td>
      <td class="${cc}" style="font-weight:600">${sc}</td>
      <td><div class="score-bar-wrap"><div class="score-bar-fill" style="width:${sc}%;background:${scBarColor(sc)}"></div></div></td>
      <td class="${tc}" style="font-size:11px;color:var(--mu)">${r.trend>0?'상승':r.trend<0?'하락':'유지'}</td>
    </tr>`;
  }).join('');
}

// 기술적
function renderTechnical(d){
  const t=d.api_dashboard_technical||{};
  el('tech-rows').innerHTML=[
    ['RSI (일봉)', f(t.rsiDaily,1)+(t.rsiDaily<=30?' 🟢과매도':t.rsiDaily>=70?' 🔴과매수':''), t.rsiDaily<=30?'gr':t.rsiDaily>=70?'re':''],
    ['RSI (주봉)', f(t.rsiWeekly,1), ''],
    ['RSI (월봉)', f(t.rsiMonthly,1), ''],
    ['MA200 비율', t.ma200Ratio!=null?f(parseFloat(t.ma200Ratio)*100,1)+'%':'--', parseFloat(t.ma200Ratio)>=1?'gr':'re'],
    ['MA200 가격', t.ma200Value!=null?'$'+f(t.ma200Value,0):'--', ''],
    ['MA200 거리', t.ma200DistancePct!=null?sgn(t.ma200DistancePct)+pct(t.ma200DistancePct):'--', parseFloat(t.ma200DistancePct)>=0?'gr':'re'],
    ['역사적 변동성', t.historicalVolatility!=null?pct(parseFloat(t.historicalVolatility)*100):'--', ''],
    ['Pi Cycle 간격', f(t.piCycleGap,0), ''],
    ['MACD', t.macd ? `${f(t.macd.macdLine,0)} / ${f(t.macd.signalLine,0)} (${t.macd.crossLabel||'--'})` : '--', t.macd?.bullish?'gr':'re'],
  ].map(([l,v,c])=>row(l,v,c)).join('');
}

// 심리
function renderSentiment(d){
  const s=d.api_dashboard_sentiment||{};
  el('sent-rows').innerHTML=[
    ['공포탐욕', `${s.fearGreed??'--'} (${fgLabel(s.fearGreed)})`, s.fearGreed<=30?'gr':s.fearGreed>=70?'re':''],
    ['펀딩비', s.fundingRate!=null?(parseFloat(s.fundingRate)*100).toFixed(5)+'%':'--', ''],
    ['7일 누적 펀딩', s.cumulativeFunding7d!=null?pct(s.cumulativeFunding7d,4):'--', ''],
    ['30일 누적 펀딩', s.cumulativeFunding30d!=null?pct(s.cumulativeFunding30d,3):'--', ''],
    ['롱숏 비율', f(s.longShortRatio,2), ''],
    ['미결제약정 비율', f(s.openInterestRatio,2), ''],
    ['테이커 매수/매도', f(s.takerBuySellRatio,2), parseFloat(s.takerBuySellRatio)>=1?'gr':'re'],
    ['Put/Call 비율', f(s.putCallRatio,2), ''],
    ['LTH/STH 비율', f(s.lthSthRatio,2), ''],
  ].map(([l,v,c])=>row(l,v,c)).join('');
}

// 온체인
function renderOnchain(d){
  const o=d.api_dashboard_onchain||{};
  el('chain-rows').innerHTML=[
    ['SOPR', f(o.sopr,4), parseFloat(o.sopr)>=1?'gr':'re'],
    ['NUPL', f(o.nupl,3), parseFloat(o.nupl)>=0?'gr':'re'],
    ['MVRV-Z Score', f(o.mvrvZScore,2), ''],
    ['LTH/STH 비율', f(o.lthSthRatio,2), ''],
    ['거래소 순유입', o.exchangeNetFlow!=null?f(o.exchangeNetFlow,0)+' BTC':'--', parseFloat(o.exchangeNetFlow)>0?'re':'gr'],
    ['거래소 보유량', o.exchangeReserve!=null?f(o.exchangeReserve,0)+' BTC':'--', ''],
    ['Puell Multiple', f(o.puellMultiple,2), ''],
    ['활성 주소', f(o.activeAddresses,0), ''],
    ['해시레이트', o.hashRate!=null?f(o.hashRate,0)+' EH/s':'--', ''],
    ['채굴자 유출', o.minerOutflow!=null?f(o.minerOutflow,0)+' BTC':'--', ''],
  ].map(([l,v,c])=>row(l,v,c)).join('');
}

// 매크로
function renderMacro(d){
  const m=d.api_dashboard_macro||{};
  el('macro-rows').innerHTML=[
    ['DXY', f(m.dxy,2), ''],
    ['S&P 500', f(m.sp500,0), ''],
    ['금 (Gold)', m.goldPrice!=null?'$'+f(m.goldPrice,0):'--', ''],
    ['미국채 10년', m.usTreasury10y!=null?pct(m.usTreasury10y):'--', ''],
    ['김치 프리미엄', m.kimchiPremium!=null?pct(m.kimchiPremium):'--', parseFloat(m.kimchiPremium)>0?'gr':'re'],
    ['스테이블 점유율', m.stablecoinDominance!=null?pct(m.stablecoinDominance):'--', ''],
    ['BTC ETF 순유입', m.btcEtfNetFlow!=null?'$'+f(m.btcEtfNetFlow,0)+'M':'--', parseFloat(m.btcEtfNetFlow)>0?'gr':'re'],
    ['M2 성장률', m.globalM2Growth!=null?pct(m.globalM2Growth):'--', ''],
    ['VIX', f(m.vix,1), parseFloat(m.vix)>25?'re':'gr'],
  ].map(([l,v,c])=>row(l,v,c)).join('');
}

// BTC 차트
function renderBtcChart(d){
  const h=d.api_prism_indices?.entries||[];
  chart('btc-ch', h.map(e=>e.date.slice(5)),
    [{label:'BTC',data:h.map(e=>e.btcClose?parseFloat(e.btcClose):null),
      borderColor:'#f7931a',backgroundColor:'rgba(247,147,26,.07)',fill:true,tension:.3,pointRadius:2}],
    {yFmt:v=>'$'+v.toLocaleString()});
}

// 공포탐욕 차트
function renderFgChart(d){
  const h=d.api_prism_indices?.entries||[];
  chart('fg-ch', h.map(e=>e.date.slice(5)),
    [{label:'공포탐욕',data:h.map(e=>e.fearGreed),
      borderColor:'#58a6ff',backgroundColor:'rgba(88,166,255,.07)',fill:true,tension:.3,pointRadius:2}],
    {yMin:0,yMax:100});
}

// 청산 히트맵
function renderLiquidation(d){
  const l=d.api_dashboard_liquidation_heatmap||{};
  const cc=l.cascadeDirection==='DOWNSIDE'?'re':'gr';
  const sumEl=el('liq-summary');
  if(sumEl) sumEl.innerHTML=`
    ${row('현재 BTC 가격','$'+f(l.currentPrice,0),'')}
    ${row('미결제약정(USD)','$'+f(parseFloat(l.openInterestUsd)/1e9,2)+'B','')}
    ${row('롱 비율',pct(parseFloat(l.longAccountRatio)*100,1),'gr')}
    ${row('숏 비율',pct(parseFloat(l.shortAccountRatio)*100,1),'re')}
    ${row('하방 청산 규모','$'+f(parseFloat(l.downsideLiquidationUsd)/1e9,2)+'B','re')}
    ${row('상방 청산 규모','$'+f(parseFloat(l.upsideLiquidationUsd)/1e9,2)+'B','gr')}
    ${row('캐스케이드 위험',l.cascadeLabel||'--',cc)}`;
  const lvlEl=el('liq-levels');
  if(lvlEl){
    const levels=(l.levels||[]).slice(0,6);
    lvlEl.innerHTML='<div style="font-size:11px;color:var(--mu);margin-bottom:4px">주요 청산 레벨</div>'+
      levels.map(lv=>`<div class="liq-level" style="background:${lv.side==='LONG'?'rgba(248,81,73,.1)':'rgba(63,185,80,.1)'}">
        <span class="${lv.side==='LONG'?'re':'gr'}">${lv.side} L${lv.leverage}x</span>
        <span>$${f(lv.price,0)}</span>
        <span style="color:var(--mu)">$${f(parseFloat(lv.notionalUsd)/1e9,2)}B</span>
      </div>`).join('');
  }
}

// 상관관계
function renderCorrelation(d){
  const c=d.api_dashboard_rolling_correlation||{};
  const colorFor=v=>{ const n=parseFloat(v); return n>0.5?'gr':n<-0.5?'re':'ye'; };
  el('corr-rows').innerHTML=[
    ['BTC vs S&P500', f(c.btcVsSpx,3), colorFor(c.btcVsSpx)],
    ['BTC vs DXY', f(c.btcVsDxy,3), colorFor(c.btcVsDxy)],
    ['BTC vs Gold', f(c.btcVsGold,3), colorFor(c.btcVsGold)],
    ['기간', (c.windowDays||30)+'일', ''],
  ].map(([l,v,c])=>row(l,v,c)).join('');
  const rEl=el('corr-regime');
  if(rEl) rEl.innerHTML=`<span style="font-weight:600;color:var(--bl)">${c.regimeLabel||'--'}</span><br><span style="color:var(--mu)">${c.regimeDescription||''}</span>`;
}

// 옵션
function renderOptions(d){
  const o=d.api_dashboard_options_regime||{};
  el('opt-rows').innerHTML=[
    ['내재 변동성(IV30)', f(o.iv30d,1)+'%', o.ivSignal==='EXTREME_FEAR'?'re':o.ivSignal==='CALM'?'gr':'ye'],
    ['IV 신호', o.ivLabel||'--', ''],
    ['25δ Skew', f(o.skew25d,2)+'%', o.skewSignal?.includes('BULLISH')?'gr':'re'],
    ['Skew 신호', o.skewLabel||'--', o.skewSignal?.includes('BULLISH')?'gr':'re'],
  ].map(([l,v,c])=>row(l,v,c)).join('');
  const ivHist=o.ivHistory||[];
  if(ivHist.length>0){
    chart('iv-ch', ivHist.map(e=>e.date.slice(5)),
      [{label:'IV30d',data:ivHist.map(e=>parseFloat(e.iv)),
        borderColor:'#bc8cff',backgroundColor:'rgba(188,140,255,.07)',fill:true,tension:.3,pointRadius:2}],
      {yFmt:v=>v+'%'});
  }
}

// 순유동성
function renderNetLiquidity(d){
  const n=d.api_dashboard_net_liquidity||{};
  const cc=n.signal==='EXPANDING'?'gr':'re';
  el('nl-rows').innerHTML=[
    ['순유동성(USD)', n.netLiquidityUsdM!=null?'$'+f(parseFloat(n.netLiquidityUsdM)/1e6,2)+'T':'--', ''],
    ['4주 변화', n.change4wUsdM!=null?sgn(n.change4wUsdM)+'$'+f(Math.abs(parseFloat(n.change4wUsdM))/1e3,1)+'B':'--', parseFloat(n.change4wUsdM)>0?'gr':'re'],
    ['4주 변화율', n.change4wPercent!=null?sgn(n.change4wPercent)+pct(n.change4wPercent):'--', parseFloat(n.change4wPercent)>0?'gr':'re'],
    ['연준 자산', n.fedAssetsUsdM!=null?'$'+f(parseFloat(n.fedAssetsUsdM)/1e6,2)+'T':'--', ''],
    ['재무부 잔고', n.treasuryAccountUsdM!=null?'$'+f(parseFloat(n.treasuryAccountUsdM)/1e3,1)+'B':'--', ''],
    ['신호', n.signalLabel||'--', cc],
    ['해석', n.signalDescription||'--', ''],
  ].map(([l,v,c])=>row(l,v,c)).join('');
}

// 스테이블코인
function renderStablecoin(d){
  const s=d.api_dashboard_stablecoin_supply||{};
  const cc=s.signal==='EXPANDING'?'gr':s.signal==='CONTRACTING'?'re':'ye';
  el('stbl-rows').innerHTML=[
    ['총 시총(USD)', s.totalMarketCapUsd!=null?'$'+f(parseFloat(s.totalMarketCapUsd)/1e9,1)+'B':'--', ''],
    ['30일 전 시총', s.marketCap30dAgoUsd!=null?'$'+f(parseFloat(s.marketCap30dAgoUsd)/1e9,1)+'B':'--', ''],
    ['30일 성장률', s.growth30dPercent!=null?sgn(s.growth30dPercent)+pct(s.growth30dPercent):'--', parseFloat(s.growth30dPercent)>0?'gr':'re'],
    ['신호', s.signalLabel||'--', cc],
    ['해석', s.signalDescription||'--', ''],
  ].map(([l,v,c])=>row(l,v,c)).join('');
}

// 예측
function renderForecast(d){
  const fc=d.api_dashboard_forecast||{};
  el('fc-rows').innerHTML=[
    ['오늘 점수', fc.todayScore??'--', ''],
    ['예측 점수', fc.predictedScore??'--', fc.predictedScore>fc.todayScore?'gr':'re'],
    ['변화', fc.scoreDiff!=null?(fc.scoreDiff>0?'+':'')+fc.scoreDiff:'--', fc.scoreDiff>0?'gr':'re'],
    ['신뢰도 R²', f(fc.r2,3), ''],
    ['신뢰 구간', fc.confidenceLow!=null?`${fc.confidenceLow}~${fc.confidenceHigh}`:'--', ''],
  ].map(([l,v,c])=>row(l,v,c)).join('');
}

// 고래
function renderWhale(d){
  const w=d.api_dashboard_whale_activity||{};
  const cc=w.signal==='ACCUMULATING'?'gr':w.signal==='DISTRIBUTING'?'re':'ye';
  el('whale-rows').innerHTML=[
    ['활동 레벨', w.activityLevel||'--', ''],
    ['신호', w.signal||'--', cc],
    ['7일 순유입', w.netFlowSum7d!=null?f(w.netFlowSum7d,0)+' BTC':'--', parseFloat(w.netFlowSum7d)>0?'re':'gr'],
    ['7일 보유 변화', w.reserveChange7d!=null?sgn(w.reserveChange7d)+f(w.reserveChange7d,0)+' BTC':'--', ''],
  ].map(([l,v,c])=>row(l,v,c)).join('');
}

// 시장구조
function renderStructure(d){
  const s=d.api_dashboard_market_structure||{};
  const cc=s.structure?.includes('강세')?'gr':s.structure?.includes('약세')?'re':'ye';
  el('str-rows').innerHTML=[
    ['구조', s.structure||'--', cc],
    ['직전 고점', s.lastHigh!=null?'$'+f(s.lastHigh,0):'--', ''],
    ['직전 저점', s.lastLow!=null?'$'+f(s.lastLow,0):'--', ''],
    ['다음 저항', s.nextResistance!=null?'$'+f(s.nextResistance,0):'--', 're'],
    ['다음 지지', s.nextSupport!=null?'$'+f(s.nextSupport,0):'--', 'gr'],
  ].map(([l,v,c])=>row(l,v,c)).join('');
}

// 알트코인 + 비유동
function renderAltRows(d){
  const alt=d.api_dashboard_altcoin||{}, il=d.api_dashboard_illiquid_supply||{};
  el('alt-rows').innerHTML=[
    ['알트시즌 지수', f(alt.altSeasonIndex,0), ''],
    ['알트시즌 레이블', alt.altseasonLabel||'--', ''],
    ['BTC 도미넌스', alt.btcDominance!=null?alt.btcDominance+'%':'--', ''],
    ['ETH/BTC', f(alt.ethBtcPerformance,4), ''],
    ['비유동 공급 비율', il.percentFormatted||'--', ''],
    ['비유동 신호', il.label||'--', ''],
  ].map(([l,v,c])=>row(l,v,c)).join('');
}

// 타이밍
function renderTiming(d){
  const t=d.api_dashboard_buy_timing||{}, m=d.api_dashboard||{};
  el('timing-rows').innerHTML=[
    ['시장 국면', t.marketSeason||'--', ''],
    ['권장 포지션', t.positionSizePct!=null?pct(t.positionSizePct,0):'--', ''],
    ['DCA 분할', t.dcaSplits!=null?t.dcaSplits+'회':'--', ''],
    ['DCA 간격', t.dcaIntervalDays!=null?t.dcaIntervalDays+'일':'--', ''],
    ['목표가', t.targetPrice!=null?'$'+f(t.targetPrice,0):'--', 'gr'],
    ['손절가', t.stopLossPrice!=null?'$'+f(t.stopLossPrice,0):'--', 're'],
    ['반감기 경과', m.halvingDaysAfter!=null?m.halvingDaysAfter+'일':'--', ''],
    ['반감기 단계', m.halvingPhase||'--', ''],
  ].map(([l,v,c])=>row(l,v,c)).join('');
}

// 체크리스트
function renderChecklist(d){
  const c=d.api_dashboard_checklist||{};
  const p=c.passedCount!=null?Math.round(c.passedCount/c.totalCount*100):0;
  const pEl=el('chk-prog');
  if(pEl) pEl.innerHTML=`
    <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--mu);margin-bottom:4px">
      <span>${c.levelLabel||''}</span><span>${c.passedCount}/${c.totalCount} (${p}%)</span>
    </div>
    <div class="prog"><div class="prog-fill" style="width:${p}%;background:${p>=70?'#3fb950':p>=40?'#e3b341':'#f85149'}"></div></div>
    <p style="font-size:11px;color:var(--mu);margin-top:5px">${c.levelDescription||''}</p>`;
  const iEl=el('chk-items');
  if(iEl) iEl.innerHTML=(c.items||[]).map(item=>`
    <div class="chk">
      <span>${item.passed?'✅':'❌'}</span>
      <span style="color:${item.passed?'var(--tx)':'var(--mu)'}">${item.name||item.label||'--'}${item.reason?` <span style="color:var(--mu);font-size:11px">— ${item.reason}</span>`:''}</span>
    </div>`).join('');
}

// 지표 분해
function renderBreakdown(d){
  const bd=d.api_dashboard?.indicatorBreakdown||{};
  const el_=el('breakdown'); if(!el_) return;
  el_.innerHTML=Object.entries(bd).map(([k,v])=>{
    const c=v>=70?'#3fb950':v>=50?'#58a6ff':v>=30?'#e3b341':'#f85149';
    return `<div style="background:var(--sf2);border-radius:6px;padding:7px 10px;display:flex;justify-content:space-between;align-items:center;font-size:12px">
      <span style="color:var(--mu)">${k}</span>
      <span style="color:${c};font-weight:700">${v}</span>
    </div>`;
  }).join('');
}

init();
