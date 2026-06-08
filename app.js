const DATA = './data/snapshot.json';
const f=(v,d=2)=>{if(v==null||v==='')return '--';const n=parseFloat(v);return isNaN(n)?v:n.toLocaleString('ko-KR',{maximumFractionDigits:d,minimumFractionDigits:d})};
const pct=(v,d=2)=>v==null?'--':f(v,d)+'%';
const sgn=(v)=>parseFloat(v)>0?'+':'';
const el=(id)=>document.getElementById(id);
const txt=(id,s)=>{const e=el(id);if(e)e.textContent=s};

function sc(score){
  if(score>=70)return{cls:'gr',glow:'glow-gr',ring:'ring-gr',badge:'bg-gr bdr-gr',label:'강한 매집'};
  if(score>=55)return{cls:'bl',glow:'glow-bl',ring:'ring-bl',badge:'bg-bl bdr-bl',label:'완만한 매집'};
  if(score>=40)return{cls:'ye',glow:'glow-ye',ring:'ring-ye',badge:'bg-ye bdr-ye',label:'관망'};
  return{cls:'re',glow:'glow-re',ring:'ring-re',badge:'bg-re bdr-re',label:'약세 주의'};
}
function scBar(s){return s>=70?'#00d97e':s>=55?'#4e9fff':s>=40?'#ffd32a':'#ff4757'}
function fgLbl(v){if(v==null)return'';if(v<=20)return'극도 공포';if(v<=40)return'공포';if(v<=60)return'중립';if(v<=80)return'탐욕';return'극도 탐욕'}
function row(l,v,c=''){return`<div class="row"><span class="rl">${l}</span><span class="rv ${c}">${v}</span></div>`}

function mkChart(id,labels,datasets,opts={}){
  const ctx=el(id);if(!ctx)return;
  new Chart(ctx,{
    type:opts.type||'line',
    data:{labels,datasets},
    options:{
      responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:opts.legend||false},tooltip:{backgroundColor:'rgba(15,23,36,.95)',titleColor:'#e8f0fe',bodyColor:'#6b84a8',borderColor:'#1e2d45',borderWidth:1,padding:10,cornerRadius:8}},
      scales:{
        x:{ticks:{color:'#6b84a8',maxTicksLimit:opts.maxX||8,font:{size:11}},grid:{color:'rgba(30,45,69,.5)'}},
        y:{ticks:{color:'#6b84a8',callback:opts.yFmt||(v=>v),font:{size:11}},grid:{color:'rgba(30,45,69,.5)'},min:opts.yMin,max:opts.yMax}
      },...(opts.extra||{})
    }
  });
}

async function init(){
  let snap;
  try{const r=await fetch(DATA+'?t='+Date.now());snap=await r.json()}
  catch(e){el('loading').textContent='로드 실패: '+e.message;return}
  el('loading').style.display='none';
  el('main').style.display='flex';
  const upd=new Date(snap.updatedAt);
  el('upd').textContent='갱신 '+upd.toLocaleString('ko-KR',{timeZone:'Asia/Seoul',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})+' KST';
  el('upd').classList.remove('pulse');
  const d=snap.data;
  renderHero(d);renderKpi(d);renderScoreChart(d);renderExpert(d);
  renderBtcChart(d);renderFgChart(d);
  renderIndTable(d);
  renderTechnical(d);renderSentiment(d);renderOnchain(d);renderMacro(d);
  renderLiquidation(d);renderCorrelation(d);renderOptions(d);
  renderNetLiquidity(d);renderStablecoin(d);
  renderTiming(d);renderChecklist(d);
  renderForecast(d);renderWhale(d);renderStructure(d);renderAltRows(d);
  renderBreakdown(d);
}

