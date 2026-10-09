/* gear.js — 「装備」タブ。マイ装備、竿リールの直接選択、
   ねらえる魚（CATCH LIST）、仕掛け、魚の詳細モーダル。 */
(function(){
'use strict';
var OS=window.OS, D=document;
function $(id){return D.getElementById(id)}

/* ---------- 竿とリールのピッカー ---------- */
OS.buildPickers=function(){
  $('rodgrid').innerHTML=OS.RODS.map(function(r){
    return '<button type="button" class="opt card" data-k="rod" data-v="'+r.id+'"><b>'+OS.esc(r.n)+'</b><span>'+OS.esc(r.s)+'</span></button>';
  }).join('');
  $('reelgrid').innerHTML=OS.REELS.map(function(r){
    return '<button type="button" class="opt card" data-k="reel" data-v="'+r.id+'"><b>'+OS.esc(r.n)+'</b><span>'+OS.esc(r.s)+'</span></button>';
  }).join('');
  D.querySelectorAll('.opt.card').forEach(function(b){
    b.addEventListener('click',function(){
      OS.state[b.dataset.k]=b.dataset.v;
      OS.state.gearId='';          /* 手で選んだら登録装備の選択は外す */
      OS.renderGearTab();
    });
  });
};

/* ---------- 魚カード ---------- */
function fishCard(f,s,mk,haz,cnt){
  var el=D.createElement('button');el.type='button';
  var dg=OS.DANGER[f.d];
  el.className=haz?'fish haz':('fish '+OS.G[s][1]);
  var spr=D.createElement('div');spr.className='fi';spr.appendChild(OS.sprite(f.sp,96));
  el.appendChild(spr);
  var body=D.createElement('div');body.className='fb';
  body.innerHTML='<h3>'+OS.esc(f.n)+(haz?'':' <span class="grade">'+OS.G[s][0]+'</span>')+'</h3>'+
    '<div class="how">'+OS.esc(OS.METHODS[mk].n)+(haz?'':' ・ '+OS.G[s][2])+'</div>'+
    '<span class="dg '+dg[1]+'">'+dg[0]+'</span>'+
    (cnt?'<span class="mark">図鑑 ×'+cnt+'</span>':'');
  el.appendChild(body);
  el.addEventListener('click',function(){OS.openModal(f,mk,s,haz)});
  return el;
}

/* ---------- 結果（ねらえる魚・外道・仕掛け） ---------- */
function renderResult(){
  var m=OS.caughtMap();
  var grid=$('fishgrid');grid.innerHTML='';
  var list=OS.FISH.map(function(f){
    var best=0,bm=null;
    f.m.forEach(function(k){var s=OS.score(k);if(s>best){best=s;bm=k}});
    return {f:f,s:best,m:bm};
  }).filter(function(x){return x.s>0}).sort(function(a,b){return b.s-a.s});
  list.forEach(function(x){grid.appendChild(fishCard(x.f,x.s,x.m,false,m[x.f.n]||0))});
  if(!list.length)grid.innerHTML='<p class="note">この組み合わせで狙える魚はありません。</p>';
  $('res-count').textContent=list.length+' 種';

  var hg=$('hazgrid');hg.innerHTML='';
  OS.HAZ.forEach(function(f){
    var mk=f.m.filter(function(k){return OS.score(k)>0})[0];
    if(mk)hg.appendChild(fishCard(f,0,mk,true,m[f.n]||0));
  });
  if(!hg.children.length)hg.innerHTML='<p class="note">この組み合わせで掛かりやすい危険魚はありません。</p>';

  var ms=Object.keys(OS.METHODS).filter(function(k){return OS.score(k)>0}).sort(function(a,b){return OS.score(b)-OS.score(a)});
  $('riglist').innerHTML=ms.map(function(k){
    var mm=OS.METHODS[k],g=OS.G[OS.score(k)];
    return '<details class="rigc '+g[1]+'"'+(OS.score(k)===3?' open':'')+'><summary><span class="grade">'+g[0]+'</span><b>'+mm.n+'</b></summary><dl>'+
      Object.keys(mm.rig).map(function(key){return '<dt>'+key+'</dt><dd>'+mm.rig[key]+'</dd>'}).join('')+
      '</dl><p class="how">'+mm.tip+'</p></details>';
  }).join('');

  var lock=Object.keys(OS.METHODS).filter(function(k){return OS.score(k)===0})
    .map(function(k){return '<span class="lk"><i data-lucide="lock"></i>'+OS.METHODS[k].n+'</span>'});
  $('locked').innerHTML=lock.length?'<span>この組み合わせでは使えない：</span>'+lock.join(''):'';
}

/* ---------- 選択中の装備と、その装備での釣果 ---------- */
function renderNow(){
  var box=$('nowgear');
  var g=OS.DB.gear.filter(function(x){return x.id===OS.state.gearId})[0];
  box.innerHTML='<span class="eyebrow">EQUIPPED</span><b></b><span class="gs"></span>';
  box.querySelector('b').textContent=g?g.name:(OS.rodName(OS.state.rod)+' ＋ '+OS.reelName(OS.state.reel));
  var sub=OS.rodName(OS.state.rod)+' ／ '+OS.reelName(OS.state.reel);
  if(g){var extra=[g.line,g.note].filter(Boolean).join(' ・ ');if(extra)sub+=' ・ '+extra;}
  box.querySelector('.gs').textContent=sub;

  var cc=D.createElement('div');cc.className='gearcatch';
  if(g){
    var cm={};
    OS.DB.catches.forEach(function(c){if(c.gearId===g.id)cm[c.fish]=(cm[c.fish]||0)+1});
    var names=Object.keys(cm);
    if(names.length){
      names.sort(function(a,b){return cm[b]-cm[a]}).forEach(function(n){
        var s=D.createElement('span');s.textContent=n+' ×'+cm[n];cc.appendChild(s);
      });
    }else{
      var s0=D.createElement('span');s0.textContent='この装備での釣果はまだありません';cc.appendChild(s0);
    }
  }else{
    var s1=D.createElement('span');s1.textContent='登録した装備をえらぶと、その装備の釣果が出ます';cc.appendChild(s1);
  }
  box.appendChild(cc);
}

/* ---------- マイ装備の一覧 ---------- */
function renderGearList(){
  var box=$('gearlist');
  $('gear-count').textContent='登録 '+OS.DB.gear.length+' 件';
  if(!OS.DB.gear.length){
    box.innerHTML='<div class="empty">まだ装備が登録されていません。下の「装備を登録する」から追加できます。</div>';
    return;
  }
  box.innerHTML='';
  OS.DB.gear.forEach(function(g){
    var on=OS.state.gearId===g.id;
    var cnt=OS.DB.catches.filter(function(c){return c.gearId===g.id}).length;
    var el=D.createElement('article');el.className='gcard'+(on?' on':'');
    el.innerHTML='<b></b><span class="gs"></span><span class="gs gl"></span><span class="gc"></span>'+
      '<div class="gbtns"><button type="button" class="pbtn sm eq">'+(on?'選択中':'この装備にする')+'</button>'+
      '<button type="button" class="pbtn sm danger del">削除</button></div>';
    el.querySelector('b').textContent=g.name;
    el.querySelector('.gs').textContent=OS.rodName(g.rod)+' ／ '+OS.reelName(g.reel);
    el.querySelector('.gl').textContent=[g.line,g.note].filter(Boolean).join(' ・ ');
    el.querySelector('.gc').textContent='この装備の釣果 '+cnt+' 匹';
    el.querySelector('.eq').addEventListener('click',function(){
      OS.state.rod=g.rod;OS.state.reel=g.reel;OS.state.gearId=g.id;
      OS.renderGearTab();
      OS.toast(g.name+' をえらびました');
      var nb=$('nowgear');
      if(nb&&window.matchMedia('(max-width:720px)').matches)nb.scrollIntoView({block:'center'});
    });
    el.querySelector('.del').addEventListener('click',function(e){
      OS.armDelete(e.currentTarget,function(){
        OS.DB.gear=OS.DB.gear.filter(function(x){return x.id!==g.id});
        if(OS.state.gearId===g.id)OS.state.gearId='';
        OS.saveDB();OS.renderGearTab();OS.fillCatchForm();OS.renderDex();
      });
    });
    box.appendChild(el);
  });
}

OS.renderGearTab=function(){
  D.querySelectorAll('.opt.card').forEach(function(b){
    b.setAttribute('aria-pressed',String(OS.state[b.dataset.k]===b.dataset.v));
  });
  renderResult();renderNow();renderGearList();OS.saveState();OS.icons();
};

/* ---------- 装備の登録フォーム ---------- */
function opts(sel,list){sel.innerHTML=list.map(function(x){return '<option value="'+x.id+'">'+OS.esc(x.n)+'</option>'}).join('')}
opts($('g-rod'),OS.RODS);
opts($('g-reel'),OS.REELS);
$('gearform').addEventListener('submit',function(e){
  e.preventDefault();
  var name=$('g-name').value.trim();if(!name)return;
  var g={id:OS.uid(),name:name,rod:$('g-rod').value,reel:$('g-reel').value,
    line:$('g-line').value.trim(),note:$('g-note').value.trim()};
  OS.DB.gear.push(g);
  if(OS.saveDB()){
    e.target.reset();$('gearform-box').open=false;
    OS.state.rod=g.rod;OS.state.reel=g.reel;OS.state.gearId=g.id;
    OS.renderGearTab();OS.fillCatchForm();OS.toast(name+' を登録しました');
  }
});

/* ---------- 魚の詳細モーダル ---------- */
var modal=$('modal');
OS.openModal=function(f,mk,s,haz){
  OS.lastFocus=D.activeElement;
  var ms=$('m-sprite');ms.innerHTML='';ms.appendChild(OS.sprite(f.sp,224));
  $('m-name').textContent=f.n;
  var dg=OS.DANGER[f.d];
  $('m-badges').innerHTML='<span class="dg '+dg[1]+'">'+dg[0]+'</span>'+
    (haz?'<span class="dg bad">外道・危険魚</span>':(OS.G[s]?'<span class="grade">'+OS.G[s][0]+' '+OS.G[s][2]+'</span>':''));
  var rows=[['毒・棘',f.dt],['扱い方',f.h],['食べ方',f.c.join('、')],['釣り方',OS.METHODS[mk].n]];
  if(f.w)rows.push(['時間',f.w]);
  if(f.p)rows.push(['場所',f.p]);
  $('m-dl').innerHTML=rows.map(function(r){return '<dt>'+r[0]+'</dt><dd>'+OS.esc(r[1])+'</dd>'}).join('');

  var ex=$('m-extra');ex.innerHTML='';
  var recs=OS.DB.catches.filter(function(c){return c.fish===f.n})
    .sort(function(a,b){return String(b.date).localeCompare(String(a.date))});
  if(recs.length){
    var best=recs.reduce(function(m2,c){return Math.max(m2,+c.size||0)},0);
    ex.innerHTML='<h4>あなたの記録（'+recs.length+'匹'+(best?'・最大 '+best+'cm':'')+'）</h4>';
    recs.slice(0,5).forEach(function(c){
      var d=D.createElement('div');d.className='m-rec';
      d.textContent=c.date+' ・ '+c.port+(c.size?' ・ '+c.size+'cm':'')+(OS.gearName(c.gearId)?' ・ '+OS.gearName(c.gearId):'');
      ex.appendChild(d);
    });
  }
  modal.hidden=false;D.body.style.overflow='hidden';
  $('m-close').focus();OS.icons();
};
OS.closeModal=function(){
  modal.hidden=true;D.body.style.overflow='';
  if(OS.lastFocus)try{OS.lastFocus.focus()}catch(e){}
};
$('m-close').addEventListener('click',OS.closeModal);
$('modal-back').addEventListener('click',OS.closeModal);
})();
