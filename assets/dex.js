/* dex.js — 釣果図鑑、釣果ログ、釣果の登録フォーム、データの書き出し・読み込み。 */
(function(){
'use strict';
var OS=window.OS, D=document;
function $(id){return D.getElementById(id)}

/* ---------- 図鑑 ---------- */
OS.renderDex=function(){
  var m=OS.caughtMap(),got=OS.ALL.filter(function(x){return m[x.f.n]}).length;
  $('dex-count').textContent=got+' / '+OS.ALL.length+' 種';
  $('dex-fill').style.width=(got/OS.ALL.length*100)+'%';
  $('complete').hidden=got<OS.ALL.length;

  var grid=$('dexgrid');grid.innerHTML='';
  OS.ALL.forEach(function(x,i){
    var n=m[x.f.n]||0;
    var b=D.createElement('button');b.type='button';
    b.className='dx'+(n?'':' no')+(x.hz?' hz':'');
    var fi=D.createElement('div');fi.className='fi';fi.appendChild(OS.sprite(x.f.sp,88,!n));b.appendChild(fi);
    var no=D.createElement('span');no.className='no-n';no.textContent='No.'+String(i+1).padStart(3,'0');b.appendChild(no);
    var nm=D.createElement('b');nm.textContent=n?x.f.n:'？？？';b.appendChild(nm);
    if(n){var c=D.createElement('span');c.className='cnt';c.textContent='×'+n;b.appendChild(c);}
    b.setAttribute('aria-label',n?x.f.n+' '+n+'匹記録済み':'未発見の魚 No.'+(i+1));
    b.addEventListener('click',function(){openDex(x,n)});
    grid.appendChild(b);
  });

  var log=$('loglist');
  if(!OS.DB.catches.length){
    log.innerHTML='<div class="empty">まだ記録がありません。釣れたら「釣果を登録」から追加しましょう。</div>';
    return;
  }
  log.innerHTML='';
  OS.DB.catches.slice().sort(function(a,b){return (b.date+b.id).localeCompare(a.date+a.id)}).forEach(function(c){
    var el=D.createElement('div');el.className='log';
    el.innerHTML='<span class="ld"></span><b></b><button type="button" class="pbtn sm danger">削除</button><span class="lm"></span>';
    el.querySelector('.ld').textContent=String(c.date).slice(5).replace('-','/');
    el.querySelector('b').textContent=c.fish+(c.size?' '+c.size+'cm':'');
    el.querySelector('.lm').textContent=[c.port,OS.gearName(c.gearId),
      c.method&&OS.METHODS[c.method]?OS.METHODS[c.method].n:'',c.memo].filter(Boolean).join(' ・ ');
    el.querySelector('button').addEventListener('click',function(e){
      OS.armDelete(e.currentTarget,function(){
        OS.DB.catches=OS.DB.catches.filter(function(x){return x.id!==c.id});
        OS.saveDB();OS.renderDex();OS.renderGearTab();
      });
    });
    log.appendChild(el);
  });
};

function openDex(x,n){
  var f=x.f;
  if(n){OS.openModal(f,f.m[0],0,x.hz);return;}
  OS.lastFocus=D.activeElement;
  var ms=$('m-sprite');ms.innerHTML='';ms.appendChild(OS.sprite(f.sp,224,true));
  $('m-name').textContent='？？？';
  $('m-badges').innerHTML='<span class="dg warn">未発見</span>';
  var rows=[['狙い方',f.m.map(function(k){return OS.METHODS[k].n}).join('、')]];
  if(f.w)rows.push(['時間',f.w]);
  if(f.p)rows.push(['場所',f.p]);
  if(x.hz)rows.push(['ヒント','危険な外道。掛かっても素手で触らない']);
  $('m-dl').innerHTML=rows.map(function(r){return '<dt>'+r[0]+'</dt><dd>'+OS.esc(r[1])+'</dd>'}).join('');
  $('m-extra').innerHTML='';
  $('modal').hidden=false;D.body.style.overflow='hidden';$('m-close').focus();
}

/* ---------- 釣果の登録 ---------- */
var cmodal=$('cmodal');
OS.fillCatchForm=function(){
  $('c-fish').innerHTML='<optgroup label="狙える魚">'+
    OS.FISH.map(function(f){return '<option>'+OS.esc(f.n)+'</option>'}).join('')+
    '</optgroup><optgroup label="危険魚・外道">'+
    OS.HAZ.map(function(f){return '<option>'+OS.esc(f.n)+'</option>'}).join('')+'</optgroup>';
  $('c-gear').innerHTML='<option value="">（未選択）</option>'+
    OS.DB.gear.map(function(g){return '<option value="'+g.id+'">'+OS.esc(g.name)+'</option>'}).join('');
  $('c-method').innerHTML='<option value="">（未選択）</option>'+
    Object.keys(OS.METHODS).map(function(k){return '<option value="'+k+'">'+OS.METHODS[k].n+'</option>'}).join('');
};
function openCatch(fishName){
  OS.fillCatchForm();
  cmodal._lf=D.activeElement;
  $('c-date').value=OS.today();
  if(fishName)$('c-fish').value=fishName;
  $('c-gear').value=OS.state.gearId||'';
  cmodal.hidden=false;D.body.style.overflow='hidden';
  $('c-fish').focus();OS.icons();
}
function closeCatch(){
  cmodal.hidden=true;D.body.style.overflow='';
  try{cmodal._lf&&cmodal._lf.focus()}catch(e){}
}
$('add-catch').addEventListener('click',function(){openCatch()});
$('c-close').addEventListener('click',closeCatch);
$('cmodal-back').addEventListener('click',closeCatch);
D.addEventListener('keydown',function(e){
  if(e.key!=='Escape')return;
  if(!cmodal.hidden)closeCatch();
  else if(!$('modal').hidden)OS.closeModal();
});
$('catchform').addEventListener('submit',function(e){
  e.preventDefault();
  var fish=$('c-fish').value;
  if(!OS.byName(fish))return;
  var before=OS.caughtMap()[fish]||0;
  var beforeAll=OS.ALL.filter(function(x){return OS.caughtMap()[x.f.n]}).length;
  var size=parseFloat($('c-size').value);
  OS.DB.catches.push({
    id:OS.uid(),fish:fish,date:$('c-date').value||OS.today(),port:$('c-port').value,
    size:isFinite(size)&&size>0?size:null,gearId:$('c-gear').value,
    method:$('c-method').value,memo:$('c-memo').value.trim()
  });
  if(!OS.saveDB())return;
  e.target.reset();closeCatch();OS.renderDex();OS.renderGearTab();
  var afterAll=OS.ALL.filter(function(x){return OS.caughtMap()[x.f.n]}).length;
  if(afterAll===OS.ALL.length&&beforeAll<OS.ALL.length)OS.toast('COMPLETE! 図鑑がすべて埋まりました');
  else OS.toast(before?fish+' を記録しました':'NEW! '+fish+' を図鑑に登録しました');
});

/* ---------- 書き出し・読み込み ---------- */
$('exp-btn').addEventListener('click',function(){
  var blob=new Blob([JSON.stringify(OS.DB,null,2)],{type:'application/json'});
  var a=D.createElement('a');a.href=URL.createObjectURL(blob);
  a.download='oshima-fishing-'+OS.today()+'.json';
  D.body.appendChild(a);a.click();
  setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},500);
  $('io-msg').textContent='書き出しました。ダウンロードフォルダを確認してください。';
});
$('imp-file').addEventListener('change',function(e){
  var file=e.target.files&&e.target.files[0];if(!file)return;
  var r=new FileReader();
  r.onload=function(){
    var msg=$('io-msg');
    try{
      var d=JSON.parse(r.result);
      if(!d||!Array.isArray(d.gear)||!Array.isArray(d.catches))throw 0;
      var ids={};OS.DB.gear.concat(OS.DB.catches).forEach(function(x){ids[x.id]=1});
      var ng=d.gear.filter(function(g){return g&&g.id&&g.name&&!ids[g.id]}).map(function(g){
        return {id:String(g.id),name:String(g.name).slice(0,30),rod:String(g.rod||''),reel:String(g.reel||''),
          line:String(g.line||'').slice(0,30),note:String(g.note||'').slice(0,60)};
      });
      var nc=d.catches.filter(function(c){return c&&c.id&&OS.byName(c.fish)&&!ids[c.id]}).map(function(c){
        return {id:String(c.id),fish:String(c.fish),date:String(c.date||'').slice(0,10),
          port:String(c.port||'').slice(0,20),size:+c.size>0?+c.size:null,gearId:String(c.gearId||''),
          method:OS.METHODS[c.method]?c.method:'',memo:String(c.memo||'').slice(0,80)};
      });
      OS.DB.gear=OS.DB.gear.concat(ng);OS.DB.catches=OS.DB.catches.concat(nc);
      if(OS.saveDB()){
        OS.renderGearTab();OS.renderDex();OS.fillCatchForm();
        msg.textContent='読み込みました（装備 '+ng.length+' 件、釣果 '+nc.length+' 件を追加）。';
      }
    }catch(err){
      msg.textContent='読み込めませんでした。このページで書き出したJSONファイルを選んでください。';
    }
    e.target.value='';
  };
  r.readAsText(file);
});
})();