function renderHero(d){
  const m=d.api_dashboard||{},t=d.api_dashboard_buy_timing||{};
  const s=m.score,{cls,glow,ring,badge,label}=sc(s);
  txt('h-score',s??'--');
  const r=el('ring');r.classList.add(ring,glow);
  el('h-badge').textContent=m.signalDisplay||label;
  el('h-badge').className=`hero-badge ${badge}`;
  el('h-badge').style.color='white';
  el('h-title')?.remove();
  txt('h-action',t.actionLabel||m.signalDisplay||'--');
  const act=el('h-action');if(act){act.style.backgroundImage=`linear-gradient(90deg,white,${cls==='gr'?'#00d97e':cls==='bl'?'#4e9fff':cls==='ye'?'#ffd32a':'#ff4757'})`;act.style['-webkit-background-clip']='text';act.style['-webkit-text-fill-color']='transparent'}
  txt('h-reason',t.actionReason||'');
  txt('hs-btc',m.btcClose?'$'+f(m.btcClose,0):'--');
  txt('hs-date',m.dataDate||'');
  const fgEl=el('hs-fg');if(fgEl){fgEl.textContent=m.fearGreed??'--';fgEl.className='hs-val '+(m.fearGreed<=30?'gr':m.fearGreed>=70?'re':'')}
  txt('hs-fg-h',fgLbl(m.fearGreed));
}

function renderKpi(d){
  const m=d.api_dashboard||{},chk=d.api_dashboard_checklist||{},sys=d.api_dashboard_system||{},fc=d.api_dashboard_forecast||{};
  const dEl=el('k-delta');if(dEl){dEl.textContent=m.scoreDelta!=null?(m.scoreDelta>0?'+':'')+m.scoreDelta:'--';dEl.className='val '+(m.scoreDelta>0?'gr':m.scoreDelta<0?'re':'')}
  txt('k-avg',`주간 ${m.weeklyAverageScore??'--'} · 월간 ${m.monthlyAverageScore??'--'}`);
  const rm=sys.regimeMatrix||{};
  const qEl=el('k-quad');if(qEl){qEl.textContent=rm.label||'--';qEl.className='val '+(rm.color==='green'?'gr':rm.color==='red'?'re':'ye')}
  txt('k-quad-h',rm.description||'');
  txt('k-chk',chk.passedCount!=null?`${chk.passedCount} / ${chk.totalCount}`:'--');
  txt('k-chk-h',chk.levelLabel||'');
  const fcEl=el('k-fc');if(fcEl){fcEl.textContent=fc.predictedScore??'--';fcEl.className='val '+(fc.predictedScore>fc.todayScore?'gr':'re')}
  txt('k-fc-h',fc.scoreDiff!=null?(fc.scoreDiff>0?'+':'')+fc.scoreDiff+' 예상':(fc.confidenceLow?`구간 ${fc.confidenceLow}~${fc.confidenceHigh}`:''));
  txt('k-halv',m.halvingDaysAfter!=null?m.halvingDaysAfter+'일':'--');
  txt('k-halv-h',m.halvingPhase||'');
}

function renderScoreChart(d){
  const h=d.api_prism_indices?.entries||[];
  const vals=h.map(e=>e.readinessScore);
  mkChart('score-ch',h.map(e=>e.date.slice(5)),[{
    label:'점수',data:vals,
    backgroundColor:vals.map(v=>scBar(v)+'cc'),
    borderColor:vals.map(scBar),
    borderWidth:1,borderRadius:4,
  }],{type:'bar',yMin:0,yMax:100});
}

function renderExpert(d){
  const ex=d.api_dashboard_expert_opinion||{};
  const c=ex.verdictColor==='green'?'gr':ex.verdictColor==='red'?'re':'ye';
  const vEl=el('ex-verdict');if(vEl){vEl.textContent=ex.verdict||'--';vEl.className='rv '+c;vEl.style.fontSize='14px';vEl.style.fontWeight='700'}
  txt('ex-sum',ex.summary||'');
  const wEl=el('ex-watch');if(wEl&&ex.keyWatch){wEl.innerHTML=`👁 ${ex.keyWatch}`}else if(wEl){wEl.style.display='none'}
  const list=el('ex-sigs');if(!list)return;
  const sigs=[...(ex.bullishSignals||[]).map(s=>({t:s,c:'gr'})),...(ex.bearishSignals||[]).map(s=>({t:s,c:'re'})),...(ex.neutralSignals||[]).map(s=>({t:s,c:'ye'}))].slice(0,10);
  list.innerHTML=sigs.map(s=>`<div class="sig"><div class="sig-dot" style="background:var(--${s.c})"></div><span style="color:${s.c==='gr'?'var(--tx)':s.c==='re'?'var(--mu)':'var(--mu)'}; color:var(--tx)">${s.t}</span></div>`).join('');
}

