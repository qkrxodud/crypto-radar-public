// ── 섹션 접기/펼치기 ──────────────────────────────────────────────────
function toggleSec(id){
  const body=document.getElementById(id);
  const btn=document.getElementById('btn-'+id);
  if(!body||!btn)return;
  const isOpen=body.classList.contains('open');
  body.classList.toggle('open',!isOpen);
  btn.textContent=isOpen?'▼ 자세히 보기':'▲ 접기';
}

// ── 파티클 배경 ──────────────────────────────────────────────────────
(function particles(){
  const canvas=document.getElementById('particles'),ctx=canvas.getContext('2d');
  let W,H,dots=[];
  function resize(){W=canvas.width=window.innerWidth;H=canvas.height=window.innerHeight}
  resize();window.addEventListener('resize',resize);
  for(let i=0;i<60;i++)dots.push({x:Math.random()*9999,y:Math.random()*9999,r:Math.random()*1.2+.3,vx:(Math.random()-.5)*.15,vy:(Math.random()-.5)*.15,o:Math.random()*.4+.1});
  function draw(){
    ctx.clearRect(0,0,W,H);
    dots.forEach(d=>{d.x+=d.vx;d.y+=d.vy;if(d.x<0)d.x=W;if(d.x>W)d.x=0;if(d.y<0)d.y=H;if(d.y>H)d.y=0;ctx.beginPath();ctx.arc(d.x%W,d.y%H,d.r,0,Math.PI*2);ctx.fillStyle=`rgba(59,158,255,${d.o})`;ctx.fill()});
    requestAnimationFrame(draw);
  }
  draw();
})();

// ── 유틸 ──────────────────────────────────────────────────────────────
const f=(v,d=2)=>{if(v==null||v==='')return '--';const n=parseFloat(v);return isNaN(n)?v:n.toLocaleString('ko-KR',{maximumFractionDigits:d,minimumFractionDigits:d})};
const pct=(v,d=2)=>v==null?'--':f(v,d)+'%';
const sgn=(v)=>parseFloat(v)>0?'+':'';
const el=id=>document.getElementById(id);
const txt=(id,s)=>{const e=el(id);if(e)e.textContent=s};

function sc(score){
  if(score>=70)return{cls:'gr',stroke:'#00e57a',glow:'glow-gr',badge:'bg-gr',label:'지금 사기 좋은 때예요'};
  if(score>=55)return{cls:'bl',stroke:'#3b9eff',glow:'glow-bl',badge:'bg-bl',label:'조금씩 담아볼 만해요'};
  if(score>=40)return{cls:'ye',stroke:'#ffcc00',glow:'glow-ye',badge:'bg-ye',label:'지켜보는 게 좋아요'};
  return{cls:'re',stroke:'#ff3d5a',glow:'glow-re',badge:'bg-re',label:'조심하는 게 좋아요'};
}
function scBar(s){return s>=70?'#00e57a':s>=55?'#3b9eff':s>=40?'#ffcc00':'#ff3d5a'}
function fgLbl(v){if(v==null)return'';if(v<=20)return'극도 공포';if(v<=40)return'공포';if(v<=60)return'중립';if(v<=80)return'탐욕';return'극도 탐욕'}
function row(l,v,c=''){return`<div class="row"><span class="rl">${l}</span><span class="rv ${c}">${v}</span></div>`}

// ── 숫자 카운트업 ──────────────────────────────────────────────────────
function countUp(el,from,to,dur=800,fmt=(n)=>Math.round(n).toLocaleString('ko-KR')){
  const start=performance.now();
  function step(now){
    const p=Math.min((now-start)/dur,1);
    const ease=1-Math.pow(1-p,3);
    const cur=from+(to-from)*ease;
    el.textContent=fmt(cur);
    if(p<1)requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ── 스크롤 리빌 ────────────────────────────────────────────────────────
const io=new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}});
},{threshold:.08,rootMargin:'0px 0px -30px 0px'});

// ── 차트 ──────────────────────────────────────────────────────────────
function mkChart(id,labels,datasets,opts={}){
  const ctx=el(id);if(!ctx)return;
  new Chart(ctx,{
    type:opts.type||'line',data:{labels,datasets},
    options:{
      responsive:true,maintainAspectRatio:false,
      animation:{duration:1200,easing:'easeOutQuart'},
      plugins:{
        legend:{display:opts.legend||false},
        tooltip:{backgroundColor:'rgba(6,11,20,.97)',titleColor:'#dce8ff',bodyColor:'#5a7899',borderColor:'#1a2d48',borderWidth:1,padding:12,cornerRadius:10,titleFont:{weight:'700'}}
      },
      scales:{
        x:{ticks:{color:'#5a7899',maxTicksLimit:opts.maxX||8,font:{size:11}},grid:{color:'rgba(26,45,72,.4)'}},
        y:{ticks:{color:'#5a7899',callback:opts.yFmt||(v=>v),font:{size:11}},grid:{color:'rgba(26,45,72,.4)'},min:opts.yMin,max:opts.yMax}
      },...(opts.extra||{})
    }
  });
}

// ── 메인 ──────────────────────────────────────────────────────────────
async function init(){
  let snap;
  try{const r=await fetch('./data/snapshot.json?t='+Date.now());snap=await r.json()}
  catch(e){el('loading').innerHTML='<div style="color:#ff3d5a;font-size:14px">⚠ 데이터 로드 실패<br><span style="font-size:12px;color:#5a7899">'+e.message+'</span></div>';return}

  el('loading').style.opacity='0';el('loading').style.transition='opacity .4s';
  setTimeout(()=>{el('loading').style.display='none';el('main').style.display='flex'},400);

  const upd=new Date(snap.updatedAt);
  txt('upd','갱신 '+upd.toLocaleString('ko-KR',{timeZone:'Asia/Seoul',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})+' KST');

  const d=snap.data;

  renderUpdateBanner(snap.updatedAt);
  renderHero(d);
  renderBeginnerSummary(d);
  renderTicker(d);
  renderKpi(d);
  renderAiDigest(d);
  renderNewsSentiment(d);
  renderScoreChart(d);
  renderExpert(d);
  renderBtcChart(d);
  renderFgChart(d);
  renderIndTable(d);
  renderTechnical(d);renderSentiment(d);renderOnchain(d);renderMacro(d);
  renderFundingChart(d);renderNetflowChart(d);renderMacroCharts(d);renderOnchainHistoryChart(d);
  renderLiquidation(d);renderCorrelation(d);renderOptions(d);
  renderNetLiquidity(d);renderStablecoin(d);
  renderTiming(d);renderDcaZones(d);renderChecklist(d);
  renderScoreHistogram(d);renderDivergenceChart(d);renderWindowComparison(d);
  renderScore90Chart(d);renderHalvingCycle(d);renderCycleHeatmap(d);renderForecast(d);renderForecastChart(d);renderWhale(d);renderStructure(d);renderAltRows(d);
  renderDayOfWeek(d);renderPeriodPerf(d);renderScoreHeatmap(d);
  renderRegimeMatrix(d);renderDcaBacktest(d);renderSignalMatrix(d);
  renderBreakdown(d);

  // KPI 상단 accent 바
  document.querySelectorAll('.kpi').forEach((c,i)=>{
    const colors=['var(--bl)','var(--ye)','var(--gr)','var(--pu)','var(--or)'];
    c.style.setProperty('--accent',colors[i%colors.length]);
    c.style.borderTop='2px solid '+colors[i%colors.length];
  });

  // 스크롤 리빌 등록
  setTimeout(()=>{document.querySelectorAll('.card').forEach(c=>io.observe(c))},100);
}

