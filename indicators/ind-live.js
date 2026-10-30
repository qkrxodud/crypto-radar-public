/* ===========================================================================
 * ind-live.js — 지표 상세 페이지 "오늘의 값 · 종합 점수 안에서의 위치" 렌더러
 * data/snapshot.json 하나만 읽는다(실시간 호출 없음). 데이터가 없으면 '--' 유지.
 * 페이지는 <section id="liveSec" data-ind="slug"> 정적 텍스트를 먼저 갖고,
 * 이 스크립트는 숫자 칸(#lvRaw, #lvNorm, #lvDate)과 추이(#lvSeries)만 채운다.
 * ========================================================================= */
(function(){
  'use strict';
  var sec=document.getElementById('liveSec'); if(!sec) return;
  var slug=sec.getAttribute('data-ind');
  var num=function(v,d){ if(v==null||v==='') return null; var n=Number(v); return isNaN(n)?null:(d==null?n:Number(n.toFixed(d))); };
  var fmt=function(n,d){ return n==null?'--':n.toLocaleString('ko-KR',{minimumFractionDigits:d||0,maximumFractionDigits:d||0}); };
  var pct=function(n,d){ return n==null?'--':(n>0?'+':'')+n.toFixed(d==null?2:d)+'%'; };

  // 지표별: 원값 추출(raw), 보조 설명(sub), 정규화 점수 키(norm), 추이(series: {type:'heat'|'line', ...})
  var CFG={
    'fear-greed-index':{raw:function(D){return num(D.api_dashboard_sentiment.fearGreed);},fmt:function(v){return fmt(v);},sub:function(D){var m=D.api_dashboard_sentiment.fearGreedMa||{};return '30일 평균 '+fmt(num(m.fgMa30,1),1)+' · 연속 공포 '+(m.consecutiveFear||0)+'일';},norm:'공포탐욕',series:{type:'heat',label:'Fear&Greed',d:0}},
    'halving-cycle':{raw:function(D){return num(D.api_dashboard.halvingDaysAfter);},fmt:function(v){return fmt(v)+'일';},sub:function(D){var h=(D.api_dashboard_cycle||{}).halvingCycle||{};return '2024-04-20 반감기 이후 · 진행 '+(h.position||'--')+' · '+(h.phaseLabel||'');},norm:'반감기사이클'},
    'mvrv-z-score':{raw:function(D){return num(D.api_dashboard_onchain.mvrvZScore,2);},fmt:function(v){return fmt(v,2);},sub:function(D){return '실현가격 $'+fmt(num(D.api_dashboard_onchain.realizedPrice,0))+' · 현재가 $'+fmt(num(D.api_dashboard_onchain.btcClose,0));},norm:'MVRV Z',series:{type:'heat',label:'MVRV',d:2}},
    'nupl':{raw:function(D){return num(D.api_dashboard_onchain.nupl,2);},fmt:function(v){return fmt(v,2);},sub:function(D){var v=num(D.api_dashboard_onchain.nupl,2);return v==null?'':(v<0?'전체 보유자 평균 손실 상태':v<0.25?'희망·공포 (얕은 이익)':v<0.5?'낙관·불안':v<0.75?'믿음·부정':'행복감·탐욕');},norm:'NUPL',series:{type:'heat',label:'NUPL',d:2}},
    'pi-cycle':{raw:function(D){return num(D.api_dashboard_technical.piCycleGap,2);},fmt:function(v){return fmt(v,2);},sub:function(){return '111일 MA와 350일 MA×2 사이의 간격(비율). 0에 가까울수록 고점 경고';},norm:'Pi사이클'},
    'rsi':{raw:function(D){return num(D.api_dashboard_technical.rsiDaily,1);},fmt:function(v){return fmt(v,1);},sub:function(D){var t=D.api_dashboard_technical;return '주봉 '+fmt(num(t.rsiWeekly,1),1)+' · 월봉 '+fmt(num(t.rsiMonthly,1),1);},norm:'RSI(일)',norm2:{key:'RSI(주)',label:'주봉 정규화'},series:{type:'heat',label:'RSI',d:1}},
    'ma200-deviation':{raw:function(D){return num(D.api_dashboard_technical.ma200Ratio,2);},fmt:function(v){return fmt(v,2)+'배';},sub:function(D){var t=D.api_dashboard_technical;return 'MA200 $'+fmt(num(t.ma200Value,0))+' · 이격 '+pct(num(t.ma200DistancePct,1),1);},norm:'MA200비율'},
    'macd':{raw:function(D){return num((D.api_dashboard_technical.macd||{}).histogram,0);},fmt:function(v){return (v>0?'+':'')+fmt(v);},sub:function(D){var m=D.api_dashboard_technical.macd||{};return 'MACD '+fmt(num(m.macdLine,0))+' · 시그널 '+fmt(num(m.signalLine,0))+' · '+(m.crossLabel||'');},norm:null},
    'historical-volatility':{raw:function(D){var v=num(D.api_dashboard_technical.historicalVolatility);return v==null?null:v*100;},fmt:function(v){return fmt(v,0)+'%';},sub:function(D){var iv=(D.api_dashboard_sentiment.ivRv||{});return '옵션 내재변동성(IV30) '+fmt(num(iv.iv,1),1)+'% · IV−HV '+(iv.spread||'--');},norm:'변동성(HV)'},
    'funding-rate':{raw:function(D){var v=num(D.api_dashboard_sentiment.fundingRate);return v==null?null:v*100;},fmt:function(v){return (v>0?'+':'')+v.toFixed(4)+'%';},sub:function(D){var s=D.api_dashboard_sentiment;return '8시간 기준 · 7일 누적 '+pct(num(s.cumulativeFunding7d)*100,3)+' · 30일 누적 '+pct(num(s.cumulativeFunding30d)*100,3);},norm:'펀딩비',series:{type:'line',get:function(D){return (D.api_dashboard_sentiment.fundingHistory||[]).map(function(x){return {d:x.date,v:num(x.value)*100};});},unit:'%',d:4,title:'최근 7일 펀딩비 (8h, %)'}},
    'open-interest':{raw:function(D){return num(D.api_dashboard_sentiment.openInterestRatio,2);},fmt:function(v){return fmt(v,2)+'배';},sub:function(D){var l=D.api_dashboard_liquidation_heatmap||{};return '30일 평균 대비 · 명목 OI $'+fmt(num(l.openInterestUsd)/1e9,2)+'B';},norm:'OI비율'},
    'long-short-ratio':{raw:function(D){return num(D.api_dashboard_sentiment.longShortRatio,2);},fmt:function(v){return fmt(v,2);},sub:function(D){var s=D.api_dashboard_sentiment;return '테이커 매수/매도 '+fmt(num(s.takerBuySellRatio,2),2)+' · 롱 계정 비중 '+fmt(num((D.api_dashboard_liquidation_heatmap||{}).longAccountRatio)*100,1)+'%';},norm:'롱숏비율'},
    'liquidation-heatmap':{raw:function(D){var l=D.api_dashboard_liquidation_heatmap||{};return num(l.downsideLiquidationUsd)/1e9;},fmt:function(v){return '$'+fmt(v,2)+'B';},sub:function(D){var l=D.api_dashboard_liquidation_heatmap||{};return '하락 시 청산 추정 · 상승 시 $'+fmt(num(l.upsideLiquidationUsd)/1e9,2)+'B · '+(l.cascadeLabel||'');},norm:null},
    'sopr':{raw:function(D){return num(D.api_dashboard_onchain.sopr,4);},fmt:function(v){return fmt(v,4);},sub:function(D){var v=num(D.api_dashboard_onchain.sopr,4);return v==null?'':(v>1?'이동한 코인이 평균 이익 실현 중':v<1?'평균 손실 상태로 이동(항복 쪽)':'손익분기');},norm:'SOPR',series:{type:'heat',label:'SOPR',d:2}},
    'holder-supply':{raw:function(D){return num(D.api_dashboard_onchain.lthSthRatio,3);},fmt:function(v){return fmt(v,3);},sub:function(){return 'LTH/STH 공급 비율 · 높을수록 장기 보유자 우위';},norm:'LTH/STH'},
    'exchange-net-flow':{raw:function(D){return num(D.api_dashboard_onchain.exchangeNetFlow,0);},fmt:function(v){return (v>0?'+':'')+fmt(v)+' BTC';},sub:function(D){return '거래소 보유량 '+fmt(num(D.api_dashboard_onchain.exchangeReserve,0))+' BTC · 양수 = 순유입(잠재 매도)';},norm:null,series:{type:'line',get:function(D){return (D.api_dashboard_onchain.netflowHistory||[]).map(function(x){return {d:x.date,v:num(x.value)};});},unit:' BTC',d:0,title:'최근 7일 거래소 순유입 (BTC)'}},
    'puell-multiple':{raw:function(D){return num(D.api_dashboard_onchain.puellMultiple,2);},fmt:function(v){return fmt(v,2);},sub:function(){return '일일 채굴 수익 ÷ 365일 평균 · 1 근처 = 평년';},norm:'Puell Multiple'},
    'hash-rate':{raw:function(D){return num(D.api_dashboard_onchain.hashRate,0);},fmt:function(v){return fmt(v)+' EH/s';},sub:function(D){var h=D.api_dashboard_hash_ribbon||{};return '해시리본 30일 MA '+fmt(num(h.ma30,0))+' / 50일 MA '+fmt(num(h.ma50,0))+' · '+(h.label||'');},norm:'Hash Rate',series:{type:'line',get:function(D){return ((D.api_dashboard_hash_ribbon||{}).history||[]).slice(-30).map(function(x){return {d:x.date,v:num(x.hashRate)};});},unit:' EH/s',d:0,title:'최근 30일 해시레이트 (EH/s)'}},
    'dollar-index-dxy':{raw:function(D){return num(D.api_dashboard_macro.dxy,2);},fmt:function(v){return fmt(v,2);},sub:function(D){return '미국 10년물 '+fmt(num(D.api_dashboard_macro.usTreasury10y,2),2)+'% · 금 $'+fmt(num(D.api_dashboard_macro.goldPrice,0));},norm:'DXY',series:{type:'line',get:function(D){return (D.api_dashboard_macro.dxyHistory||[]).map(function(x){return {d:x.date,v:num(x.value)};});},unit:'',d:2,title:'최근 30일 DXY'}},
    'sp500':{raw:function(D){return num(D.api_dashboard_macro.sp500,0);},fmt:function(v){return fmt(v);},sub:function(D){return 'VIX '+fmt(num(D.api_dashboard_macro.vix,1),1)+' · 연방기금금리 '+fmt(num(D.api_dashboard_macro.fedFundsRate,2),2)+'%';},norm:'S&P500',series:{type:'line',get:function(D){return (D.api_dashboard_macro.sp500History||[]).map(function(x){return {d:x.date,v:num(x.value)};});},unit:'',d:0,title:'최근 30일 S&P 500'}},
    'kimchi-premium':{raw:function(D){return num(D.api_dashboard_macro.kimchiPremium,2);},fmt:function(v){return pct(v,2);},sub:function(){return '빗썸 KRW 가격 vs 해외 USD 가격(실시간 환율 보정)';},norm:'김치프리미엄',series:{type:'heat',label:'김치P',d:2}},
    'etf-net-flow':{raw:function(D){return num(D.api_dashboard_macro.btcEtfNetFlow,1);},fmt:function(v){return (v>0?'+':'')+'$'+fmt(v,1)+'M';},sub:function(D){var e=D.api_dashboard_etf_flow_history||{};return '최근 90일 누적 '+(e.total90d?'$'+fmt(num(e.total90d,0))+'M':'--')+' · 추세 '+(e.trend||'--')+(D.api_dashboard_macro.btcEtfNetFlowEstimated?' · 추정치':'');},norm:null,series:{type:'line',get:function(D){return (((D.api_dashboard_etf_flow_history||{}).history)||[]).slice(-30).map(function(x){return {d:x.date,v:num(x.daily)};});},unit:'M',d:0,title:'최근 30거래일 미국 현물 ETF 일별 순유입 ($M)'}}
  };
  var cfg=CFG[slug]; if(!cfg) return;
  var ge=function(id){return document.getElementById(id);};

  function drawLine(cv,pts,unit,d){
    var W=cv.clientWidth||600,H=140; cv.width=W*2; cv.height=H*2; var c=cv.getContext('2d'); c.scale(2,2);
    var vals=pts.map(function(p){return p.v;}).filter(function(v){return v!=null;}); if(vals.length<2) return;
    var mn=Math.min.apply(null,vals),mx=Math.max.apply(null,vals); if(mn===mx){mn-=1;mx+=1;}
    var padL=8,padR=8,padT=14,padB=22; var x=function(i){return padL+(W-padL-padR)*i/(pts.length-1);}; var y=function(v){return padT+(H-padT-padB)*(1-(v-mn)/(mx-mn));};
    // 0선(값이 양·음 걸칠 때)
    if(mn<0&&mx>0){c.strokeStyle='rgba(255,255,255,.12)';c.setLineDash([3,3]);c.beginPath();c.moveTo(padL,y(0));c.lineTo(W-padR,y(0));c.stroke();c.setLineDash([]);}
    c.strokeStyle='#16c784';c.lineWidth=1.8;c.beginPath();
    pts.forEach(function(p,i){ if(p.v==null) return; i===0?c.moveTo(x(i),y(p.v)):c.lineTo(x(i),y(p.v)); }); c.stroke();
    var last=pts[pts.length-1]; c.fillStyle='#16c784'; c.beginPath(); c.arc(x(pts.length-1),y(last.v),3,0,Math.PI*2); c.fill();
    c.fillStyle='#8b93a7'; c.font='10px JetBrains Mono, monospace';
    c.fillText(pts[0].d, padL, H-6); var t=last.d; c.fillText(t, W-padR-c.measureText(t).width, H-6);
    c.fillText('max '+fmt(mx,d), padL, 10); var lo='min '+fmt(mn,d); c.fillText(lo, W-padR-c.measureText(lo).width, 10);
  }

  fetch('../data/snapshot.json?v='+Math.floor(Date.now()/600000)).then(function(r){return r.json();}).then(function(j){
    var D=(j&&j.data)||{};
    if(!D.api_dashboard) return;
    var raw=null; try{ raw=cfg.raw(D); }catch(e){}
    if(raw!=null){ ge('lvRaw').textContent=cfg.fmt(raw); }
    try{ var sub=cfg.sub(D); if(sub) ge('lvRawSub').textContent=sub; }catch(e){}
    var bd=(D.api_dashboard.indicatorBreakdown)||{};
    if(cfg.norm){ var nv=bd[cfg.norm]; if(nv!=null){ ge('lvNorm').textContent=nv; ge('lvNormBar').style.width=Math.max(2,Math.min(100,nv))+'%'; ge('lvNormBar').style.background=nv>=65?'#16c784':nv>=40?'#f0b90b':'#ea3943'; } }
    if(cfg.norm2&&bd[cfg.norm2.key]!=null){ var n2=ge('lvNorm2'); if(n2){ n2.textContent=cfg.norm2.label+' '+bd[cfg.norm2.key]; n2.style.display=''; } }
    var dt=D.api_dashboard.dataDate||(j.updatedAt||'').slice(0,10); ge('lvDate').textContent=dt||'--';
    ge('lvScore').textContent=D.api_dashboard.score!=null?D.api_dashboard.score+'점 · '+(D.api_dashboard.signalDisplay||''):'--';
    // 추이
    var s=cfg.series, box=ge('lvSeries'); if(!s||!box) return;
    if(s.type==='heat'){
      var rows=((D.api_dashboard_cycle||{}).heatmapRows)||[]; var row=null; rows.forEach(function(r){ if(r.label===s.label) row=r; });
      if(!row) return;
      box.innerHTML='<div class="lv-heat-t">최근 7일 추이</div><div class="lv-heat">'+row.cells.map(function(c){var v=num(c.value,s.d);return '<div class="hc '+(c.color||'')+'"><span class="hd">'+c.date+'</span><span class="hv">'+(v==null?'--':fmt(v,s.d))+'</span></div>';}).join('')+'</div>';
      box.style.display='';
    } else if(s.type==='line'){
      var pts=[]; try{ pts=s.get(D).filter(function(p){return p.v!=null;}); }catch(e){}
      if(pts.length<2) return;
      box.innerHTML='<div class="lv-heat-t">'+s.title+'</div><canvas class="lv-cv"></canvas>';
      box.style.display=''; drawLine(box.querySelector('canvas'),pts,s.unit,s.d);
    }
  }).catch(function(e){ console.warn('[ind-live] snapshot load failed', e); });
})();
