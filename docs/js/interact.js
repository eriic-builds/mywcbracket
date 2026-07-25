// Interaction layer — adapted from wc26-bracket build_dashboard.py (JS constant).
// Wrapped in initInteractions() so it runs AFTER render.js injects the dashboard DOM.
import { initChampionCelebrationTrigger } from "./champion-celebration-trigger.js";

export function initInteractions({ onChampionCelebration } = {}){

return (function(){
 var lifecycle=new AbortController(),signal=lifecycle.signal,timers=new Set(),frames=new Set();
 function later(fn,delay){var id=setTimeout(function(){timers.delete(id);if(!signal.aborted)fn();},delay);timers.add(id);return id;}
 function cancelLater(id){clearTimeout(id);timers.delete(id);}
 function nextFrame(fn){var id=requestAnimationFrame(function(){frames.delete(id);if(!signal.aborted)fn();});frames.add(id);return id;}
 function cancelFrame(id){if(!id)return;cancelAnimationFrame(id);frames.delete(id);}
 var root=document.documentElement,LS=window.localStorage;
 document.body.classList.remove('map-expanded','map-fit-screen','map-fit-mirror','map-fit-sideways');
 root.classList.remove('map-fit-screen-root');
 var KTHEME='wcb.theme',KFAV='wcb.favs',KFO='wcb.favonly',KSC='wcb.scores.v3',KLAYOUT='wcb.bracket-layout';
 var FUN={focus:1,geocities:1,minecraft:1,winxp:1,sticker:1};
 var THEMES={dark:1,light:1,easy:1,focus:1,geocities:1,minecraft:1,winxp:1,sticker:1};
 function setTheme(t){if(!THEMES[t])t='dark';root.setAttribute('data-theme',t);document.querySelectorAll('.modes button').forEach(function(b){if(b.dataset.mode)b.classList.toggle('on',b.dataset.mode===t)});if(funBtn)funBtn.classList.toggle('on',!!FUN[t]);try{LS.setItem(KTHEME,t)}catch(e){}closeFun();if(window.__drawConn)later(window.__drawConn,80);}
 var funWrap=document.getElementById('funWrap'),funBtn=document.getElementById('funBtn');
 function closeFun(){if(funWrap){funWrap.classList.remove('open');if(funBtn)funBtn.setAttribute('aria-expanded','false');}}
 document.querySelectorAll('.modes button').forEach(function(b){if(b.dataset.mode)b.addEventListener('click',function(){setTheme(b.dataset.mode)})});
 if(funBtn){funBtn.addEventListener('click',function(e){e.stopPropagation();var open=funWrap.classList.toggle('open');funBtn.setAttribute('aria-expanded',open?'true':'false');});}
 document.addEventListener('click',function(e){if(funWrap&&!funWrap.contains(e.target))closeFun();},{signal:signal});
 document.addEventListener('keydown',function(e){if(e.key==='Escape')closeFun();},{signal:signal});
 var t0;try{t0=LS.getItem(KTHEME)}catch(e){}setTheme(t0||'dark');
 var favs={};try{favs=JSON.parse(LS.getItem(KFAV)||'{}')||{}}catch(e){favs={}}
 function saveFav(){try{LS.setItem(KFAV,JSON.stringify(favs))}catch(e){}}
 function isFav(t){return !!favs[t]}
 var search=document.getElementById('search'),favOnly=document.getElementById('favonly'),countEl=document.getElementById('count');
 var chips=[].slice.call(document.querySelectorAll('.chip[data-team]'));
 var teamCells=[].slice.call(document.querySelectorAll('.team[data-team]'));
 var ffCells=[].slice.call(document.querySelectorAll('.ff[data-team]'));
 var scRows=[].slice.call(document.querySelectorAll('.scrow[data-team]'));
 var allTeams={};teamCells.forEach(function(c){allTeams[c.dataset.team]=1});var TOTAL=Object.keys(allTeams).length;
 function paintFav(){document.querySelectorAll('.star').forEach(function(s){s.classList.toggle('fav',isFav(s.dataset.star));s.textContent=isFav(s.dataset.star)?'★':'☆';});teamCells.forEach(function(c){c.classList.toggle('fav',isFav(c.dataset.team))});}
 function apply(){var q=(search.value||'').trim().toLowerCase(),fo=favOnly.checked,shown={};
  function ok(t){if(fo&&!isFav(t))return false;if(q&&t.toLowerCase().indexOf(q)===-1)return false;return true;}
  teamCells.forEach(function(c){var g=ok(c.dataset.team);c.classList.toggle('dim',!g);if(g)shown[c.dataset.team]=1;});
  ffCells.forEach(function(c){c.classList.toggle('dim',!ok(c.dataset.team))});
  scRows.forEach(function(r){r.classList.toggle('dim',!r.dataset.team.split('|').some(ok))});
  chips.forEach(function(ch){ch.classList.toggle('on',q&&ch.dataset.team.toLowerCase()===q)});
  countEl.textContent='Showing '+((q||fo)?Object.keys(shown).length:TOTAL)+' of '+TOTAL+' teams';}
 search.addEventListener('input',apply);
 favOnly.addEventListener('change',function(){try{LS.setItem(KFO,favOnly.checked?'1':'0')}catch(e){}apply();});
 chips.forEach(function(ch){ch.addEventListener('click',function(e){if(e.target.classList.contains('star'))return;var t=ch.dataset.team;search.value=(search.value.trim().toLowerCase()===t.toLowerCase())?'':t;apply();});});
 document.querySelectorAll('.star').forEach(function(s){function tg(ev){ev.stopPropagation();var t=s.dataset.star;favs[t]=!isFav(t);if(!favs[t])delete favs[t];saveFav();paintFav();apply();}s.addEventListener('click',tg);s.addEventListener('keydown',function(ev){if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();tg(ev);}});});
 document.getElementById('clear').addEventListener('click',function(){search.value='';favOnly.checked=false;try{LS.setItem(KFO,'0')}catch(e){}apply();});
 document.getElementById('dab').addEventListener('click',function(){window.scrollTo({top:0,behavior:'smooth'})});
 try{if(LS.getItem(KFO)==='1')favOnly.checked=true;}catch(e){}
 var scores={};try{scores=JSON.parse(LS.getItem(KSC)||'{}')||{}}catch(e){scores={}}
 var rows=[].slice.call(document.querySelectorAll('.scrow[data-pick]'));
 function statusOf(r){return scores[r.dataset.pick]||r.dataset.default;}
 function saveScores(){try{LS.setItem(KSC,JSON.stringify(scores))}catch(e){}}
 function recalc(){var conf=0,live=0,out=0,MAXP=parseInt(document.getElementById('scMax').dataset.max||'80',10);
  rows.forEach(function(r){var st=statusOf(r),pts=+r.dataset.pts;
   r.classList.toggle('is-won',st==='won');r.classList.toggle('is-lost',st==='lost');
   r.querySelectorAll('.seg button').forEach(function(b){b.classList.toggle('on',b.dataset.set===st)});
   if(st==='won')conf+=pts;else if(st==='lost')out+=pts;else live+=pts;});
  function set(id,v){var el=document.getElementById(id);if(el)el.textContent=v;}
  set('scConfirmed',conf);set('scConfirmed2',conf);set('scLive',live);set('scOut',out);set('scMax',conf+live);set('scSoFar',conf+'/'+(conf+out));
  set('kpiConfirmed',conf);set('kpiLive',live);
  var ratio=MAXP>0?Math.max(0,Math.min(1,conf/MAXP)):0;
  var bar=document.getElementById('scBar');if(bar)bar.style.transform='scaleX('+ratio+')';}
 rows.forEach(function(r){r.querySelectorAll('.seg button').forEach(function(b){b.addEventListener('click',function(){var id=r.dataset.pick,s=b.dataset.set;if(s===r.dataset.default)delete scores[id];else scores[id]=s;saveScores();recalc();});});});
 var rst=document.getElementById('scReset');if(rst)rst.addEventListener('click',function(){scores={};saveScores();recalc();});
 // ---- bracket connector lines (elbow paths, coloured by whether each pick came true) ----
 function emptyObj(){return Object.create(null);}
 var _connT=0,_connF=0;
 var connectorCache={
   bracket:null,svg:null,rounds:[],roundTeamMaps:[],rows:[],cardsByCode:emptyObj(),teamsByCode:emptyObj(),finalCard:null,curtainMeta:new Map()
 };
 function invalidateConnectorCache(){
   connectorCache.bracket=null;connectorCache.svg=null;connectorCache.rounds=[];connectorCache.roundTeamMaps=[];connectorCache.rows=[];
   connectorCache.cardsByCode=emptyObj();connectorCache.teamsByCode=emptyObj();connectorCache.finalCard=null;connectorCache.curtainMeta=new Map();
 }
 function scheduleConnectorDraw(delay){
   cancelLater(_connT);
   _connT=later(function(){cancelFrame(_connF);_connF=nextFrame(drawConnectors);},delay||0);
 }
 function getConnectorContext(){
   var bracket=activeBracket();if(!bracket)return null;
   if(connectorCache.bracket===bracket&&connectorCache.svg&&connectorCache.svg.isConnected)return connectorCache;
   var svg=bracket.querySelector('.bksvg');if(!svg)return null;
   var rounds=[].slice.call(bracket.querySelectorAll('.round'));
   var roundTeamMaps=rounds.map(function(round){
     var map=emptyObj();round.querySelectorAll('.team[data-team]').forEach(function(team){map[team.dataset.team]=team;});return map;
   });
   var cards=[].slice.call(bracket.querySelectorAll('.mcard[data-match-code]'));
   var cardsByCode=emptyObj(),teamsByCode=emptyObj();
   cards.forEach(function(card){
     var code=card.getAttribute('data-match-code');if(!code)return;
     cardsByCode[code]=card;
     var teamMap=emptyObj();card.querySelectorAll('.team[data-team]').forEach(function(team){teamMap[team.dataset.team]=team;});
     teamsByCode[code]=teamMap;
   });
   var curtainMeta=new Map();
   bracket.querySelectorAll('.bkcol[data-side]').forEach(function(column){
     var side=column.dataset.side||'C',col=column.dataset.col||'5';
     var colCards=[].slice.call(column.children).filter(function(child){return child.classList.contains('mcard')});
     colCards.forEach(function(card,index){curtainMeta.set(card,{side:side,col:col,row:index,count:Math.max(1,colCards.length)});});
   });
   connectorCache={
     bracket:bracket,svg:svg,rounds:rounds,roundTeamMaps:roundTeamMaps,
     rows:[].slice.call(bracket.querySelectorAll('.team[data-feeder]')),
     cardsByCode:cardsByCode,teamsByCode:teamsByCode,finalCard:cardsByCode.M104||null,curtainMeta:curtainMeta
   };
   return connectorCache;
 }
 function activeBracket(){var w=document.querySelector('.brk-wrap');if(!w)return document.querySelector('.bracket');return w.querySelector('.bracket.layout-'+(w.getAttribute('data-layout')||'mirror')+'.mode-'+(w.getAttribute('data-view')||'actual'));}
 function drawConnectors(){
   if(signal.aborted||document.body.classList.contains('champion-celebration-active'))return;
   var context=getConnectorContext();if(!context)return;
   var bracket=context.bracket,svg=context.svg;
   if(!bracket||!svg) return;
   if(bracket.clientWidth===0)return;
   while(svg.firstChild)svg.removeChild(svg.firstChild);
   svg.setAttribute('width','0');svg.setAttribute('height','0');svg.removeAttribute('viewBox');
   var brect=bracket.getBoundingClientRect(),W=bracket.scrollWidth,Hh=bracket.scrollHeight;
   svg.setAttribute('width',W);svg.setAttribute('height',Hh);svg.setAttribute('viewBox','0 0 '+W+' '+Hh);
   function P(el){var r=el.getBoundingClientRect();return{r:r.right-brect.left+bracket.scrollLeft,l:r.left-brect.left+bracket.scrollLeft,y:(r.top+r.bottom)/2-brect.top+bracket.scrollTop};}
   function tagCurtainPath(path,card){
     var meta=context.curtainMeta&&context.curtainMeta.get(card);if(!meta)return;
     path.setAttribute('data-curtain-side',meta.side);
     path.setAttribute('data-curtain-col',meta.col);
     path.setAttribute('data-curtain-row',String(meta.row));
     path.setAttribute('data-curtain-count',String(meta.count));
   }
   function addCurtainPath(d,className,card){
     var path=document.createElementNS('http://www.w3.org/2000/svg','path');
     path.setAttribute('d',d);path.setAttribute('class',className);tagCurtainPath(path,card);svg.appendChild(path);
   }
   function addChampionPath(d,coreClass){
     var glow=document.createElementNS('http://www.w3.org/2000/svg','path');
     glow.setAttribute('d',d);glow.setAttribute('class','champion-link glow');svg.appendChild(glow);
     var core=document.createElementNS('http://www.w3.org/2000/svg','path');
     core.setAttribute('d',d);core.setAttribute('class',coreClass);svg.appendChild(core);
   }
   if(bracket.classList.contains('layout-sideways')){
     var rounds=context.rounds;
     for(var ri=1;ri<rounds.length;ri++){
       var targets=[].slice.call(rounds[ri].querySelectorAll('.team[data-team]'));
       var prev=context.roundTeamMaps[ri-1]||emptyObj();
       targets.forEach(function(tb){
         var team=tb.getAttribute('data-team');
         var src=prev[team];
         if(!src)return;
         var a=P(src),b=P(tb),x1=a.r+1,x2=b.l-1,curve=Math.max(8,Math.round((x2-x1)*.42));
         var d='M'+Math.round(x1)+' '+Math.round(a.y)+' C'+Math.round(x1+curve)+' '+Math.round(a.y)+' '+Math.round(x2-curve)+' '+Math.round(b.y)+' '+Math.round(x2)+' '+Math.round(b.y);
         var champion=!!tb.closest('.champcol');
         var st=tb.classList.contains('st-won')?'won':tb.classList.contains('st-lost')?'lost':tb.classList.contains('st-actual')?'actual':'pending';
         var gone=tb.classList.contains('gone');
         if(champion){addChampionPath(d,'conn c-champion');return;}
         var p=document.createElementNS('http://www.w3.org/2000/svg','path');
         p.setAttribute('d',d);p.setAttribute('class','conn c-'+st+(gone?' gone':''));svg.appendChild(p);
       });
     }
     return;
   }
   context.rows.forEach(function(row){
       var parentCard=row.closest('.mcard');
       var fromCard=context.cardsByCode[row.dataset.feeder];
       if(!parentCard||!fromCard)return;
       var side=parentCard.closest('.bkcol').dataset.side;
       if(side==='C')side=fromCard.closest('.bkcol').dataset.side;
       var source=row.dataset.team?(context.teamsByCode[row.dataset.feeder]||emptyObj())[row.dataset.team]:null;
       var a=P(source||fromCard),b=P(row);
       var x1=side==='R'?a.l:a.r,x2=side==='R'?b.r:b.l,xm=Math.round((x1+x2)/2);
       var st=row.classList.contains('st-won')||row.classList.contains('adv')?'won':
         row.classList.contains('st-lost')||row.classList.contains('busted')?'lost':
         row.classList.contains('st-actual')||row.classList.contains('realadv')?'actual':'pending';
       var gone=row.classList.contains('gone');
       var pathClass='conn c-'+st+(gone?' gone':'');
       addCurtainPath('M'+Math.round(x1)+' '+Math.round(a.y)+' H'+xm,pathClass,fromCard);
       addCurtainPath('M'+xm+' '+Math.round(a.y)+' V'+Math.round(b.y)+' H'+Math.round(x2),pathClass,parentCard);
   });
   var championTarget=bracket.querySelector('.champ-state .team.champ[data-team]');
  var finalCard=context.finalCard;
   if(championTarget&&finalCard){
     var championTeam=championTarget.dataset.team;
     var finalSource=[].slice.call(finalCard.querySelectorAll('.team[data-team]')).find(function(candidate){return candidate.dataset.team===championTeam;});
     var from=P(finalSource||finalCard),to=P(championTarget);
     var centerX=Math.round((from.l+from.r)/2);
     var championD='M'+centerX+' '+Math.round(from.y)+' V'+Math.round(to.y);
     addChampionPath(championD,'champion-link');
   }
 }
 window.__drawConn=drawConnectors;
 if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){if(!signal.aborted&&window.__drawConn===drawConnectors)scheduleConnectorDraw(0);});
 var celebrationTrigger=null;
 document.querySelectorAll('.brk-toggle button').forEach(function(bt){bt.addEventListener('click',function(){var w=document.querySelector('.brk-wrap');if(w.getAttribute('data-view')!==bt.dataset.view&&celebrationTrigger)celebrationTrigger.reset();w.setAttribute('data-view',bt.dataset.view);invalidateConnectorCache();document.querySelectorAll('.brk-toggle button').forEach(function(x){x.classList.toggle('on',x===bt);});scheduleConnectorDraw(60);});});
 var layoutWrap=document.querySelector('.brk-wrap'),layoutButtons=[].slice.call(document.querySelectorAll('.layout-toggle button'));
 function setLayout(layout,persist){
   if(!layoutWrap)return;
   if(layout==='sideways'&&window.innerWidth<=860)layout='mirror';
   if(layoutWrap.getAttribute('data-layout')!==layout&&celebrationTrigger)celebrationTrigger.reset();
   layoutWrap.setAttribute('data-layout',layout);
   invalidateConnectorCache();
   syncExpandedLayout();
   layoutButtons.forEach(function(button){var on=button.dataset.layout===layout;button.classList.toggle('on',on);button.setAttribute('aria-pressed',on?'true':'false');});
   if(persist)try{LS.setItem(KLAYOUT,layout)}catch(e){}
   scheduleConnectorDraw(60);
 }
 layoutButtons.forEach(function(button){button.addEventListener('click',function(){setLayout(button.dataset.layout,true);});});
 var savedLayout='mirror';try{savedLayout=LS.getItem(KLAYOUT)||'mirror'}catch(e){}
 setLayout(savedLayout,false);
 if(layoutWrap)celebrationTrigger=initChampionCelebrationTrigger({
   wrap:layoutWrap,
   getActiveBracket:activeBracket,
   onTrigger:typeof onChampionCelebration==='function'?onChampionCelebration:function(){},
   signal:signal
 });
 var mapExpandButton=document.getElementById('mapExpandToggle');
 function jumpWithoutMotion(target){
   var previous=root.style.scrollBehavior;
   root.style.scrollBehavior='auto';
   if(target)target.scrollIntoView({block:'start',behavior:'auto'});else window.scrollTo(0,0);
   nextFrame(function(){root.style.scrollBehavior=previous;});
 }
 function syncExpandedLayout(){
   var fit=document.body.classList.contains('map-expanded')&&!!layoutWrap;
   document.body.classList.toggle('map-fit-screen',fit);
   document.body.classList.toggle('map-fit-mirror',fit&&layoutWrap.dataset.layout==='mirror');
   document.body.classList.toggle('map-fit-sideways',fit&&layoutWrap.dataset.layout==='sideways');
   root.classList.toggle('map-fit-screen-root',fit);
   if(fit)nextFrame(function(){jumpWithoutMotion(null);});
 }
 function setMapExpanded(expanded,returnFocus){
   if(!mapExpandButton)return;
   if(expanded&&window.innerWidth<=860)return;
   document.body.classList.toggle('map-expanded',expanded);
   syncExpandedLayout();
   mapExpandButton.classList.toggle('on',expanded);
   mapExpandButton.setAttribute('aria-expanded',expanded?'true':'false');
   mapExpandButton.textContent=expanded?'Collapse table':'Expand table';
   nextFrame(function(){
     var target=document.getElementById(expanded?'sec-bracket-body':'sec-bracket');
    if(target)jumpWithoutMotion(target);
     if(returnFocus)mapExpandButton.focus();
     scheduleConnectorDraw(60);
   });
 }
 if(mapExpandButton)mapExpandButton.addEventListener('click',function(){setMapExpanded(!document.body.classList.contains('map-expanded'),false);});
 document.addEventListener('keydown',function(e){if(e.key==='Escape'&&document.body.classList.contains('map-expanded')){e.preventDefault();setMapExpanded(false,true);}},{signal:signal});
 document.querySelectorAll('.res-toggle button').forEach(function(bt){bt.addEventListener('click',function(){var w=document.querySelector('.res-wrap');w.setAttribute('data-view',bt.dataset.view);document.querySelectorAll('.res-toggle button').forEach(function(x){x.classList.toggle('on',x===bt);});});});
 document.querySelectorAll('.sec-toggle').forEach(function(bt){bt.addEventListener('click',function(){var body=document.getElementById(bt.getAttribute('aria-controls'));if(!body)return;var open=bt.getAttribute('aria-expanded')!=='false';bt.setAttribute('aria-expanded',open?'false':'true');body.classList.toggle('collapsed',open);if(!body.classList.contains('collapsed')&&body.querySelector('.bracket')&&window.__drawConn)scheduleConnectorDraw(60);});});
 var _rt;window.addEventListener('resize',function(){cancelLater(_rt);_rt=later(function(){if(window.innerWidth<=860&&document.body.classList.contains('map-expanded'))setMapExpanded(false,false);if(layoutWrap&&layoutWrap.dataset.layout==='sideways'&&window.innerWidth<=860)setLayout('mirror',true);else{invalidateConnectorCache();scheduleConnectorDraw(0);}},120);},{signal:signal});
 window.addEventListener('load',function(){scheduleConnectorDraw(60);},{signal:signal});
 // ---- hover: quick World Cup stat card on each team box ----
 var card=document.getElementById('statcard'),cardFrame=0,cardX=0,cardY=0,cardW=0,cardH=0;
 function placeCard(){cardFrame=0;var pad=14,x=cardX+16,y=cardY+16;
   if(x+cardW>window.innerWidth-pad)x=cardX-cardW-16; if(x<pad)x=pad;
   if(y+cardH>window.innerHeight-pad)y=window.innerHeight-cardH-pad; if(y<pad)y=pad;
   card.style.translate=x+'px '+y+'px';}
 function posCard(ev){if(!card.classList.contains('show'))return;cardX=ev.clientX;cardY=ev.clientY;if(!cardFrame)cardFrame=nextFrame(placeCard);}
 function showCard(el,ev){var t=el.getAttribute('data-team'),s=window.WCSTATS&&window.WCSTATS[t]; if(!s||!card)return;
   card.innerHTML='<div class="sc-name"><span class="seed">'+(s.s||'')+'</span>'+t+'</div>'
     +'<div class="sc-row"><span class="k">World Cup titles</span><span class="v gold">'+(s.t?('🏆 '+s.t):'—')+'</span></div>'
     +'<div class="sc-row"><span class="k">Best finish</span><span class="v">'+s.b+'</span></div>';
   cardW=card.offsetWidth;cardH=card.offsetHeight;cardX=ev.clientX;cardY=ev.clientY;placeCard();card.classList.add('show');}
 document.querySelectorAll('.team[data-team]').forEach(function(el){
   el.addEventListener('mouseenter',function(ev){showCard(el,ev)});
   el.addEventListener('mousemove',posCard);
   el.addEventListener('mouseleave',function(){cancelFrame(cardFrame);cardFrame=0;card.classList.remove('show')});});
 window.addEventListener('resize',function(){if(card.classList.contains('show')){cardW=card.offsetWidth;cardH=card.offsetHeight;placeCard();}},{signal:signal});
 paintFav();apply();recalc();drawConnectors();
 // ── side-nav rail: mobile toggle + scrollspy ──
 var rail=document.getElementById('rail'),navToggle=document.getElementById('navToggle');
 if(navToggle&&rail){navToggle.addEventListener('click',function(){var o=rail.classList.toggle('open');navToggle.setAttribute('aria-expanded',o?'true':'false');});}
 var railLinks=rail?rail.querySelectorAll('.links a'):[];
 if(railLinks.length){
   var linkFor={};
   railLinks.forEach(function(a){linkFor[a.getAttribute('href').slice(1)]=a;a.addEventListener('click',function(){rail.classList.remove('open');if(navToggle)navToggle.setAttribute('aria-expanded','false');});});
   var secs=document.querySelectorAll('#intro, .shead[id]');
   var spy=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting){railLinks.forEach(function(l){l.classList.remove('active');});var a=linkFor[e.target.id];if(a)a.classList.add('active');}});},{rootMargin:'-45% 0px -50% 0px',threshold:0});
   secs.forEach(function(s){spy.observe(s);});
 }
 return function(){
   if(celebrationTrigger)celebrationTrigger.reset();
   lifecycle.abort();
   timers.forEach(function(id){clearTimeout(id);});timers.clear();
   frames.forEach(function(id){cancelAnimationFrame(id);});frames.clear();
   cancelLater(_connT);cancelFrame(_connF);invalidateConnectorCache();
   if(spy)spy.disconnect();
   if(window.__drawConn===drawConnectors)delete window.__drawConn;
   document.body.classList.remove('map-expanded','map-fit-screen','map-fit-mirror','map-fit-sideways');
   root.classList.remove('map-fit-screen-root');
 };
})();

}