// 초보자 5분 요약
function renderBeginnerSummary(d){
  const c=el('beg-grid');if(!c)return;
  const m=d.api_dashboard||{};
  const t=d.api_dashboard_technical||{};
  const o=d.api_dashboard_onchain||{};
  const mac=d.api_dashboard_macro||{};
  const w=d.api_dashboard_whale_activity||{};

  const fg=m.fearGreed??50;
  const rsi=parseFloat(t.rsiDaily||50);
  const ma200Dist=parseFloat(t.ma200DistancePct||0);
  const mvrvZ=parseFloat(o.mvrvZScore??2);
  const nupl=parseFloat(o.nupl??0.3);
  const dxy=parseFloat(mac.dxy||100);
  const vix=parseFloat(mac.vix||20);
  const netFlow=parseFloat(o.exchangeNetFlow||0);
  const whaleSignal=w.signal||'';

  // 1. 시장 분위기 (공포탐욕)
  let fgIcon,fgStatus,fgColor,fgDesc;
  if(fg<=20){fgIcon='😱';fgStatus='극도 공포';fgColor='gr';fgDesc='투자자 대부분이 겁먹은 상태예요. 역사적으로 좋은 매수 타이밍이었어요.';}
  else if(fg<=40){fgIcon='😰';fgStatus='공포';fgColor='gr';fgDesc='투자자들이 불안해하고 있어요. 비교적 좋은 매수 시점일 수 있어요.';}
  else if(fg<=60){fgIcon='😐';fgStatus='중립';fgColor='ye';fgDesc='시장이 방향을 잡지 못하고 관망 중이에요.';}
  else if(fg<=80){fgIcon='😄';fgStatus='탐욕';fgColor='or';fgDesc='투자자들이 낙관적인 상태예요. 고점에 가까울 수 있어요.';}
  else{fgIcon='🤑';fgStatus='극도 탐욕';fgColor='re';fgDesc='시장이 과열된 상태예요. 신중한 접근이 필요해요.';}

  // 2. 가격 추세 (RSI + MA200)
  let tIcon,tStatus,tColor,tDesc;
  if(rsi<=35&&ma200Dist<0){tIcon='📉';tStatus='하락, 반등 가능';tColor='gr';tDesc=`RSI ${rsi.toFixed(0)}으로 과매도 구간이에요. 반등이 올 수 있어요.`;}
  else if(rsi>=70){tIcon='🔥';tStatus='과열, 조정 주의';tColor='re';tDesc=`RSI ${rsi.toFixed(0)}으로 단기 과매수 상태예요. 조정이 올 수 있어요.`;}
  else if(ma200Dist>5){tIcon='🚀';tStatus='강한 상승 추세';tColor='gr';tDesc=`200일 평균보다 ${ma200Dist.toFixed(1)}% 높아요. 중장기 상승 추세예요.`;}
  else if(ma200Dist>=0){tIcon='📈';tStatus='상승 추세';tColor='gr';tDesc='200일 이동평균 위에 있어요. 전반적으로 상승 추세예요.';}
  else{tIcon='📊';tStatus='하락 추세';tColor='re';tDesc=`200일 평균보다 ${Math.abs(ma200Dist).toFixed(1)}% 낮아요. 아직 약세 구간이에요.`;}

  // 3. 온체인 건강도 (MVRV-Z + NUPL)
  let cIcon,cStatus,cColor,cDesc;
  const cScore=(mvrvZ<1?3:mvrvZ<2?2:mvrvZ<4?1:0)+(nupl<0.25?2:nupl<0.5?1:0);
  if(cScore>=4){cIcon='🟢';cStatus='저평가 구간';cColor='gr';cDesc=`MVRV-Z ${mvrvZ.toFixed(1)} — 역사적으로 코인이 저렴하게 거래되고 있어요.`;}
  else if(cScore>=2){cIcon='🟡';cStatus='적정 수준';cColor='ye';cDesc=`MVRV-Z ${mvrvZ.toFixed(1)} — 코인 가격이 적정 수준이에요.`;}
  else{cIcon='🔴';cStatus='고평가 주의';cColor='re';cDesc=`MVRV-Z ${mvrvZ.toFixed(1)} — 역사적으로 고가 구간이에요. 신중하게 접근하세요.`;}

  // 4. 글로벌 경제 (DXY + VIX)
  let mIcon,mStatus,mColor,mDesc;
  if(vix>30){mIcon='🌪';mStatus='글로벌 불안';mColor='re';mDesc=`공포 지수(VIX) ${vix.toFixed(0)} — 금융 불안이 높아 BTC에 부정적이에요.`;}
  else if(dxy>106){mIcon='💵';mStatus='달러 강세';mColor='re';mDesc=`달러 지수 ${dxy.toFixed(1)} — 달러가 강해서 위험 자산에 불리해요.`;}
  else if(dxy<100&&vix<20){mIcon='🌤';mStatus='매크로 우호적';mColor='gr';mDesc=`달러 ${dxy.toFixed(1)}, VIX ${vix.toFixed(0)} — 글로벌 환경이 BTC에 유리해요.`;}
  else{mIcon='⚖️';mStatus='보통 수준';mColor='ye';mDesc=`달러 ${dxy.toFixed(1)}, VIX ${vix.toFixed(0)} — 글로벌 경제가 평온한 편이에요.`;}

  // 5. 고래(큰손) 동향
  let wIcon,wStatus,wColor,wDesc;
  if(whaleSignal==='ACCUMULATING'||netFlow<-500){wIcon='🐋';wStatus='쌓는 중';wColor='gr';wDesc='큰손 투자자들이 코인을 사서 모으고 있어요. 긍정적인 신호예요.';}
  else if(whaleSignal==='DISTRIBUTING'||netFlow>2000){wIcon='🚨';wStatus='팔고 있음';wColor='re';wDesc='큰손 투자자들이 코인을 거래소에 보내고 있어요. 매도 압력이 있어요.';}
  else{wIcon='🌊';wStatus='관망 중';wColor='ye';wDesc='큰손 투자자들이 뚜렷한 움직임 없이 지켜보고 있어요.';}

  const cards=[
    {icon:fgIcon,label:'시장 분위기',status:fgStatus,color:fgColor,desc:fgDesc},
    {icon:tIcon,label:'가격 추세',status:tStatus,color:tColor,desc:tDesc},
    {icon:cIcon,label:'온체인 건강도',status:cStatus,color:cColor,desc:cDesc},
    {icon:mIcon,label:'글로벌 경제',status:mStatus,color:mColor,desc:mDesc},
    {icon:wIcon,label:'고래(큰손) 동향',status:wStatus,color:wColor,desc:wDesc},
  ];
  c.innerHTML=cards.map(card=>`<div class="beg-card">
    <div class="beg-icon">${card.icon}</div>
    <div class="beg-lbl">${card.label}</div>
    <div class="beg-status ${card.color}">${card.status}</div>
    <div class="beg-desc">${card.desc}</div>
  </div>`).join('');
}

// ① 히어로
function renderHero(d){
  const m=d.api_dashboard||{},t=d.api_dashboard_buy_timing||{};
  const s=m.score??0;const{cls,stroke,glow,badge,label}=sc(s);

  // SVG 링 애니메이션
  const circ=el('score-circle');
  const r=57,circum=2*Math.PI*r;
  circ.style.strokeDasharray=circum;
  circ.style.stroke=stroke;
  circ.style.strokeDashoffset=circum;
  setTimeout(()=>{circ.style.strokeDashoffset=circum-(s/100)*circum;},300);

  // 히어로 글로우
  const gEl=el('hero-glow');
  if(gEl){gEl.style.background=`radial-gradient(circle,${stroke}22,transparent 70%)`;gEl.style.opacity=1}

  // 점수 카운트업
  const numEl=el('h-score');
  if(numEl){numEl.style.color=stroke;countUp(numEl,0,s,1200,n=>Math.round(n))}

  const badge_el=el('h-badge');
  badge_el.textContent=m.signalDisplay||label;
  badge_el.className=`hero-badge ${badge}`;
  badge_el.style.color=stroke;badge_el.style.borderColor=stroke+'44';

  txt('h-action',t.actionLabel||m.signalDisplay||'--');
  const act=el('h-action');
  if(act){act.style.backgroundImage=`linear-gradient(90deg,var(--tx),${stroke})`;act.style.webkitBackgroundClip='text';act.style.webkitTextFillColor='transparent'}

  txt('h-reason',t.actionReason||'');
  txt('hs-btc',m.btcClose?'$'+f(m.btcClose,0):'--');
  txt('hs-date',m.dataDate||'');
  const fgEl=el('hs-fg');
  if(fgEl){fgEl.textContent=m.fearGreed??'--';fgEl.className='hstat-val '+(m.fearGreed<=30?'gr':m.fearGreed>=70?'re':'')}
  txt('hs-fg-h',fgLbl(m.fearGreed));
}

