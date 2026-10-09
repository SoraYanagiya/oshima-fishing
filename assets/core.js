/* core.js — 共有ヘルパー、保存データ、装備の状態、ドット絵スプライト。
   他のモジュールはすべてここに依存する。 */
(function(){
'use strict';
var OS=window.OS;

/* ---------- 小物 ---------- */
OS.icons=function(){try{window.lucide&&lucide.createIcons();}catch(e){}};
OS.esc=function(t){return String(t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})};
OS.uid=function(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)};
OS.today=function(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};

var tt;
OS.toast=function(msg){
  var t=document.getElementById('toast');
  t.textContent=msg;t.hidden=false;clearTimeout(tt);
  tt=setTimeout(function(){t.hidden=true},2600);
};
/* 文字ボタン：1回目で武装、2回目で実行 */
OS.armDelete=function(btn,fn){
  if(btn.classList.contains('armed')){fn();return;}
  btn.classList.add('armed');
  var old=btn.textContent;btn.textContent='もう一度で削除';
  setTimeout(function(){btn.classList.remove('armed');btn.textContent=old;},3000);
};
/* アイコンボタン用 */
OS.armIcon=function(btn,label,fn){
  if(btn.classList.contains('armed')){fn();return;}
  btn.classList.add('armed');
  btn.setAttribute('aria-label','もう一度押すと「'+label+'」を削除します');
  setTimeout(function(){btn.classList.remove('armed');btn.setAttribute('aria-label',label+' を削除');},3000);
};

