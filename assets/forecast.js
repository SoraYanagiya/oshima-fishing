/* forecast.js — 潮位グラフと時合い、Open-Meteo からの天気取得、
   風向きによる釣り場の並べ替えと地図の更新。 */
(function(){
'use strict';
var OS=window.OS, D=document;
function $(id){return D.getElementById(id)}

/* ================= 潮と時合い ================= */
var curDay=0;
function lvl(ex,t){
  for(var i=0;i<ex.length-1;i++){
    var a=ex[i],b=ex[i+1];
    if(t>=a[0]&&t<=b[0]){var f=(t-a[0])/(b[0]-a[0]);return a[1]+(b[1]-a[1])*(1-Math.cos(Math.PI*f))/2;}
  }
  return ex[ex.length-1][1];
}
function hm(t){t=(t+24)%24;var h=Math.floor(t),m=Math.round((t-h)*60);if(m===60){h++;m=0}return h+':'+(m<10?'0':'')+m}

function windows(d){
  var ex=d.ex.filter(function(e){return e[0]>=0&&e[0]<24});
  var hs=ex.filter(function(e){return e[2]==='H'}),ls=ex.filter(function(e){return e[2]==='L'});
  var w=[];
  w.push({a:d.sr-0.5,b:d.sr+1.0,t:'朝マヅメ',n:'日の出前後＋下げ潮の動き出し。根魚・エギングの本命',r:'BEST',go:1});
  w.push({a:ls[0][0]+1.5,b:hs[1][0]-1.0,t:'日中の上げ潮',n:'潮がよく動く時間。胴つきでカワハギ・ベラ',r:'GOOD',go:1});
  w.push({a:hs[1][0]+0.5,b:d.ss+1.0,t:'夕マヅメ',n:'満潮後の下げ始め＋日の入り。アオリイカも期待',r:'BEST',go:1});
  w.push({a:d.ss+1.5,b:ls[1][0]-1.0,t:'夜の下げ潮',n:'ぶっこみの置き竿で大型カサゴ・ウツボ',r:'GOOD',go:1});
  ex.forEach(function(e){
    w.push({a:e[0]-0.67,b:e[0]+0.67,t:(e[2]==='H'?'満潮':'干潮')+' '+hm(e[0]),n:'潮止まり。休憩や移動にあてる',r:'SLOW',go:0});
  });
  return w;
}

function chart(i){
  curDay=i;
  var d=OS.DAYS[i],W=640,H=200,L=34,R=10,T=14,B=28;
  var x=function(t){return L+(W-L-R)*t/24},y=function(v){return T+(H-T-B)*(1-v/170)};
  var s='';
  windows(d).forEach(function(w){
    var a=Math.max(0,w.a),b=Math.min(24,w.b);
    if(b<=a)return;
    s+='<rect x="'+x(a)+'" y="'+T+'" width="'+(x(b)-x(a))+'" height="'+(H-T-B)+'" fill="'+(w.go?'var(--yellow)':'url(#hatch)')+'" opacity="'+(w.go?0.55:1)+'"/>';
  });
  for(var h=0;h<=24;h+=3){
    s+='<line x1="'+x(h)+'" y1="'+T+'" x2="'+x(h)+'" y2="'+(H-B)+'" stroke="var(--screen-ink)" stroke-opacity=".18"/>';
    s+='<text x="'+x(h)+'" y="'+(H-10)+'" text-anchor="middle" font-size="11" fill="var(--screen-ink)" font-family="var(--mono)">'+h+'</text>';
  }
  [0,50,100,150].forEach(function(v){
    s+='<text x="'+(L-6)+'" y="'+(y(v)+4)+'" text-anchor="end" font-size="10" fill="var(--screen-ink)" opacity=".7" font-family="var(--mono)">'+v+'</text>';
  });
  var pts=[];
  for(var t=0;t<=24.001;t+=0.25)pts.push(x(t).toFixed(1)+','+y(lvl(d.ex,t)).toFixed(1));
  s+='<polygon points="'+x(0)+','+(H-B)+' '+pts.join(' ')+' '+x(24)+','+(H-B)+'" fill="var(--sea)" opacity=".3"/>';
  s+='<polyline points="'+pts.join(' ')+'" fill="none" stroke="var(--sea)" stroke-width="3" stroke-linejoin="round"/>';
  d.ex.forEach(function(e){
    if(e[0]<0||e[0]>=24)return;
    var cx=x(e[0]),cy=y(e[1]);
    s+='<circle cx="'+cx+'" cy="'+cy+'" r="5" fill="var(--surface)" stroke="var(--edge)" stroke-width="2.5"/>';
    s+='<text x="'+cx+'" y="'+(e[2]==='H'?cy-10:cy+18)+'" text-anchor="middle" font-size="11" font-weight="700" fill="var(--screen-ink)" font-family="var(--body)">'+(e[2]==='H'?'満':'干')+' '+hm(e[0])+'</text>';
  });
  [d.sr,d.ss].forEach(function(p){
    s+='<line x1="'+x(p)+'" y1="'+T+'" x2="'+x(p)+'" y2="'+(H-B)+'" stroke="var(--camellia)" stroke-width="2" stroke-dasharray="4 3"/>';
  });
  $('tidechart').innerHTML='<svg viewBox="0 0 '+W+' '+H+'" xmlns="http://www.w3.org/2000/svg">'+
    '<defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">'+
    '<rect width="6" height="6" fill="transparent"/><line x1="0" y1="0" x2="0" y2="6" stroke="var(--muted)" stroke-width="2" opacity=".55"/>'+
    '</pattern></defs>'+s+'</svg>';

  var html='';
  windows(d).sort(function(a,b){return a.a-b.a}).forEach(function(w){
    html+='<div class="slotc'+(w.go?'':' slack')+'"><span class="rank">'+w.r+'</span>'+
      '<div class="tm">'+hm(w.a)+'〜'+hm(w.b)+'</div><b>'+w.t+'</b><span>'+w.n+'</span></div>';
  });
  $('slots').innerHTML=html;
}

var dtabs=[].slice.call(D.querySelectorAll('.dt'));
dtabs.forEach(function(b){
  b.addEventListener('click',function(){
    dtabs.forEach(function(z){z.classList.remove('on');z.setAttribute('aria-selected','false')});
    b.classList.add('on');b.setAttribute('aria-selected','true');
    chart(+b.dataset.d);
  });
});

/* ================= 風向きと釣り場 ================= */
function dirName(deg){return OS.DIRS[Math.round((((deg%360)+360)%360)/22.5)%16]}
function windWord(ms){return ms<4?'弱く':ms<8?'やや強く':ms<13?'強く':'非常に強く'}
function angDiff(a,b){var d=Math.abs((((a-b)%360)+360)%360);return d>180?360-d:d}
function rankSpots(dir){
  return OS.SPOTS.map(function(s){return {s:s,v:Math.min(180,angDiff(dir,s.face)+(s.shelter?45:0))}})
    .sort(function(a,b){return b.v-a.v});
}
function applyWind(dir){
  var rank=rankSpots(dir);
  $('verdict').innerHTML='予報は<b>'+dirName(dir)+'の風</b>。風裏になる<b>'+OS.esc(rank[0].s.n)+
    '</b>を第一候補、<b>'+OS.esc(rank[1].s.n)+'</b>を次点に。';
  $('spotlist').innerHTML=rank.map(function(r,i){
    var t=r.v>=120?['go','風裏でおすすめ']:r.v>=65?['ok','横風ぎみ・ふつう']:['no','風を正面から受ける'];
    return '<article class="spot"><header><h3>'+OS.esc(r.s.n)+'</h3>'+
      '<span class="tag '+t[0]+'">'+(i===0?'第一候補・':'')+t[1]+'</span></header>'+
      '<span class="pos">'+OS.esc(r.s.pos)+'</span><p>'+OS.esc(r.s.desc)+'</p></article>';
  }).join('');

  /* 地図の風向計：既定で南（下）を向く矢印を、吹いてくる方位ぶん回す */
  $('mapwind').innerHTML='<circle cx="276" cy="48" r="27" fill="var(--surface)" stroke="var(--edge)" stroke-width="2.5"/>'+
    '<g transform="rotate('+Math.round(dir)+',276,48)"><line x1="276" y1="28" x2="276" y2="60" stroke="var(--camellia)" stroke-width="3.5" marker-end="url(#ah)"/></g>'+
    '<text x="276" y="90" text-anchor="middle" font-size="11" font-weight="700" fill="var(--camellia)" font-family="var(--body)">'+dirName(dir)+'の風</text>';

  var s='';
  rank.forEach(function(r,i){
    var q=OS.MAPPOS[r.s.id],col=r.v>=120?'var(--ok)':r.v>=65?'var(--sea)':'var(--warn)';
    s+='<circle cx="'+q.mx+'" cy="'+q.my+'" r="'+(i===0?9:7)+'" fill="'+col+'" stroke="var(--bg)" stroke-width="2.5"/>';
    s+='<text x="'+q.lx+'" y="'+q.ly+'" text-anchor="'+q.an+'" fill="var(--ink)" font-size="13" font-weight="700">'+r.s.n+'</text>';
    if(i===0)s+='<text x="'+q.lx+'" y="'+(q.ly+15)+'" text-anchor="'+q.an+'" fill="var(--ok)" font-size="10" font-weight="500">第一候補</text>';
  });
  $('mapports').innerHTML=s;
}

/* ================= 天気（Open-Meteo） ================= */
var LIVE=null;
function hhmm(iso){var m=/T(\d\d):(\d\d)/.exec(iso||'');return m?(+m[1])+':'+m[2]:'—'}
function toDec(t){var m=/^(\d+):(\d+)$/.exec(t||'');return m?(+m[1])+(+m[2])/60:null}

function normal(){
  var out=[];
  for(var i=0;i<3;i++){
    var o={md:OS.TRIP[i].md,wd:OS.TRIP[i].wd,live:false};
    var j=-1;
    if(LIVE&&LIVE.f&&LIVE.f.daily&&LIVE.f.daily.time)j=LIVE.f.daily.time.indexOf(OS.TRIP[i].d);
    if(j>=0){
      var d=LIVE.f.daily;
      o.code=d.weather_code[j];o.tx=d.temperature_2m_max[j];o.tn=d.temperature_2m_min[j];
      o.pp=d.precipitation_probability_max?d.precipitation_probability_max[j]:null;
      o.ms=d.wind_speed_10m_max?d.wind_speed_10m_max[j]:null;
      o.dir=d.wind_direction_10m_dominant?d.wind_direction_10m_dominant[j]:OS.FBW.dir;
      o.sr=hhmm(d.sunrise&&d.sunrise[j]);o.ss=hhmm(d.sunset&&d.sunset[j]);o.live=true;
      if(LIVE.m&&LIVE.m.daily&&LIVE.m.daily.time){
        var k=LIVE.m.daily.time.indexOf(OS.TRIP[i].d);
        if(k>=0&&LIVE.m.daily.wave_height_max)o.wave=LIVE.m.daily.wave_height_max[k];
      }
    }else{
      o.code=OS.FB[i].code;o.tx=OS.FB[i].tx;o.tn=OS.FB[i].tn;o.pp=OS.FB[i].pp;
      o.ms=OS.FBW.ms;o.dir=OS.FBW.dir;o.wave=OS.FBW.wave;o.sr=OS.FBW.sr;o.ss=OS.FBW.ss;
    }
    out.push(o);
  }
  return out;
}

OS.renderWeather=function(){
  var A=normal(),live=A[0].live;
  $('days').innerHTML=A.map(function(o){
    var w=OS.WX[o.code]||['—','cloud'];
    return '<div class="day"><div class="d">'+o.md+'<small>'+o.wd+'</small></div>'+
      '<div class="sky"><i data-lucide="'+w[1]+'"></i>'+w[0]+'</div>'+
      '<div class="t num">'+Math.round(o.tx)+'°<span class="lo"> / '+Math.round(o.tn)+'°</span></div>'+
      '<div class="p">降水 <span class="num">'+(o.pp==null?'—':Math.round(o.pp)+'%')+'</span></div></div>';
  }).join('');

  var maxms=Math.max.apply(null,A.map(function(o){return o.ms||0}));
  var waves=A.map(function(o){return o.wave}).filter(function(v){return v!=null&&isFinite(v)});
  var waveTxt=waves.length?('波 '+Math.min.apply(null,waves).toFixed(1)+'〜'+Math.max.apply(null,waves).toFixed(1)+'m'):'波の予報は取得できず';
  $('facts').innerHTML=
    '<div class="fact"><i data-lucide="wind"></i><div><b>'+dirName(A[0].dir)+'の風・'+windWord(maxms)+'</b><span>最大 '+maxms.toFixed(0)+'m/s ／ '+waveTxt+'</span></div></div>'+
    '<div class="fact"><i data-lucide="moon"></i><div><b>3日間とも大潮</b><span>10/11ごろ新月。夜は真っ暗</span></div></div>'+
    '<div class="fact"><i data-lucide="sunrise"></i><div><b class="num">'+A[0].sr+' / '+A[0].ss+'</b><span>日の出 / 日の入</span></div></div>';

  /* 日の出・日の入りをマヅメの計算に反映 */
  A.forEach(function(o,i){
    var a=toDec(o.sr),b=toDec(o.ss);
    if(a)OS.DAYS[i].sr=a;
    if(b)OS.DAYS[i].ss=b;
  });
  chart(curDay);
  applyWind(A[0].dir);

  var note=$('wx-note');
  if(live){
    var now=new Date();
    note.innerHTML='<span class="live"><i data-lucide="check-circle"></i>最新の予報</span> '+
      (now.getMonth()+1)+'/'+now.getDate()+' '+now.getHours()+':'+String(now.getMinutes()).padStart(2,'0')+
      ' に Open-Meteo から取得。出発前と当日朝にもう一度「更新」を押してください。';
  }else{
    note.innerHTML='<span class="live off">目安の値</span> 最新の予報が取れなかったので、気象庁 週間予報（10/8 発表）をもとにした目安を表示しています。';
  }
  OS.icons();
};

OS.loadLive=function(){
  var note=$('wx-note');
  if(!window.fetch||!window.Promise){OS.renderWeather();return;}
  note.textContent='最新の予報を取得しています…';
  var base='latitude='+OS.LAT+'&longitude='+OS.LON+'&timezone=Asia%2FTokyo&start_date='+OS.TRIP[0].d+'&end_date='+OS.TRIP[2].d;
  var u1='https://api.open-meteo.com/v1/forecast?'+base+'&wind_speed_unit=ms&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,wind_direction_10m_dominant,sunrise,sunset';
  var u2='https://marine-api.open-meteo.com/v1/marine?'+base+'&daily=wave_height_max';
  var get=function(u){return fetch(u).then(function(r){if(!r.ok)throw 0;return r.json()})};
  Promise.all([get(u1),get(u2).catch(function(){return null})]).then(function(res){
    if(!res[0]||!res[0].daily)throw 0;
    LIVE={f:res[0],m:res[1]};
    OS.renderWeather();
  }).catch(function(){
    LIVE=null;OS.renderWeather();
  });
};
$('wx-reload').addEventListener('click',OS.loadLive);
})();