// 티커 바
function renderTicker(d){
  const m=d.api_dashboard||{},t=d.api_dashboard_technical||{},s=d.api_dashboard_sentiment||{},o=d.api_dashboard_onchain||{};
  const items=[
    ['BTC','$'+f(m.btcClose,0),m.scoreDelta>0?'gr':'re'],
    ['종합점수',(m.score??'--')+' pts','bl'],
    ['공포탐욕',(m.fearGreed??'--')+' ('+fgLbl(m.fearGreed)+')','ye'],
    ['RSI(일)',f(t.rsiDaily,1),''],
    ['MA200',t.ma200DistancePct?sgn(t.ma200DistancePct)+pct(t.ma200DistancePct):'--',parseFloat(t.ma200DistancePct)>=0?'gr':'re'],
    ['펀딩비',s.fundingRate?(parseFloat(s.fundingRate)*100).toFixed(5)+'%':'--',''],
    ['SOPR',f(o.sopr,4),parseFloat(o.sopr)>=1?'gr':'re'],
    ['NUPL',f(o.nupl,3),''],
    ['롱/숏',f(s.longShortRatio,2),''],
    ['BTC도미넌스',(m.btcDominance??d.api_dashboard_altcoin?.btcDominance??'--')+'%',''],
  ];
  // 2번 반복해서 무한 루프
  const html=([...items,...items]).map(([n,v,c])=>`<div class="ticker-item"><span class="ticker-name">${n}</span><span class="ticker-val ${c}">${v}</span></div>`).join('');
  el('ticker').innerHTML=html;
}

// ② KPI
function renderKpi(d){
  const m=d.api_dashboard||{},chk=d.api_dashboard_checklist||{},sys=d.api_dashboard_system||{},fc=d.api_dashboard_forecast||{};
  const dEl=el('k-delta');
  if(dEl){dEl.textContent=(m.scoreDelta!=null?(m.scoreDelta>0?'+':'')+m.scoreDelta:'--');dEl.className='kpi-val '+(m.scoreDelta>0?'gr':m.scoreDelta<0?'re':'')}
  txt('k-avg',`주간 평균 ${m.weeklyAverageScore??'--'} · 월간 평균 ${m.monthlyAverageScore??'--'}`);
  const rm=sys.regimeMatrix||{};
  const qEl=el('k-quad');if(qEl){qEl.textContent=rm.label||'--';qEl.className='kpi-val '+(rm.color==='green'?'gr':rm.color==='red'?'re':'ye')}
  txt('k-quad-h',rm.description||'');
  txt('k-chk',chk.passedCount!=null?`${chk.passedCount} / ${chk.totalCount}`:'--');txt('k-chk-h',chk.levelLabel||'');
  const fcEl=el('k-fc');if(fcEl){fcEl.textContent=fc.predictedScore??'--';fcEl.className='kpi-val '+(fc.predictedScore>fc.todayScore?'gr':'re')}
  txt('k-fc-h',fc.scoreDiff!=null?(fc.scoreDiff>0?'+':'')+fc.scoreDiff+' 예상':(fc.confidenceLow?`구간 ${fc.confidenceLow}~${fc.confidenceHigh}`:''));
  txt('k-halv',m.halvingDaysAfter?m.halvingDaysAfter+'일':'--');txt('k-halv-h',m.halvingPhase||'');
}

// 점수 차트
function renderScoreChart(d){
  const h=d.api_prism_indices?.entries||[];
  const vals=h.map(e=>e.readinessScore);
  mkChart('score-ch',h.map(e=>e.date.slice(5)),[{
    label:'점수',data:vals,
    backgroundColor:vals.map(v=>scBar(v)+'bb'),
    borderColor:vals.map(scBar),borderWidth:1,borderRadius:5,
  }],{type:'bar',yMin:0,yMax:100});
}

// 전문가
function renderExpert(d){
  const ex=d.api_dashboard_expert_opinion||{};
  const c=ex.verdictColor==='green'?'gr':ex.verdictColor==='red'?'re':'ye';
  const vEl=el('ex-verdict');if(vEl){vEl.textContent=ex.verdict||'--';vEl.className='rv '+c}
  txt('ex-sum',ex.summary||'');
  const wEl=el('ex-watch');if(wEl){if(ex.keyWatch){wEl.innerHTML='👁 '+ex.keyWatch}else{wEl.style.display='none'}}
  const list=el('ex-sigs');if(!list)return;
  const sigs=[...(ex.bullishSignals||[]).map(s=>({t:s,c:'gr'})),...(ex.bearishSignals||[]).map(s=>({t:s,c:'re'})),...(ex.neutralSignals||[]).map(s=>({t:s,c:'ye'}))].slice(0,10);
  list.innerHTML=sigs.map(s=>`<div class="sig"><div class="sig-dot" style="background:var(--${s.c})"></div><span>${s.t}</span></div>`).join('');
}

// BTC 차트
function renderBtcChart(d){
  const h=d.api_prism_indices?.entries||[];
  mkChart('btc-ch',h.map(e=>e.date.slice(5)),[{
    label:'BTC',data:h.map(e=>e.btcClose?parseFloat(e.btcClose):null),
    borderColor:'#f7931a',
    backgroundColor:ctx=>{const g=ctx.chart.ctx.createLinearGradient(0,0,0,280);g.addColorStop(0,'rgba(247,147,26,.3)');g.addColorStop(1,'rgba(247,147,26,.01)');return g},
    fill:true,tension:.4,pointRadius:0,pointHoverRadius:6,borderWidth:2.5
  }],{yFmt:v=>'$'+Math.round(v).toLocaleString()});
}

// 공포탐욕 차트
function renderFgChart(d){
  const h=d.api_prism_indices?.entries||[];
  mkChart('fg-ch',h.map(e=>e.date.slice(5)),[{
    label:'공포탐욕',data:h.map(e=>e.fearGreed),
    borderColor:'#3b9eff',
    backgroundColor:ctx=>{const g=ctx.chart.ctx.createLinearGradient(0,0,0,280);g.addColorStop(0,'rgba(59,158,255,.3)');g.addColorStop(1,'rgba(59,158,255,.01)');return g},
    fill:true,tension:.4,pointRadius:0,pointHoverRadius:6,borderWidth:2.5
  }],{yMin:0,yMax:100});
}

// 지표 테이블
function renderIndTable(d){
  const rows=d.api_dashboard_system?.indicatorRows||[];
  const tb=el('ind-table');if(!tb)return;
  tb.innerHTML=rows.map(r=>{
    const s=r.score??0,tc=r.trend>0?'↑':r.trend<0?'↓':'—';
    const cc=s>=70?'gr':s>=50?'bl':s>=30?'ye':'re';
    return`<tr>
      <td style="font-weight:500;color:var(--tx)">${r.name}</td>
      <td style="color:var(--mu)">${r.value??'--'}</td>
      <td class="${cc}" style="font-weight:800;font-size:13px">${s}</td>
      <td><div class="sbar"><div class="sbar-fill" style="width:${s}%;background:${scBar(s)}"></div></div></td>
      <td style="color:${r.trend>0?'var(--gr)':r.trend<0?'var(--re)':'var(--mu2)'};font-size:14px;font-weight:700">${tc}</td>
    </tr>`;
  }).join('');
}

// 기술적
function renderTechnical(d){
  const t=d.api_dashboard_technical||{};
  el('tech-rows').innerHTML=[
    ['RSI 일봉 — 과열 지수',f(t.rsiDaily,1)+(t.rsiDaily<=30?' (과매도, 반등 가능)':t.rsiDaily>=70?' (과매수, 조정 주의)':''),t.rsiDaily<=30?'gr':t.rsiDaily>=70?'re':''],
    ['RSI 주봉',f(t.rsiWeekly,1),''],['RSI 월봉',f(t.rsiMonthly,1),''],
    ['200일 평균 비율',t.ma200Ratio?f(parseFloat(t.ma200Ratio)*100,1)+'%':'--',parseFloat(t.ma200Ratio)>=1?'gr':'re'],
    ['200일 평균 가격',t.ma200Value?'$'+f(t.ma200Value,0):'--',''],
    ['현재가 vs 200일 평균',t.ma200DistancePct?sgn(t.ma200DistancePct)+pct(t.ma200DistancePct):'--',parseFloat(t.ma200DistancePct)>=0?'gr':'re'],
    ['가격 변동성',t.historicalVolatility?pct(parseFloat(t.historicalVolatility)*100):'--',''],
    ['Pi Cycle 간격 — 사이클 피크 신호',f(t.piCycleGap,0),''],
    ['MACD — 추세 전환 신호',t.macd?`${f(t.macd.macdLine,0)} (${t.macd.crossLabel||'--'})`:'--, ',t.macd?.bullish?'gr':'re'],
  ].map(([l,v,c])=>row(l,v,c)).join('');
}