/* ---------- ドット絵スプライト ---------- */
OS.sprite=function(sp,px,sil){
  var W=64,H=40,cv=document.createElement('canvas');cv.width=W;cv.height=H;var x=cv.getContext('2d');
  var cx=31,cy=21;
  if(sp.kind==='squid'){
    x.fillStyle=sp.fin;x.beginPath();x.ellipse(24,cy,20,11,0,0,7);x.fill();
    x.fillStyle=sp.c;x.beginPath();x.ellipse(24,cy,16,7,0,0,7);x.fill();
    x.fillStyle='#8a5a3e';[[16,19],[24,23],[30,18],[20,24]].forEach(function(p){x.fillRect(p[0],p[1],2,2)});
    x.fillStyle=sp.c;x.beginPath();x.ellipse(43,cy,5,6,0,0,7);x.fill();
    x.strokeStyle=sp.c;x.lineWidth=2;[-6,-3,0,3,6].forEach(function(o){x.beginPath();x.moveTo(46,cy+o*.6);x.quadraticCurveTo(54,cy+o,61,cy+o*1.4);x.stroke();});
    x.fillStyle='#fff';x.beginPath();x.arc(43,cy-1,2.4,0,7);x.fill();x.fillStyle='#111';x.fillRect(43,cy-2,2,2);
  }else if(sp.kind==='eel'){
    x.strokeStyle=sp.c;x.lineWidth=9;x.lineCap='round';x.beginPath();x.moveTo(8,20);x.bezierCurveTo(20,8,30,32,42,20);x.bezierCurveTo(50,12,56,24,60,22);x.stroke();
    x.fillStyle=sp.pc;[[14,15],[22,20],[30,24],[36,20],[44,17],[51,19],[56,22],[18,18]].forEach(function(p){x.fillRect(p[0],p[1],3,2)});
    x.fillStyle='#fff';x.beginPath();x.arc(9,17,2.2,0,7);x.fill();x.fillStyle='#111';x.fillRect(8,16,2,2);
    x.fillStyle='#7a1a10';x.fillRect(4,21,5,1);
  }else{
    var rx=18*(sp.l||1),ry=9*(sp.h||1),fin=sp.fin||sp.c;
    var tx=cx+rx-3;
    x.fillStyle=fin;x.beginPath();
    if(sp.tail==='fork'){x.moveTo(tx,cy);x.lineTo(tx+10,cy-ry*.9);x.lineTo(tx+6,cy);x.lineTo(tx+10,cy+ry*.9);}
    else if(sp.tail==='square'){x.moveTo(tx,cy-2);x.lineTo(tx+8,cy-ry*.6);x.lineTo(tx+8,cy+ry*.6);x.lineTo(tx,cy+2);}
    else{x.moveTo(tx,cy);x.ellipse(tx+5,cy,6,ry*.7,0,0,7);}
    x.fill();
    x.fillStyle=fin;
    if(sp.dorsal==='spiny'){var dh=sp.dh||6;x.beginPath();x.moveTo(cx-rx*.55,cy-ry*.75);for(var i=0;i<=8;i++){var fx=cx-rx*.55+i*(rx*1.1/8);x.lineTo(fx,cy-ry-(i%2?dh*.45:dh)*(1-i/14));}x.lineTo(cx+rx*.6,cy-ry*.6);x.fill();}
    else if(sp.dorsal==='spine1'){x.fillRect(cx-rx*.35,cy-ry-7,2,9);x.beginPath();x.moveTo(cx,cy-ry*.8);x.quadraticCurveTo(cx+rx*.35,cy-ry-4,cx+rx*.7,cy-ry*.5);x.fill();}
    else if(sp.dorsal==='soft'){x.beginPath();x.moveTo(cx-rx*.4,cy-ry*.8);x.quadraticCurveTo(cx,cy-ry-6,cx+rx*.6,cy-ry*.55);x.fill();}
    if(sp.dorsal!=='none'){x.beginPath();x.moveTo(cx+rx*.1,cy+ry*.8);x.quadraticCurveTo(cx+rx*.35,cy+ry+4,cx+rx*.6,cy+ry*.5);x.fill();}
    x.save();x.beginPath();
    if(sp.head){x.ellipse(cx,cy,rx,ry,0,0,7);x.ellipse(cx-rx*.55,cy-1,rx*.5,ry*1.05,0,0,7);}else{x.ellipse(cx,cy,rx,ry,0,0,7);}
    x.fillStyle=sp.c;x.fill();x.clip();
    x.fillStyle=sp.b;x.fillRect(0,cy+ry*.25,W,H);
    x.fillStyle=sp.pc||'#000';
    var p=sp.pat;
    if(p==='mottle'){[[-.6,-.4],[-.2,-.6],[.2,-.3],[.5,-.5],[-.3,.1],[.3,.2],[0,-.1],[.6,0]].forEach(function(q){x.fillRect(cx+q[0]*rx,cy+q[1]*ry,4,3)});}
    if(p==='bands'){for(var b=0;b<(sp.n||4);b++){x.fillRect(cx-rx*.6+b*(rx*1.3/(sp.n||4)),cy-ry,2,ry*2)}}
    if(p==='spots'){[[-.5,-.3],[-.2,.2],[.1,-.5],[.3,0],[.55,-.3],[-.35,.45],[.2,.45],[0,-.15],[.45,.35]].forEach(function(q){x.fillRect(cx+q[0]*rx,cy+q[1]*ry,2,2)});}
    if(p==='stripe'){x.fillRect(cx-rx,cy-(sp.thin?1:2),rx*2,sp.thin?2:3);}
    if(p==='stripe2'){x.fillRect(cx-rx,cy-ry*.45,rx*2,2);x.fillRect(cx-rx,cy+ry*.15,rx*2,2);}
    if(p==='wave'){for(var k=0;k<rx*2;k+=1){var yy=cy-ry*.55+Math.sin(k*.8)*2;x.fillRect(cx-rx*.7+k,yy,1,1);var y2=cy-ry*.25+Math.sin(k*.8+2)*2;if(k%2)x.fillRect(cx-rx*.7+k,y2,1,1);}}
    if(p==='squiggle'){for(var k2=0;k2<rx*1.6;k2+=1){x.fillRect(cx-rx*.7+k2,cy-ry*.4+Math.sin(k2*.6)*2.5,1,1);x.fillRect(cx-rx*.7+k2,cy+ry*.2+Math.cos(k2*.6)*2.5,1,1);}}
    if(sp.eyeband){x.fillStyle=sp.eyeband;x.beginPath();x.moveTo(cx-rx*.95,cy-ry*.9);x.lineTo(cx-rx*.75,cy-ry*.9);x.lineTo(cx-rx*.35,cy);x.lineTo(cx-rx*.55,cy);x.fill();}
    x.restore();
    var ex=cx-rx*(sp.head?.95:.68),ey=cy-ry*.3;
    x.fillStyle='#fff';x.beginPath();x.arc(ex,ey,2.6,0,7);x.fill();x.fillStyle='#111';x.fillRect(Math.round(ex-1),Math.round(ey-1),2,2);
    if(sp.whisker){x.strokeStyle='#e8d04a';x.lineWidth=1;[[-2,3],[0,5],[2,4]].forEach(function(w){x.beginPath();x.moveTo(cx-rx,cy+w[0]);x.lineTo(cx-rx-6,cy+w[1]);x.stroke();});}
  }
  /* アルファを二値化してドット絵にし、縁取りを足す */
  var img=x.getImageData(0,0,W,H),d=img.data;
  for(var i2=3;i2<d.length;i2+=4){d[i2]=d[i2]>110?255:0;}
  var out=x.createImageData(W,H),o=out.data;
  for(var yy2=0;yy2<H;yy2++)for(var xx=0;xx<W;xx++){var j=(yy2*W+xx)*4;
    if(d[j+3]){if(sil){o[j]=74;o[j+1]=82;o[j+2]=100;}else{o[j]=d[j];o[j+1]=d[j+1];o[j+2]=d[j+2];}o[j+3]=255;continue;}
    var nb=false;[[1,0],[-1,0],[0,1],[0,-1]].forEach(function(q){var ax=xx+q[0],ay=yy2+q[1];if(ax>=0&&ay>=0&&ax<W&&ay<H&&d[(ay*W+ax)*4+3])nb=true;});
    if(nb){o[j]=20;o[j+1]=22;o[j+2]=30;o[j+3]=255;}}
  x.clearRect(0,0,W,H);x.putImageData(out,0,0);
  cv.className='sprite';cv.style.width=(px||128)+'px';cv.setAttribute('aria-hidden','true');
  return cv;
};

