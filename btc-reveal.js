/* 공유 스크롤 리빌 — rAF 스로틀로 scroll jitter 방지 */
(function(){
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ticking=false;
  var pending=[];

  function inView(el,m){
    var r=el.getBoundingClientRect();
    var h=window.innerHeight||document.documentElement.clientHeight;
    return r.top<h*(1-(m==null?0.06:m))&&r.bottom>0;
  }

  function fire(){
    var items=document.querySelectorAll('.reveal:not(.in)');
    for(var i=0;i<items.length;i++){
      if(reduce||inView(items[i]))items[i].classList.add('in');
    }
    ticking=false;
  }

  function onScroll(){
    if(!ticking){
      requestAnimationFrame(fire);
      ticking=true;
    }
  }

  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',onScroll,{passive:true});
  fire();
  [60,200,500,1000].forEach(function(t){setTimeout(fire,t);});
})();