// 심리
function renderSentiment(d){
  const s=d.api_dashboard_sentiment||{};
  el('sent-rows').innerHTML=[
    ['공포탐욕 지수',`${s.fearGreed??'--'} — ${fgLbl(s.fearGreed)}`,s.fearGreed<=30?'gr':s.fearGreed>=70?'re':''],
    ['펀딩비 — 선물 포지션 비용',s.fundingRate?(parseFloat(s.fundingRate)*100).toFixed(5)+'%':'--',''],
    ['7일 누적 펀딩비',s.cumulativeFunding7d?pct(s.cumulativeFunding7d,4):'--',''],
    ['30일 누적 펀딩비',s.cumulativeFunding30d?pct(s.cumulativeFunding30d,3):'--',''],
    ['롱/숏 비율 — 매수/매도 포지션',f(s.longShortRatio,2),''],['미결제약정 비율',f(s.openInterestRatio,2),''],
    ['테이커 매수/매도 비율',f(s.takerBuySellRatio,2),parseFloat(s.takerBuySellRatio)>=1?'gr':'re'],
    ['옵션 Put/Call 비율',f(s.putCallRatio,2),''],['장기/단기 보유자 비율',f(s.lthSthRatio,2),''],
  ].map(([l,v,c])=>row(l,v,c)).join('');
}

// 온체인
function renderOnchain(d){
  const o=d.api_dashboard_onchain||{};
  el('chain-rows').innerHTML=[
    ['SOPR — 코인 매도 수익률',f(o.sopr,4),parseFloat(o.sopr)>=1?'gr':'re'],
    ['NUPL — 미실현 손익 비율',f(o.nupl,3),parseFloat(o.nupl)>=0?'gr':'re'],
    ['MVRV-Z — 시장 고평가 지수',f(o.mvrvZScore,2),''],['장기/단기 보유자 비율',f(o.lthSthRatio,2),''],
    ['거래소 유입 코인 (+는 매도 압력)',o.exchangeNetFlow?f(o.exchangeNetFlow,0)+' BTC':'--',parseFloat(o.exchangeNetFlow)>0?'re':'gr'],
    ['거래소 보유 코인 총량',o.exchangeReserve?f(o.exchangeReserve,0)+' BTC':'--',''],
    ['Puell Multiple — 채굴자 수익 지수',f(o.puellMultiple,2),''],['일일 활성 지갑 수',f(o.activeAddresses,0),''],
    ['채굴 네트워크 강도',o.hashRate?f(o.hashRate,0)+' EH/s':'--',''],['채굴자 매도 물량',o.minerOutflow?f(o.minerOutflow,0)+' BTC':'--',''],
  ].map(([l,v,c])=>row(l,v,c)).join('');
}

// 매크로
function renderMacro(d){
  const m=d.api_dashboard_macro||{};
  el('macro-rows').innerHTML=[
    ['달러 지수 (DXY)',f(m.dxy,2),''],['미국 주식시장 (S&P 500)',f(m.sp500,0),''],
    ['금 가격 (달러)','$'+f(m.goldPrice,0),''],
    ['미국채 10년 금리',m.usTreasury10y?pct(m.usTreasury10y):'--',''],
    ['김치 프리미엄 — 국내 프리미엄',m.kimchiPremium?pct(m.kimchiPremium):'--',parseFloat(m.kimchiPremium)>0?'gr':'re'],
    ['스테이블코인 점유율',m.stablecoinDominance?pct(m.stablecoinDominance):'--',''],
    ['BTC ETF 자금 유입',m.btcEtfNetFlow?'$'+f(m.btcEtfNetFlow,0)+'M':'--',parseFloat(m.btcEtfNetFlow)>0?'gr':'re'],
    ['글로벌 통화량 증가율 (M2)',m.globalM2Growth?pct(m.globalM2Growth):'--',''],
    ['공포 지수 (VIX)',f(m.vix,1),parseFloat(m.vix)>25?'re':'gr'],
  ].map(([l,v,c])=>row(l,v,c)).join('');
}

// 청산
function renderLiquidation(d){
  const l=d.api_dashboard_liquidation_heatmap||{};
  const cc=l.cascadeDirection==='DOWNSIDE'?'re':'gr';
  el('liq-summary').innerHTML=[
    ['BTC 현재가','$'+f(l.currentPrice,0),''],
    ['선물 미결제약정','$'+f(parseFloat(l.openInterestUsd||0)/1e9,2)+'B',''],
    ['매수(롱) 포지션 비율',pct(parseFloat(l.longAccountRatio||0)*100,1),'gr'],
    ['매도(숏) 포지션 비율',pct(parseFloat(l.shortAccountRatio||0)*100,1),'re'],
    ['하방 청산 물량','$'+f(parseFloat(l.downsideLiquidationUsd||0)/1e9,2)+'B','re'],
    ['상방 청산 물량','$'+f(parseFloat(l.upsideLiquidationUsd||0)/1e9,2)+'B','gr'],
    ['연쇄 청산 방향',l.cascadeLabel||'--',cc],
  ].map(([l,v,c])=>row(l,v,c)).join('');
  el('liq-levels').innerHTML='<div style="font-size:10px;color:var(--mu);text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px;font-weight:700">주요 청산 가격대</div>'+
    (l.levels||[]).slice(0,6).map(lv=>{
      const sideKo=lv.side==='LONG'?'매수(롱)':'매도(숏)';
      return`<div class="liq-lvl ${lv.side==='LONG'?'bg-re':'bg-gr'}">
        <span class="${lv.side==='LONG'?'re':'gr'}" style="font-weight:800;font-size:11px">${sideKo} ${lv.leverage}배</span>
        <span style="font-weight:700">$${f(lv.price,0)}</span>
        <span style="color:var(--mu);font-size:11px">$${f(parseFloat(lv.notionalUsd||0)/1e9,2)}B</span>
      </div>`;
    }).join('');
}

// 상관관계
function renderCorrelation(d){
  const c=d.api_dashboard_rolling_correlation||{};
  const cf=v=>{const n=parseFloat(v);return n>0.5?'gr':n<-0.5?'re':'ye'};
  el('corr-rows').innerHTML=[
    ['BTC vs S&P500 상관계수',f(c.btcVsSpx,3),cf(c.btcVsSpx)],
    ['BTC vs 달러(DXY) 상관계수',f(c.btcVsDxy,3),cf(c.btcVsDxy)],
    ['BTC vs 금 상관계수',f(c.btcVsGold,3),cf(c.btcVsGold)],
    ['측정 기간',(c.windowDays||30)+'일',''],
  ].map(([l,v,c])=>row(l,v,c)).join('');
  const rEl=el('corr-regime');
  if(rEl)rEl.innerHTML=`<span style="font-weight:700;color:var(--bl);font-size:13px">${c.regimeLabel||'--'}</span><br><span style="color:var(--mu)">${c.regimeDescription||''}</span>`;
}

// 옵션
function renderOptions(d){
  const o=d.api_dashboard_options_regime||{};
  el('opt-rows').innerHTML=[
    ['내재변동성 (IV30) — 시장 기대 변동성',f(o.iv30d,1)+'%',o.ivSignal==='EXTREME_FEAR'?'re':o.ivSignal==='CALM'?'gr':'ye'],
    ['변동성 신호',o.ivLabel||'--',''],
    ['옵션 스큐 (25δ) — 상승/하락 선호도',f(o.skew25d,2)+'%',o.skewSignal?.includes('BULLISH')?'gr':'re'],
    ['스큐 신호',o.skewLabel||'--',o.skewSignal?.includes('BULLISH')?'gr':'re'],
  ].map(([l,v,c])=>row(l,v,c)).join('');
  const ivH=o.ivHistory||[];
  if(ivH.length>0)mkChart('iv-ch',ivH.map(e=>e.date.slice(5)),[{
    label:'IV30d',data:ivH.map(e=>parseFloat(e.iv)),
    borderColor:'#9b5de5',
    backgroundColor:ctx=>{const g=ctx.chart.ctx.createLinearGradient(0,0,0,180);g.addColorStop(0,'rgba(155,93,229,.25)');g.addColorStop(1,'rgba(155,93,229,.01)');return g},
    fill:true,tension:.4,pointRadius:0,borderWidth:2
  }],{yFmt:v=>v+'%'});
}

