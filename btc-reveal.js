/* 공유 스크롤 리빌 (프리뷰 iframe IntersectionObserver 미발화 대응 — rect 기반) */
(function(){
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function inView(el,m){var r=el.getBoundingClientRect();var h=window.innerHeight||document.documentElement.clientHeight;return r.top<h*(1-(m==null?0.06:m))&&r.bottom>0;}
  function fire(){document.querySelectorAll('.reveal:not(.in)').forEach(function(el){if(reduce||inView(el))el.classList.add('in');});}
  window.addEventListener('scroll',fire,{passive:true});
  window.addEventListener('resize',fire);
  fire();[60,200,500,1000].forEach(function(t){setTimeout(fire,t);});
})();