function renderBtcChart(d){
  const h=d.api_prism_indices?.entries||[];
  mkChart('btc-ch',h.map(e=>e.date.slice(5)),[{
    label:'BTC(USD)',data:h.map(e=>e.btcClose?parseFloat(e.btcClose):null),
    borderColor:'#f7931a',backgroundColor:'rgba(247,147,26,.06)',
    fill:true,tension:.4,pointRadius:0,pointHoverRadius:5,borderWidth:2
  }],{yFmt:v=>'$'+Math.round(v).toLocaleString()});
}

function renderFgChart(d){
  const h=d.api_prism_indices?.entries||[];
  const vals=h.map(e=>e.fearGreed);
  mkChart('fg-ch',h.map(e=>e.date.slice(5)),[{
    label:'공포탐욕',data:vals,
    borderColor:'#4e9fff',backgroundColor:(ctx)=>{
      const g=ctx.chart.ctx.createLinearGradient(0,0,0,280);
      g.addColorStop(0,'rgba(78,159,255,.25)');g.addColorStop(1,'rgba(78,159,255,0)');return g;
    },
    fill:true,tension:.4,pointRadius:0,pointHoverRadius:5,borderWidth:2
  }],{yMin:0,yMax:100});
}

function renderIndTable(d){
  const rows=d.api_dashboard_system?.indicatorRows||[];
  const tb=el('ind-table');if(!tb)return;
  tb.innerHTML=rows.map(r=>{
    const s=r.score??0,tc=r.trend>0?'↑':r.trend<0?'↓':'—';
    const cc=s>=70?'gr':s>=50?'bl':s>=30?'ye':'re';
    return`<tr>
      <td style="font-weight:500">${r.name}</td>
      <td style="color:var(--mu)">${r.value??'--'}</td>
      <td class="${cc}" style="font-weight:700;font-size:13px">${s}</td>
      <td><div class="sbar"><div class="sbar-fill" style="width:${s}%;background:${scBar(s)}"></div></div></td>
      <td style="color:${r.trend>0?'var(--gr)':r.trend<0?'var(--re)':'var(--mu2)'};font-size:13px;font-weight:600">${tc}</td>
    </tr>`;
  }).join('');
}

function renderTechnical(d){
  const t=d.api_dashboard_technical||{};
  el('tech-rows').innerHTML=[
    ['RSI (일봉)',f(t.rsiDaily,1)+(t.rsiDaily<=30?' — 과매도':t.rsiDaily>=70?' — 과매수':''),t.rsiDaily<=30?'gr':t.rsiDaily>=70?'re':''],
    ['RSI (주봉)',f(t.rsiWeekly,1),''],['RSI (월봉)',f(t.rsiMonthly,1),''],
    ['MA200 비율',t.ma200Ratio?f(parseFloat(t.ma200Ratio)*100,1)+'%':'--',parseFloat(t.ma200Ratio)>=1?'gr':'re'],
    ['MA200 가격',t.ma200Value?'$'+f(t.ma200Value,0):'--',''],
    ['MA200 거리',t.ma200DistancePct?sgn(t.ma200DistancePct)+pct(t.ma200DistancePct):'--',parseFloat(t.ma200DistancePct)>=0?'gr':'re'],
    ['역사적 변동성',t.historicalVolatility?pct(parseFloat(t.historicalVolatility)*100):'--',''],
    ['Pi Cycle 간격',f(t.piCycleGap,0),''],
    ['MACD',t.macd?`${f(t.macd.macdLine,0)} (${t.macd.crossLabel||'--'})`:'--, ',t.macd?.bullish?'gr':'re'],
  ].map(([l,v,c])=>row(l,v,c)).join('');
}