// 순유동성
function renderNetLiquidity(d){
  const n=d.api_dashboard_net_liquidity||{};
  el('nl-rows').innerHTML=[
    ['연준 순유동성',n.netLiquidityUsdM?'$'+f(parseFloat(n.netLiquidityUsdM)/1e6,2)+'T':'--',''],
    ['4주 변화 금액',n.change4wUsdM?sgn(n.change4wUsdM)+'$'+f(Math.abs(parseFloat(n.change4wUsdM))/1e3,1)+'B':'--',parseFloat(n.change4wUsdM)>0?'gr':'re'],
    ['4주 변화율',n.change4wPercent?sgn(n.change4wPercent)+pct(n.change4wPercent):'--',parseFloat(n.change4wPercent)>0?'gr':'re'],
    ['연준 보유 자산',n.fedAssetsUsdM?'$'+f(parseFloat(n.fedAssetsUsdM)/1e6,2)+'T':'--',''],
    ['미국 재무부 잔고',n.treasuryAccountUsdM?'$'+f(parseFloat(n.treasuryAccountUsdM)/1e3,1)+'B':'--',''],
    ['유동성 신호',n.signalLabel||'--',n.signal==='EXPANDING'?'gr':'re'],
    ['해석',n.signalDescription||'--',''],
  ].map(([l,v,c])=>row(l,v,c)).join('');
}

// 스테이블코인
function renderStablecoin(d){
  const s=d.api_dashboard_stablecoin_supply||{};
  el('stbl-rows').innerHTML=[
    ['스테이블코인 총 시가총액','$'+f(parseFloat(s.totalMarketCapUsd||0)/1e9,1)+'B',''],
    ['30일 전 시가총액','$'+f(parseFloat(s.marketCap30dAgoUsd||0)/1e9,1)+'B',''],
    ['30일 증가율',s.growth30dPercent?sgn(s.growth30dPercent)+pct(s.growth30dPercent):'--',parseFloat(s.growth30dPercent)>0?'gr':'re'],
    ['판단',s.signalLabel||'--',s.signal==='EXPANDING'?'gr':s.signal==='CONTRACTING'?'re':'ye'],
    ['해석',s.signalDescription||'--',''],
  ].map(([l,v,c])=>row(l,v,c)).join('');
}

// 타이밍
function renderTiming(d){
  const t=d.api_dashboard_buy_timing||{},m=d.api_dashboard||{};
  el('timing-rows').innerHTML=[
    ['현재 시장 국면',t.marketSeason||'--',''],
    ['권장 투입 비중',t.positionSizePct?pct(t.positionSizePct,0):'--',''],
    ['DCA 분할 횟수',t.dcaSplits?t.dcaSplits+'회':'--',''],['DCA 간격',t.dcaIntervalDays?t.dcaIntervalDays+'일':'--',''],
    ['목표 가격',t.targetPrice?'$'+f(t.targetPrice,0):'--','gr'],['손절 가격',t.stopLossPrice?'$'+f(t.stopLossPrice,0):'--','re'],
    ['반감기 이후 경과일',m.halvingDaysAfter?m.halvingDaysAfter+'일':'--',''],['반감기 단계',m.halvingPhase||'--',''],
  ].map(([l,v,c])=>row(l,v,c)).join('');
}

// 체크리스트
function renderChecklist(d){
  const c=d.api_dashboard_checklist||{};
  const p=c.passedCount!=null?Math.round(c.passedCount/c.totalCount*100):0;
  const barC=p>=70?'#00e57a':p>=40?'#ffcc00':'#ff3d5a';
  el('chk-prog').innerHTML=`
    <div style="display:flex;justify-content:space-between;margin-bottom:8px">
      <span style="font-size:13px;font-weight:700;color:${barC}">${c.levelLabel||''}</span>
      <span style="color:var(--mu);font-size:12px">${c.passedCount}/${c.totalCount} (${p}%)</span>
    </div>
    <div class="prog"><div class="prog-fill" style="background:${barC};width:${p}%"></div></div>
    <p style="font-size:11px;color:var(--mu);margin-top:8px">${c.levelDescription||''}</p>`;
  el('chk-items').innerHTML=(c.items||[]).map(it=>`
    <div class="chk">
      <span style="font-size:15px;flex-shrink:0">${it.passed?'✅':'❌'}</span>
      <span><span style="color:${it.passed?'var(--tx)':'var(--mu)'};font-weight:${it.passed?600:400}">${it.name||it.label||'--'}</span>${it.reason?`<br><span style="color:var(--mu2);font-size:11px">${it.reason}</span>`:''}</span>
    </div>`).join('');
}

// 예측
function renderForecast(d){
  const fc=d.api_dashboard_forecast||{};
  el('fc-rows').innerHTML=[
    ['오늘 점수',fc.todayScore??'--',''],
    ['내일 예상 점수',fc.predictedScore??'--',fc.predictedScore>fc.todayScore?'gr':'re'],
    ['예상 변화',fc.scoreDiff!=null?(fc.scoreDiff>0?'+':'')+fc.scoreDiff:'--',fc.scoreDiff>0?'gr':'re'],
    ['예측 신뢰도 (R²)',f(fc.r2,3),''],
    ['예측 신뢰 구간',fc.confidenceLow?`${fc.confidenceLow} ~ ${fc.confidenceHigh}`:'--',''],
  ].map(([l,v,c])=>row(l,v,c)).join('');
}

// 고래
function renderWhale(d){
  const w=d.api_dashboard_whale_activity||{};
  const cc=w.signal==='ACCUMULATING'?'gr':w.signal==='DISTRIBUTING'?'re':'ye';
  el('whale-rows').innerHTML=[
    ['고래 활동 강도',w.activityLevel||'--',''],
    ['판단',w.signal||'--',cc],
    ['7일 거래소 유입 (+는 매도 압력)',w.netFlowSum7d?f(w.netFlowSum7d,0)+' BTC':'--',parseFloat(w.netFlowSum7d)>0?'re':'gr'],
    ['7일 보유량 변화',w.reserveChange7d?sgn(w.reserveChange7d)+f(w.reserveChange7d,0)+' BTC':'--',''],
  ].map(([l,v,c])=>row(l,v,c)).join('');
}

// 시장구조
function renderStructure(d){
  const s=d.api_dashboard_market_structure||{};
  const cc=s.structure?.includes('강세')?'gr':s.structure?.includes('약세')?'re':'ye';
  el('str-rows').innerHTML=[
    ['시장 구조',s.structure||'--',cc],
    ['최근 고점',s.lastHigh?'$'+f(s.lastHigh,0):'--',''],['최근 저점',s.lastLow?'$'+f(s.lastLow,0):'--',''],
    ['다음 저항선 (막힐 수 있는 가격)',s.nextResistance?'$'+f(s.nextResistance,0):'--','re'],
    ['다음 지지선 (버텨줄 수 있는 가격)',s.nextSupport?'$'+f(s.nextSupport,0):'--','gr'],
  ].map(([l,v,c])=>row(l,v,c)).join('');
}

// 알트/비유동
function renderAltRows(d){
  const a=d.api_dashboard_altcoin||{},il=d.api_dashboard_illiquid_supply||{};
  el('alt-rows').innerHTML=[
    ['알트시즌 지수',f(a.altSeasonIndex,0),''],['알트시즌 상태',a.altseasonLabel||'--',''],
    ['BTC 시장 점유율',a.btcDominance?a.btcDominance+'%':'--',''],['ETH/BTC 가격 비율',f(a.ethBtcPerformance,4),''],
    ['장기 보유(비유동) 비율',il.percentFormatted||'--',''],['장기 보유 신호',il.label||'--',''],
  ].map(([l,v,c])=>row(l,v,c)).join('');
}

// AI 다이제스트
function renderAiDigest(d){
  const meta=el('ai-digest-meta');
  const secs=el('ai-digest-sections');
  if(!meta||!secs)return;
  const ai=d.api_ai_digest||{};
  if(!ai.hasData){meta.innerHTML='<span style="color:var(--mu);font-size:12px">데이터 없음</span>';return;}

  const toneCol=ai.toneHexColor||'#FBBF24';
  const ts=ai.generatedAt?new Date(ai.generatedAt).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}):'--';
  meta.innerHTML=`<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
    <span style="background:${toneCol}22;border:1px solid ${toneCol}66;color:${toneCol};font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px">${ai.toneDisplay||'--'}</span>
    <span style="color:var(--mu);font-size:11px">점수 ${ai.compositeScore??'--'}</span>
    <span style="color:var(--mu2);font-size:10px;margin-left:auto">${ts}</span>
  </div>`;

  const typeIcon={SUMMARY:'📋',RISK:'⚠️',ACTION:'🎯',OPPORTUNITY:'✅'};
  const typeCol={SUMMARY:'var(--bl)',RISK:'var(--re)',ACTION:'var(--gr)',OPPORTUNITY:'var(--gr)'};
  secs.innerHTML=(ai.sections||[]).map(s=>{
    const icon=typeIcon[s.type]||'•';
    const col=typeCol[s.type]||'var(--mu)';
    return`<div style="display:flex;gap:8px;padding:8px 0;border-bottom:1px solid var(--bd)">
      <span style="font-size:14px;flex-shrink:0;margin-top:1px">${icon}</span>
      <span style="font-size:12px;color:var(--tx);line-height:1.6">${s.content}</span>
    </div>`;
  }).join('');
}