/* ---------- 保存データ ---------- */
var KEY='oshima-dex-v1';
OS.DB={gear:[],catches:[]};
var firstRun=false;
try{
  var raw=localStorage.getItem(KEY);
  if(raw){var p=JSON.parse(raw);if(p&&Array.isArray(p.gear)&&Array.isArray(p.catches))OS.DB=p;}
  else firstRun=true;
}catch(e){}
OS.saveDB=function(){
  try{localStorage.setItem(KEY,JSON.stringify(OS.DB));return true;}
  catch(e){OS.toast('この端末では保存できませんでした（プライベートモードなど）');return false;}
};
if(firstRun){
  OS.DB.gear=OS.SEED_GEAR.map(function(g){
    return {id:OS.uid(),name:g.name,rod:g.rod,reel:g.reel,line:g.line,note:g.note};
  });
  OS.saveDB();
}

/* ---------- 装備の状態 ---------- */
OS.state={rod:'pack',reel:'r1000',gearId:''};
try{
  var sv=JSON.parse(localStorage.getItem('oshima-loadout2')||'null');
  if(sv&&sv.rod&&sv.reel)OS.state={rod:sv.rod,reel:sv.reel,gearId:sv.gearId||''};
}catch(e){}
if(!OS.state.gearId&&OS.DB.gear.length){
  var g0=OS.DB.gear.filter(function(g){return g.rod===OS.state.rod&&g.reel===OS.state.reel})[0];
  OS.state.gearId=g0?g0.id:OS.DB.gear[0].id;
  if(!g0){OS.state.rod=OS.DB.gear[0].rod;OS.state.reel=OS.DB.gear[0].reel;}
}
OS.saveState=function(){try{localStorage.setItem('oshima-loadout2',JSON.stringify(OS.state));}catch(e){}};

/* ---------- 参照ヘルパー ---------- */
OS.curRod=function(){return OS.RODS.filter(function(r){return r.id===OS.state.rod})[0]||OS.RODS[0]};
OS.curReel=function(){return OS.REELS.filter(function(r){return r.id===OS.state.reel})[0]||OS.REELS[0]};
OS.score=function(k){
  var r=OS.curRod().m[k]||0;
  if(!r)return 0;
  r+=OS.curReel().mod[k]||0;
  return Math.max(0,Math.min(3,r));
};
OS.rodName=function(id){var r=OS.RODS.filter(function(x){return x.id===id})[0];return r?r.n:'—'};
OS.reelName=function(id){var r=OS.REELS.filter(function(x){return x.id===id})[0];return r?r.n:'—'};
OS.gearName=function(id){var g=OS.DB.gear.filter(function(x){return x.id===id})[0];return g?g.name:''};
OS.ALL=OS.FISH.map(function(f){return {f:f,hz:false}}).concat(OS.HAZ.map(function(f){return {f:f,hz:true}}));
OS.byName=function(n){return OS.ALL.filter(function(x){return x.f.n===n})[0]};
OS.caughtMap=function(){var m={};OS.DB.catches.forEach(function(c){m[c.fish]=(m[c.fish]||0)+1});return m};
OS.lastFocus=null;
})();