function renderSentiment(d){
  const s=d.api_dashboard_sentiment||{};
  el('sent-rows').innerHTML=[
    ['공포탐욕',`${s.fearGreed??'--'} — ${fgLbl(s.fearGreed)}`,s.fearGreed<=30?'gr':s.fearGreed>=70?'re':''],
    ['펀딩비',s.fundingRate?(parseFloat(s.fundingRate)*100).toFixed(5)+'%':'--',''],
    ['7일 누적펀딩',s.cumulativeFunding7d?pct(s.cumulativeFunding7d,4):'--',''],
    ['30일 누적펀딩',s.cumulativeFunding30d?pct(s.cumulativeFunding30d,3):'--',''],
    ['롱/숏 비율',f(s.longShortRatio,2),''],
    ['미결제약정 비율',f(s.openInterestRatio,2),''],
    ['테이커 매수/매도',f(s.takerBuySellRatio,2),parseFloat(s.takerBuySellRatio)>=1?'gr':'re'],
    ['Put/Call 비율',f(s.putCallRatio,2),''],
    ['LTH/STH 비율',f(s.lthSthRatio,2),''],
  ].map(([l,v,c])=>row(l,v,c)).join('');
}

function renderOnchain(d){
  const o=d.api_dashboard_onchain||{};
  el('chain-rows').innerHTML=[
    ['SOPR',f(o.sopr,4),parseFloat(o.sopr)>=1?'gr':'re'],
    ['NUPL',f(o.nupl,3),parseFloat(o.nupl)>=0?'gr':'re'],
    ['MVRV-Z Score',f(o.mvrvZScore,2),''],
    ['LTH/STH 비율',f(o.lthSthRatio,2),''],
    ['거래소 순유입',o.exchangeNetFlow?f(o.exchangeNetFlow,0)+' BTC':'--',parseFloat(o.exchangeNetFlow)>0?'re':'gr'],
    ['거래소 보유량',o.exchangeReserve?f(o.exchangeReserve,0)+' BTC':'--',''],
    ['Puell Multiple',f(o.puellMultiple,2),''],
    ['활성 주소',f(o.activeAddresses,0),''],
    ['해시레이트',o.hashRate?f(o.hashRate,0)+' EH/s':'--',''],
    ['채굴자 유출',o.minerOutflow?f(o.minerOutflow,0)+' BTC':'--',''],
  ].map(([l,v,c])=>row(l,v,c)).join('');
}

function renderMacro(d){
  const m=d.api_dashboard_macro||{};
  el('macro-rows').innerHTML=[
    ['DXY',f(m.dxy,2),''],['S&P 500',f(m.sp500,0),''],
    ['금 (Gold)','$'+f(m.goldPrice,0),''],
    ['미국채 10년',m.usTreasury10y?pct(m.usTreasury10y):'--',''],
    ['김치 프리미엄',m.kimchiPremium?pct(m.kimchiPremium):'--',parseFloat(m.kimchiPremium)>0?'gr':'re'],
    ['스테이블 점유율',m.stablecoinDominance?pct(m.stablecoinDominance):'--',''],
    ['BTC ETF 순유입',m.btcEtfNetFlow?'$'+f(m.btcEtfNetFlow,0)+'M':'--',parseFloat(m.btcEtfNetFlow)>0?'gr':'re'],
    ['M2 성장률',m.globalM2Growth?pct(m.globalM2Growth):'--',''],
    ['VIX',f(m.vix,1),parseFloat(m.vix)>25?'re':'gr'],
  ].map(([l,v,c])=>row(l,v,c)).join('');
}