// 뉴스 센티먼트
function renderNewsSentiment(d){
  const meta=el('news-sentiment-meta');
  const list=el('news-sentiment-items');
  if(!meta||!list)return;
  const ns=d.api_ai_news_sentiment||{};
  if(!ns.hasData){meta.innerHTML='<span style="color:var(--mu);font-size:12px">데이터 없음</span>';return;}

  const col=ns.labelHexColor||'#FBBF24';
  const ts=ns.generatedAt?new Date(ns.generatedAt).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}):'--';
  const score=parseFloat(ns.compositeScore||0);
  meta.innerHTML=`<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
    <span style="background:${col}22;border:1px solid ${col}66;color:${col};font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px">${ns.labelDisplay||'--'} · ${score>0?'+':''}${score.toFixed(3)}</span>
    <span style="color:var(--mu);font-size:11px">${ns.scoredCount||0}개 기사 분석</span>
    <span style="color:var(--mu2);font-size:10px;margin-left:auto">${ts}</span>
  </div>`;

  list.innerHTML=(ns.items||[]).map(item=>{
    const sc=parseFloat(item.score||0);
    const scCol=sc>=0.3?'var(--gr)':sc<=-0.3?'var(--re)':'var(--ye)';
    const itemTs=item.publishedAt?new Date(item.publishedAt).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}):'';
    return`<div style="display:flex;gap:10px;padding:9px 0;border-bottom:1px solid var(--bd)">
      <div style="flex-shrink:0;width:36px;text-align:center;font-size:12px;font-weight:900;color:${scCol};padding-top:2px">${sc>0?'+':''}${sc.toFixed(1)}</div>
      <div style="min-width:0">
        <a href="${item.url||'#'}" target="_blank" rel="noopener" style="font-size:12px;color:var(--tx);line-height:1.5;display:block;text-decoration:none;word-break:break-word" onmouseover="this.style.color='var(--bl)'" onmouseout="this.style.color='var(--tx)'">${item.title||'--'}</a>
        <div style="font-size:10px;color:var(--mu2);margin-top:3px">${item.source||''} · ${itemTs}</div>
      </div>
    </div>`;
  }).join('');
}

