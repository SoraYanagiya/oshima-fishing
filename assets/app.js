/* app.js — タブ切り替え、スキンの切り替え、起動。最後に読み込む。 */
(function(){
'use strict';
var OS=window.OS, D=document;

/* ---------- スキン ---------- */
var SKINS=[['nature','自然'],['nintendo','コンソール'],['dell','カタログ']];
function currentSkin(){
  var s=D.documentElement.getAttribute('data-skin')||'nature';
  return SKINS.some(function(k){return k[0]===s})?s:'nature';
}
function setSkin(name){
  if(!SKINS.some(function(k){return k[0]===name}))return;
  D.documentElement.setAttribute('data-skin',name);
  var link=D.getElementById('skin');
  if(link)link.href='assets/skin-'+name+'.css';
  try{localStorage.setItem('oshima-skin',name);}catch(e){}
  D.querySelectorAll('.skinbtn').forEach(function(b){
    b.setAttribute('aria-pressed',String(b.dataset.skin===name));
  });
}
(function buildSkinPicker(){
  var box=D.getElementById('skinpicker');
  if(!box)return;
  box.innerHTML='<span class="eyebrow">SKIN</span>'+SKINS.map(function(k){
    return '<button type="button" class="skinbtn" data-skin="'+k[0]+'">'+k[1]+'</button>';
  }).join('');
  box.querySelectorAll('.skinbtn').forEach(function(b){
    b.addEventListener('click',function(){setSkin(b.dataset.skin);});
  });
  setSkin(currentSkin());
})();

/* ---------- タブ ---------- */
(function(){
  var tabs=[].slice.call(D.querySelectorAll('.tb'));
  var cur='home';
  try{cur=localStorage.getItem('oshima-tab')||'home';}catch(e){}
  var hmap={weather:'home',tide:'home',spots:'map',shops:'map',gear:'gear',dex:'dex',list:'list'};
  var h=(location.hash||'').slice(1);
  if(hmap[h])cur=hmap[h];
  if(!tabs.some(function(b){return b.dataset.t===cur}))cur='home';
  function show(t,scroll){
    cur=t;
    D.querySelectorAll('[data-tab]').forEach(function(el){el.classList.toggle('act',el.dataset.tab===t);});
    tabs.forEach(function(b){
      var on=b.dataset.t===t;
      b.classList.toggle('on',on);
      b.setAttribute('aria-current',on?'page':'false');
    });
    try{localStorage.setItem('oshima-tab',t);}catch(e){}
    if(scroll)window.scrollTo(0,0);
  }
  tabs.forEach(function(b){b.addEventListener('click',function(){show(b.dataset.t,true);});});
  D.body.classList.add('mob');
  show(cur,false);
})();

/* ---------- 起動 ---------- */
OS.fillCatchForm();
OS.buildPickers();
OS.renderGearTab();
OS.renderDex();
OS.renderList();
OS.renderWeather();   /* まず目安の値で描いて、すぐ使える状態にする */
OS.loadLive();        /* そのあと最新の予報で差し替える */
OS.icons();
})();