function renderLiquidation(d){
  const l=d.api_dashboard_liquidation_heatmap||{};
  const cc=l.cascadeDirection==='DOWNSIDE'?'re':'gr';
  el('liq-summary').innerHTML=[
    ['현재 BTC','$'+f(l.currentPrice,0),''],
    ['미결제약정','$'+f(parseFloat(l.openInterestUsd||0)/1e9,2)+'B',''],
    ['롱 비율',pct(parseFloat(l.longAccountRatio||0)*100,1),'gr'],
    ['숏 비율',pct(parseFloat(l.shortAccountRatio||0)*100,1),'re'],
    ['하방 청산','$'+f(parseFloat(l.downsideLiquidationUsd||0)/1e9,2)+'B','re'],
    ['상방 청산','$'+f(parseFloat(l.upsideLiquidationUsd||0)/1e9,2)+'B','gr'],
    ['캐스케이드',l.cascadeLabel||'--',cc],
  ].map(([l,v,c])=>row(l,v,c)).join('');
  el('liq-levels').innerHTML='<div style="font-size:11px;color:var(--mu);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">주요 청산 레벨</div>'+
    (l.levels||[]).slice(0,6).map(lv=>`
    <div class="liq-lvl ${lv.side==='LONG'?'bg-re bdr-re':'bg-gr bdr-gr'}">
      <span class="${lv.side==='LONG'?'re':'gr'}" style="font-weight:700">${lv.side} L${lv.leverage}×</span>
      <span style="font-weight:600">$${f(lv.price,0)}</span>
      <span style="color:var(--mu)">$${f(parseFloat(lv.notionalUsd||0)/1e9,2)}B</span>
    </div>`).join('');
}

function renderCorrelation(d){
  const c=d.api_dashboard_rolling_correlation||{};
  const cf=v=>{const n=parseFloat(v);return n>0.5?'gr':n<-0.5?'re':'ye'};
  el('corr-rows').innerHTML=[
    ['BTC vs S&P500',f(c.btcVsSpx,3),cf(c.btcVsSpx)],
    ['BTC vs DXY',f(c.btcVsDxy,3),cf(c.btcVsDxy)],
    ['BTC vs Gold',f(c.btcVsGold,3),cf(c.btcVsGold)],
    ['측정 기간',(c.windowDays||30)+'일',''],
  ].map(([l,v,c])=>row(l,v,c)).join('');
  const rEl=el('corr-regime');
  if(rEl)rEl.innerHTML=`<span style="font-weight:700;color:var(--bl);font-size:13px">${c.regimeLabel||'--'}</span><br><span style="color:var(--mu)">${c.regimeDescription||''}</span>`;
}

function renderOptions(d){
  const o=d.api_dashboard_options_regime||{};
  el('opt-rows').innerHTML=[
    ['내재변동성(IV30)',f(o.iv30d,1)+'%',o.ivSignal==='EXTREME_FEAR'?'re':o.ivSignal==='CALM'?'gr':'ye'],
    ['IV 신호',o.ivLabel||'--',''],
    ['25δ Skew',f(o.skew25d,2)+'%',o.skewSignal?.includes('BULLISH')?'gr':'re'],
    ['Skew 신호',o.skewLabel||'--',o.skewSignal?.includes('BULLISH')?'gr':'re'],
  ].map(([l,v,c])=>row(l,v,c)).join('');
  const ivH=o.ivHistory||[];
  if(ivH.length>0){
    mkChart('iv-ch',ivH.map(e=>e.date.slice(5)),[{
      label:'IV30d',data:ivH.map(e=>parseFloat(e.iv)),
      borderColor:'#a855f7',
      backgroundColor:(ctx)=>{const g=ctx.chart.ctx.createLinearGradient(0,0,0,200);g.addColorStop(0,'rgba(168,85,247,.2)');g.addColorStop(1,'rgba(168,85,247,0)');return g},
      fill:true,tension:.4,pointRadius:0,borderWidth:2
    }],{yFmt:v=>v+'%'});
  }
}