// B-18: 갱신 배너
function renderUpdateBanner(updatedAt){
  const b=el('update-banner');if(!b)return;
  const t=el('banner-upd');
  if(updatedAt){
    const dt=new Date(updatedAt);
    if(t)t.textContent=dt.toLocaleString('ko-KR',{timeZone:'Asia/Seoul',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'});
    b.style.display='flex';
  }
}

// B-14: 국면 매트릭스
function renderRegimeMatrix(d){
  const c=el('regime-matrix');if(!c)return;
  const rm=d.api_dashboard_system?.regimeMatrix||{};
  const col=rm.color==='green'?'var(--gr)':rm.color==='red'?'var(--re)':'var(--ye)';
  const quadrants=[
    {q:'Q1',label:'역추세 매수',desc:'점수↑ 공포↑',col:'var(--gr)'},
    {q:'Q2',label:'강세 지속',desc:'점수↑ 탐욕↑',col:'var(--bl)'},
    {q:'Q3',label:'패닉 구간',desc:'점수↓ 공포↑',col:'var(--ye)'},
    {q:'Q4',label:'과열 위험',desc:'점수↓ 탐욕↑',col:'var(--re)'},
  ];
  c.innerHTML=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px">${
    quadrants.map(q=>{
      const active=rm.quadrant===q.q;
      return`<div style="padding:12px;border-radius:8px;border:1px solid ${active?q.col:'var(--bd)'};background:${active?q.col+'22':'transparent'};text-align:center">
        <div style="font-size:10px;font-weight:700;color:${q.col};text-transform:uppercase;letter-spacing:.5px">${q.q}</div>
        <div style="font-size:12px;font-weight:700;color:${active?q.col:'var(--tx)'};margin:4px 0">${q.label}${active?' ✓':''}</div>
        <div style="font-size:10px;color:var(--mu)">${q.desc}</div>
      </div>`;
    }).join('')
  }</div>
  <div style="padding:12px;border-radius:8px;background:${col}11;border:1px solid ${col}33">
    <div style="font-size:14px;font-weight:900;color:${col};margin-bottom:4px">${rm.label||'--'}</div>
    <div style="font-size:12px;color:var(--mu);line-height:1.6">${rm.description||''}</div>
  </div>`;
}

// B-13: DCA 백테스트
function renderDcaBacktest(d){
  const c=el('backtest-rows');if(!c)return;
  const bt=d.api_dashboard_buy_timing?.dcaBacktest||[];if(!bt.length)return;
  c.innerHTML=bt.map(b=>[
    [b.label||'--','',''],
    ['진입 횟수',(b.entryCount||0)+'회',''],
    ['평균 진입가',b.avgEntry||'--',''],
    ['현재가',b.todayClose||'--',''],
    ['수익률',b.returnPct?pct(b.returnPct):'--%',parseFloat(b.returnPct)>=0?'gr':'re'],
  ].map(([l,v,cc])=>row(l,v,cc)).join('')).join('<hr style="border-color:var(--bd);margin:8px 0">');
}

// B-15: 신호 매트릭스 (30일 × 지표)
function renderSignalMatrix(d){
  const c=el('signal-matrix');if(!c)return;
  const entries=d.api_prism_indices?.entries||[];if(!entries.length)return;
  const fields=['fearGreed','mvrvZScore','rsiDaily','nupl','fundingRate','longShortRatio','btcDominance'];
  const labels={fearGreed:'공포탐욕',mvrvZScore:'MVRV-Z',rsiDaily:'RSI일',nupl:'NUPL',fundingRate:'펀딩비',longShortRatio:'롱숏',btcDominance:'도미넌스'};
  const isBullish=(k,v)=>{
    if(v==null)return null;
    const n=parseFloat(v);
    if(k==='fearGreed')return n<=30;
    if(k==='mvrvZScore')return n<=1;
    if(k==='rsiDaily')return n<=35;
    if(k==='nupl')return n<=0.25;
    if(k==='fundingRate')return Math.abs(n)<=0.0001;
    if(k==='longShortRatio')return n>=1;
    if(k==='btcDominance')return n>=55;
    return null;
  };
  c.innerHTML=`<table style="border-collapse:collapse;font-size:10px;min-width:100%">
    <thead><tr><th style="color:var(--mu);padding:4px 8px;text-align:left;white-space:nowrap">날짜</th>${fields.map(f=>`<th style="color:var(--mu);padding:4px 6px;text-align:center;white-space:nowrap">${labels[f]||f}</th>`).join('')}</tr></thead>
    <tbody>${entries.slice(-14).map(e=>`<tr><td style="color:var(--mu2);padding:3px 8px;white-space:nowrap">${e.date.slice(5)}</td>${
      fields.map(f=>{
        const bull=isBullish(f,e[f]);
        const col=bull===null?'var(--bd)':bull?'var(--gr)':'var(--re)';
        const bg=bull===null?'transparent':bull?'rgba(0,229,122,.15)':'rgba(255,61,90,.15)';
        return`<td style="padding:3px 6px;text-align:center"><div style="background:${bg};border-radius:3px;padding:2px 4px;color:${col};font-weight:700">${bull===null?'--':bull?'▲':'▼'}</div></td>`;
      }).join('')
    }</tr>`).join('')}</tbody></table>`;
}

// B-07~08: 요일별 수익률
function renderDayOfWeek(d){
  const h=d.api_dashboard_performance?.dayOfWeekStats||[];if(!h.length)return;
  const vals=h.map(e=>parseFloat(e.avgReturn||0));
  mkChart('dow-ch',h.map(e=>e.day),[{
    label:'평균수익률(%)',data:vals,
    backgroundColor:vals.map(v=>v>=0?'rgba(0,229,122,.6)':'rgba(255,61,90,.6)'),
    borderColor:vals.map(v=>v>=0?'#00e57a':'#ff3d5a'),
    borderWidth:1,borderRadius:4
  }],{type:'bar',yFmt:v=>v.toFixed(2)+'%'});
}

// B-09: 기간별 수익률
function renderPeriodPerf(d){
  const c=el('period-rows');if(!c)return;
  const pp=d.api_dashboard_performance?.periodPerformance||{};
  const rows7=pp['7d']||{},rows30=pp['30d']||{},rowsAll=pp['all']||{};
  c.innerHTML=[
    ['7일 BTC 변화',rows7.btcChangePct?pct(rows7.btcChangePct):'--%',parseFloat(rows7.btcChangePct)>=0?'gr':'re'],
    ['7일 점수 변화',rows7.scoreDelta!=null?(rows7.scoreDelta>0?'+':'')+rows7.scoreDelta:'--',''],
    ['30일 BTC 변화',rows30.btcChangePct?pct(rows30.btcChangePct):'--%',parseFloat(rows30.btcChangePct)>=0?'gr':'re'],
    ['30일 점수 변화',rows30.scoreDelta!=null?(rows30.scoreDelta>0?'+':'')+rows30.scoreDelta:'--',''],
    ['전체 BTC 변화',rowsAll.btcChangePct?pct(rowsAll.btcChangePct):'--%',parseFloat(rowsAll.btcChangePct)>=0?'gr':'re'],
    ['추적 기간',(rowsAll.totalDays||0)+'일',''],
  ].map(([l,v,cc])=>row(l,v,cc)).join('');
}

// B-10: 점수 히트맵
function renderScoreHeatmap(d){
  const c=el('score-heatmap');if(!c)return;
  const days=d.api_dashboard_performance?.heatmapDays||[];if(!days.length)return;
  const colMap={buy:'var(--gr)',mild_buy:'#00c96b',neutral:'var(--bl)',caution:'var(--ye)',sell:'var(--re)'};
  c.innerHTML=days.map(day=>{
    const col=colMap[day.color?.toLowerCase()]||'var(--mu)';
    return`<div title="${day.date}: ${day.score}점" style="width:32px;height:32px;border-radius:4px;background:${col}33;border:1px solid ${col}66;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:${col};cursor:default">${day.score}</div>`;
  }).join('');
}

// 지표 분해
const INDICATOR_NAMEMAP={
  '공포탐욕':'공포탐욕 지수','펀딩비':'펀딩비','롱숏비율':'롱/숏 비율','테이커비율':'테이커 매수/매도',
  'OI비율':'미결제약정 비율','BTC도미넌스':'BTC 점유율','김치프리미엄':'김치 프리미엄',
  'RSI(일)':'RSI 일봉','RSI(주)':'RSI 주봉','MVRV Z':'MVRV-Z 지수','스테이블코인':'스테이블코인',
  'ETH/BTC':'ETH/BTC 비율','MA200비율':'200일 평균 비율','Puell Multiple':'Puell Multiple',
  'Active Addresses':'활성 지갑 수','Hash Rate':'채굴 강도','DXY':'달러 지수',
  'S&P500':'S&P 500','Put/Call':'옵션 Put/Call','VIX':'공포 지수 (VIX)',
  'NUPL':'NUPL','SOPR':'SOPR','NVT':'NVT 비율','M2Growth':'M2 증가율',
  'FFR':'기준금리','US10Y':'미국채 10년','Gold':'금 가격','SP500':'S&P 500'
};
function renderBreakdown(d){
  const bd=d.api_dashboard?.indicatorBreakdown||{};
  const c=el('breakdown');if(!c)return;
  c.innerHTML=Object.entries(bd).map(([k,v])=>{
    const col=scBar(v);
    const displayName=INDICATOR_NAMEMAP[k]||k;
    return`<div class="bd-card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <span style="color:var(--mu);font-size:11px">${displayName}</span>
        <span style="color:${col};font-weight:900;font-size:16px">${v}</span>
      </div>
      <div class="prog"><div class="prog-fill" style="width:${v}%;background:${col}"></div></div>
    </div>`;
  }).join('');
}

// B-11~12: NUPL/MVRV 30일 히스토리
function renderOnchainHistoryChart(d){
  const h=d.api_prism_indices?.entries||[];if(!h.length)return;
  const labels=h.map(e=>e.date.slice(5));
  mkChart('nupl-mvrv-ch',labels,[
    {label:'NUPL',data:h.map(e=>e.nupl?parseFloat(e.nupl):null),borderColor:'#00e57a',backgroundColor:'rgba(0,229,122,.08)',fill:false,tension:.4,pointRadius:0,borderWidth:2,spanGaps:true},
    {label:'MVRV-Z',data:h.map(e=>e.mvrvZScore?parseFloat(e.mvrvZScore):null),borderColor:'#9b5de5',backgroundColor:'rgba(155,93,229,.08)',fill:false,tension:.4,pointRadius:0,borderWidth:2,spanGaps:true},
  ],{legend:true,yFmt:v=>v.toFixed(2)});
}

// B-06: 반감기 사이클 + 히트맵
function renderHalvingCycle(d){
  const c=el('halving-progress');if(!c)return;
  const cy=d.api_dashboard_cycle?.halvingCycle||{};
  const pct=parseFloat(cy.progressWidth||0);
  const col=pct>=75?'var(--re)':pct>=50?'var(--ye)':'var(--gr)';
  c.innerHTML=`
    <div style="margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;margin-bottom:6px">
        <span style="font-size:13px;font-weight:700;color:${col}">${cy.phaseLabel||'--'}</span>
        <span style="font-size:13px;font-weight:900;color:${col}">${pct.toFixed(1)}%</span>
      </div>
      <div style="height:10px;background:var(--sf3);border-radius:5px;overflow:hidden">
        <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,var(--gr),${col});border-radius:5px;transition:width 1s"></div>
      </div>
    </div>
    ${[
      ['사이클', cy.cycleNumber ? cy.cycleNumber+'번째' : '--'],
      ['경과', cy.formattedElapsed||'--'],
      ['남은 기간', cy.formattedRemaining||'--'],
      ['마지막 반감기', cy.lastHalvingDate||'--'],
      ['다음 반감기', cy.nextHalvingDate||'--'],
    ].map(([l,v])=>row(l,v,'')).join('')}
    <div style="margin-top:12px;padding:10px;border-radius:8px;background:rgba(255,204,0,.07);border:1px solid rgba(255,204,0,.15);font-size:12px;color:var(--mu);line-height:1.6">${cy.phaseDescription||''}</div>`;
}
function renderCycleHeatmap(d){
  const c=el('cycle-heatmap');if(!c)return;
  const cy=d.api_dashboard_cycle||{};
  const dates=cy.heatmapDates||[];
  const rows=cy.heatmapRows||[];
  if(!dates.length||!rows.length)return;
  const colMap={up:'#00e57a',down:'#ff3d5a',amber:'#ffcc00',neutral:'#3a5470'};
  c.innerHTML=`<table style="width:100%;border-collapse:collapse;font-size:11px">
    <thead><tr><th style="color:var(--mu);padding:4px 6px;text-align:left;width:60px">구간</th>${dates.map(dt=>`<th style="color:var(--mu);padding:4px 4px;text-align:center">${dt}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r=>`<tr><td style="color:var(--mu);padding:4px 6px;white-space:nowrap">${r.label||''}</td>${
      r.cells.map(cell=>{
        const bg=colMap[cell.color]||'#3a5470';
        const v=parseFloat(cell.value||0);
        return`<td style="padding:3px 4px;text-align:center"><div style="background:${bg}33;border:1px solid ${bg}66;border-radius:4px;padding:3px 2px;color:${bg};font-weight:700">${v>0?'+':''}${v.toFixed(1)}%</div></td>`;
      }).join('')
    }</tr>`).join('')}</tbody></table>`;
}

// B-05: 90일 점수+BTC 복합 차트
function renderScore90Chart(d){
  const h=d.api_dashboard_cycle?.score90History||[];if(!h.length)return;
  const labels=h.map(e=>e.date.slice(5));
  mkChart('score90-ch',labels,[
    {label:'점수',data:h.map(e=>e.score),borderColor:'#3b9eff',backgroundColor:'rgba(59,158,255,.08)',fill:true,tension:.4,pointRadius:0,borderWidth:2,yAxisID:'y'},
    {label:'BTC',data:h.map(e=>e.btcClose?parseFloat(e.btcClose):null),borderColor:'#f7931a',backgroundColor:'rgba(247,147,26,.05)',fill:false,tension:.4,pointRadius:0,borderWidth:1.5,yAxisID:'y1'}
  ],{extra:{scales:{
    y:{position:'left',min:0,max:100,ticks:{color:'#3b9eff',font:{size:10}},grid:{color:'rgba(26,45,72,.4)'}},
    y1:{position:'right',ticks:{color:'#f7931a',callback:v=>'$'+Math.round(v/1000)+'k',font:{size:10}},grid:{drawOnChartArea:false}},
    x:{ticks:{color:'#5a7899',maxTicksLimit:10,font:{size:10}},grid:{color:'rgba(26,45,72,.4)'}}
  }}});
}

// B-02: 점수 분포 히스토그램
function renderScoreHistogram(d){
  const h=d.api_dashboard_buy_timing?.scoreHistogram||[];
  if(!h.length)return;
  mkChart('score-hist-ch',h.map(e=>e.label),[{
    label:'발생일수',data:h.map(e=>e.count),
    backgroundColor:h.map(e=>e.isToday?'rgba(59,158,255,.9)':e.color+'99'||'rgba(155,93,229,.5)'),
    borderColor:h.map(e=>e.isToday?'#3b9eff':e.color||'#9b5de5'),
    borderWidth:1,borderRadius:4
  }],{type:'bar',yFmt:v=>v+'일'});
}

// B-03: 가격-점수 다이버전스
function renderDivergenceChart(d){
  const h=d.api_dashboard_buy_timing?.priceDivergence||[];
  if(!h.length)return;
  const labels=h.map(e=>e.date.slice(5));
  mkChart('divergence-ch',labels,[
    {label:'점수',data:h.map(e=>e.score),borderColor:'#3b9eff',backgroundColor:'rgba(59,158,255,.1)',fill:true,tension:.4,pointRadius:3,borderWidth:2,yAxisID:'y'},
    {label:'BTC변화(%)',data:h.map(e=>parseFloat(e.pricePct)),borderColor:'#f7931a',backgroundColor:'rgba(247,147,26,.1)',fill:false,tension:.4,pointRadius:3,borderWidth:2,yAxisID:'y1'}
  ],{extra:{scales:{y:{position:'left',ticks:{color:'#3b9eff',font:{size:10}},grid:{color:'rgba(26,45,72,.4)'}},y1:{position:'right',ticks:{color:'#f7931a',callback:v=>v+'%',font:{size:10}},grid:{drawOnChartArea:false}},x:{ticks:{color:'#5a7899',font:{size:10}},grid:{color:'rgba(26,45,72,.4)'}}}}});
}

// B-04: 기간별 평균 점수 테이블
function renderWindowComparison(d){
  const c=el('window-rows');if(!c)return;
  const h=d.api_dashboard_buy_timing?.windowComparison||[];if(!h.length)return;
  const sc=v=>v>=70?'gr':v>=55?'bl':'ye';
  c.innerHTML=h.map(w=>
    `<div style="font-size:11px;font-weight:700;color:var(--bl);padding:6px 0 4px;border-bottom:1px solid var(--bd2);margin-bottom:6px">${w.window} 기준</div>`+
    [
      ['평균 점수', w.avgScore??'--', sc(w.avgScore??0)],
      ['매수 비율', w.buyPct||'--', 'gr'],
      ['평균 BTC',  w.avgBtc||'--', ''],
      ['샘플 수',   (w.n||0)+'일',  ''],
    ].map(([l,v,cc])=>row(l,v,cc)).join('')
  ).join('<div style="margin:10px 0;border-top:1px solid var(--bd)"></div>');
}

// B-01: DCA 존 시각화
function renderDcaZones(d){
  const c=el('dca-zones');if(!c)return;
  const bt=d.api_dashboard_buy_timing||{};
  const zones=bt.dcaZones||[];if(!zones.length)return;
  const score=bt.currentScore??0;
  const colorMap={success:'var(--gr)',warning:'var(--ye)',danger:'var(--re)',secondary:'var(--mu)'};
  c.innerHTML='<div style="font-size:10px;font-weight:700;color:var(--mu);text-transform:uppercase;letter-spacing:.6px;margin-bottom:10px">DCA 구간별 투입 비율</div>'+
    zones.map(z=>{
      const col=colorMap[z.color]||'var(--mu)';
      const active=z.active;
      return`<div style="display:flex;align-items:center;gap:10px;padding:7px 10px;border-radius:8px;margin-bottom:5px;border:1px solid ${active?col:'var(--bd)'};background:${active?col+'22':'transparent'}">
        <div style="width:34px;height:34px;border-radius:50%;border:2px solid ${col};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:${col};flex-shrink:0">${z.pct}%</div>
        <div style="flex:1">
          <div style="font-size:12px;font-weight:700;color:${active?col:'var(--tx)'}">${z.range}${active?' ← 현재':''}　</div>
          <div style="font-size:11px;color:var(--mu)">${z.signal}</div>
        </div>
        <div style="width:80px;height:6px;background:var(--sf3);border-radius:3px;overflow:hidden">
          <div style="height:100%;width:${z.pct===0?2:z.pct*3}%;background:${col};border-radius:3px"></div>
        </div>
      </div>`;
    }).join('');
}

// 펀딩비 히스토리 차트
function renderFundingChart(d){
  const h=d.api_dashboard_sentiment?.fundingHistory||[];
  if(!h.length)return;
  const vals=h.map(e=>parseFloat(e.value)*100);
  mkChart('funding-ch',h.map(e=>e.date.slice(5)),[{
    label:'펀딩비(%)',data:vals,
    backgroundColor:vals.map(v=>v>=0?'rgba(0,229,122,.5)':'rgba(255,61,90,.5)'),
    borderColor:vals.map(v=>v>=0?'#00e57a':'#ff3d5a'),
    borderWidth:1,borderRadius:3
  }],{type:'bar',yFmt:v=>v.toFixed(4)+'%'});
}

// 거래소 순유입 차트
function renderNetflowChart(d){
  const h=d.api_dashboard_onchain?.netflowHistory||[];
  if(!h.length)return;
  const vals=h.map(e=>parseFloat(e.value));
  mkChart('netflow-ch',h.map(e=>e.date.slice(5)),[{
    label:'순유입(BTC)',data:vals,
    backgroundColor:vals.map(v=>v>0?'rgba(255,61,90,.5)':'rgba(0,229,122,.5)'),
    borderColor:vals.map(v=>v>0?'#ff3d5a':'#00e57a'),
    borderWidth:1,borderRadius:3
  }],{type:'bar',yFmt:v=>Math.round(v)+' BTC'});
}

// DXY + S&P500 차트
function renderMacroCharts(d){
  const m=d.api_dashboard_macro||{};
  const dh=m.dxyHistory||[];
  if(dh.length)mkChart('dxy-ch',dh.map(e=>e.date.slice(5)),[{
    label:'DXY',data:dh.map(e=>parseFloat(e.value)),
    borderColor:'#ffcc00',
    backgroundColor:ctx=>{const g=ctx.chart.ctx.createLinearGradient(0,0,0,160);g.addColorStop(0,'rgba(255,204,0,.2)');g.addColorStop(1,'rgba(255,204,0,.01)');return g},
    fill:true,tension:.4,pointRadius:0,borderWidth:2
  }],{yFmt:v=>v.toFixed(2)});
  const sh=m.sp500History||[];
  if(sh.length)mkChart('sp500-ch',sh.map(e=>e.date.slice(5)),[{
    label:'S&P 500',data:sh.map(e=>parseFloat(e.value)),
    borderColor:'#3b9eff',
    backgroundColor:ctx=>{const g=ctx.chart.ctx.createLinearGradient(0,0,0,160);g.addColorStop(0,'rgba(59,158,255,.2)');g.addColorStop(1,'rgba(59,158,255,.01)');return g},
    fill:true,tension:.4,pointRadius:0,borderWidth:2
  }],{yFmt:v=>v.toLocaleString('ko-KR',{maximumFractionDigits:0})});
}

// 점수 예측 차트 (actual vs predicted)
function renderForecastChart(d){
  const pts=d.api_dashboard_forecast?.forecastPoints||[];
  if(!pts.length)return;
  const labels=pts.map(e=>e.date.slice(5));
  const actual=pts.map(e=>e.isActual?e.actual:null);
  const predicted=pts.map(e=>!e.isActual&&e.predicted!=null?e.predicted:null);
  mkChart('fc-ch',labels,[
    {label:'실제 점수',data:actual,borderColor:'#3b9eff',backgroundColor:'rgba(59,158,255,.15)',fill:true,tension:.4,pointRadius:0,borderWidth:2,spanGaps:false},
    {label:'예측 점수',data:predicted,borderColor:'#9b5de5',borderDash:[4,4],backgroundColor:'rgba(155,93,229,.1)',fill:true,tension:.4,pointRadius:0,borderWidth:2,spanGaps:false}
  ],{yMin:0,yMax:100});
}

init();