function renderNetLiquidity(d){
  const n=d.api_dashboard_net_liquidity||{};
  el('nl-rows').innerHTML=[
    ['순유동성',n.netLiquidityUsdM?'$'+f(parseFloat(n.netLiquidityUsdM)/1e6,2)+'T':'--',''],
    ['4주 변화',n.change4wUsdM?sgn(n.change4wUsdM)+'$'+f(Math.abs(parseFloat(n.change4wUsdM))/1e3,1)+'B':'--',parseFloat(n.change4wUsdM)>0?'gr':'re'],
    ['4주 변화율',n.change4wPercent?sgn(n.change4wPercent)+pct(n.change4wPercent):'--',parseFloat(n.change4wPercent)>0?'gr':'re'],
    ['연준 자산',n.fedAssetsUsdM?'$'+f(parseFloat(n.fedAssetsUsdM)/1e6,2)+'T':'--',''],
    ['재무부 잔고',n.treasuryAccountUsdM?'$'+f(parseFloat(n.treasuryAccountUsdM)/1e3,1)+'B':'--',''],
    ['신호',n.signalLabel||'--',n.signal==='EXPANDING'?'gr':'re'],
    ['해석',n.signalDescription||'--',''],
  ].map(([l,v,c])=>row(l,v,c)).join('');
}

function renderStablecoin(d){
  const s=d.api_dashboard_stablecoin_supply||{};
  el('stbl-rows').innerHTML=[
    ['총 시총','$'+f(parseFloat(s.totalMarketCapUsd||0)/1e9,1)+'B',''],
    ['30일 전 시총','$'+f(parseFloat(s.marketCap30dAgoUsd||0)/1e9,1)+'B',''],
    ['30일 성장률',s.growth30dPercent?sgn(s.growth30dPercent)+pct(s.growth30dPercent):'--',parseFloat(s.growth30dPercent)>0?'gr':'re'],
    ['신호',s.signalLabel||'--',s.signal==='EXPANDING'?'gr':s.signal==='CONTRACTING'?'re':'ye'],
    ['해석',s.signalDescription||'--',''],
  ].map(([l,v,c])=>row(l,v,c)).join('');
}

function renderTiming(d){
  const t=d.api_dashboard_buy_timing||{},m=d.api_dashboard||{};
  el('timing-rows').innerHTML=[
    ['시장 국면',t.marketSeason||'--',''],
    ['권장 포지션',t.positionSizePct?pct(t.positionSizePct,0):'--',''],
    ['DCA 분할',t.dcaSplits?t.dcaSplits+'회':'--',''],
    ['DCA 간격',t.dcaIntervalDays?t.dcaIntervalDays+'일':'--',''],
    ['목표가',t.targetPrice?'$'+f(t.targetPrice,0):'--','gr'],
    ['손절가',t.stopLossPrice?'$'+f(t.stopLossPrice,0):'--','re'],
    ['반감기 경과',m.halvingDaysAfter?m.halvingDaysAfter+'일':'--',''],
    ['반감기 단계',m.halvingPhase||'--',''],
  ].map(([l,v,c])=>row(l,v,c)).join('');
}

function renderChecklist(d){
  const c=d.api_dashboard_checklist||{};
  const p=c.passedCount!=null?Math.round(c.passedCount/c.totalCount*100):0;
  const barC=p>=70?'#00d97e':p>=40?'#ffd32a':'#ff4757';
  el('chk-prog').innerHTML=`
    <div style="display:flex;justify-content:space-between;margin-bottom:6px">
      <span style="font-size:13px;font-weight:700;color:${barC}">${c.levelLabel||''}</span>
      <span style="color:var(--mu);font-size:12px">${c.passedCount}/${c.totalCount} (${p}%)</span>
    </div>
    <div class="prog"><div class="prog-fill" style="width:${p}%;background:${barC}"></div></div>
    <p style="font-size:11px;color:var(--mu);margin-top:8px">${c.levelDescription||''}</p>`;
  el('chk-items').innerHTML=(c.items||[]).map(item=>`
    <div class="chk">
      <span style="font-size:15px;flex-shrink:0">${item.passed?'✅':'❌'}</span>
      <span>
        <span style="color:${item.passed?'var(--tx)':'var(--mu)'}; font-weight:${item.passed?600:400}">${item.name||item.label||'--'}</span>
        ${item.reason?`<br><span style="color:var(--mu2);font-size:11px">${item.reason}</span>`:''}
      </span>
    </div>`).join('');
}

function renderForecast(d){
  const fc=d.api_dashboard_forecast||{};
  el('fc-rows').innerHTML=[
    ['오늘 점수',fc.todayScore??'--',''],
    ['예측 점수',fc.predictedScore??'--',fc.predictedScore>fc.todayScore?'gr':'re'],
    ['변화',fc.scoreDiff!=null?(fc.scoreDiff>0?'+':'')+fc.scoreDiff:'--',fc.scoreDiff>0?'gr':'re'],
    ['신뢰도 R²',f(fc.r2,3),''],
    ['신뢰 구간',fc.confidenceLow?`${fc.confidenceLow} ~ ${fc.confidenceHigh}`:'--',''],
  ].map(([l,v,c])=>row(l,v,c)).join('');
}

function renderWhale(d){
  const w=d.api_dashboard_whale_activity||{};
  const cc=w.signal==='ACCUMULATING'?'gr':w.signal==='DISTRIBUTING'?'re':'ye';
  el('whale-rows').innerHTML=[
    ['활동 레벨',w.activityLevel||'--',''],
    ['신호',w.signal||'--',cc],
    ['7일 순유입',w.netFlowSum7d?f(w.netFlowSum7d,0)+' BTC':'--',parseFloat(w.netFlowSum7d)>0?'re':'gr'],
    ['7일 보유 변화',w.reserveChange7d?sgn(w.reserveChange7d)+f(w.reserveChange7d,0)+' BTC':'--',''],
  ].map(([l,v,c])=>row(l,v,c)).join('');
}

function renderStructure(d){
  const s=d.api_dashboard_market_structure||{};
  const cc=s.structure?.includes('강세')?'gr':s.structure?.includes('약세')?'re':'ye';
  el('str-rows').innerHTML=[
    ['구조',s.structure||'--',cc],
    ['직전 고점',s.lastHigh?'$'+f(s.lastHigh,0):'--',''],
    ['직전 저점',s.lastLow?'$'+f(s.lastLow,0):'--',''],
    ['다음 저항',s.nextResistance?'$'+f(s.nextResistance,0):'--','re'],
    ['다음 지지',s.nextSupport?'$'+f(s.nextSupport,0):'--','gr'],
  ].map(([l,v,c])=>row(l,v,c)).join('');
}

function renderAltRows(d){
  const a=d.api_dashboard_altcoin||{},il=d.api_dashboard_illiquid_supply||{};
  el('alt-rows').innerHTML=[
    ['알트시즌 지수',f(a.altSeasonIndex,0),''],
    ['알트시즌 레이블',a.altseasonLabel||'--',''],
    ['BTC 도미넌스',a.btcDominance?a.btcDominance+'%':'--',''],
    ['ETH/BTC',f(a.ethBtcPerformance,4),''],
    ['비유동 공급 비율',il.percentFormatted||'--',''],
    ['비유동 신호',il.label||'--',''],
  ].map(([l,v,c])=>row(l,v,c)).join('');
}

function renderBreakdown(d){
  const bd=d.api_dashboard?.indicatorBreakdown||{};
  const c=el('breakdown');if(!c)return;
  c.innerHTML=Object.entries(bd).map(([k,v])=>{
    const col=scBar(v);const pct=v;
    return`<div style="background:var(--sf2);border:1px solid var(--bd);border-radius:8px;padding:10px 12px;display:flex;flex-direction:column;gap:6px">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="color:var(--mu);font-size:12px">${k}</span>
        <span style="color:${col};font-weight:800;font-size:15px">${v}</span>
      </div>
      <div class="prog"><div class="prog-fill" style="width:${pct}%;background:${col}"></div></div>
    </div>`;
  }).join('');
}

init();
