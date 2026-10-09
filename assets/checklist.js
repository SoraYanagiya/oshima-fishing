/* checklist.js — 持ち物。初期リスト＋手動追加・削除、進捗バー。 */
(function(){
'use strict';
var OS=window.OS, D=document;
function $(id){return D.getElementById(id)}

var LKEY='oshima-list-v2';
function defItems(){return OS.DEF.map(function(d,i){return {id:'d'+(i+1),g:d[0],t:d[1],done:false}})}

var LIST=null;
try{
  var lr=JSON.parse(localStorage.getItem(LKEY)||'null');
  if(lr&&Array.isArray(lr.items))LIST=lr;
}catch(e){}
function saveList(){try{localStorage.setItem(LKEY,JSON.stringify(LIST));}catch(e){}}

if(!LIST){
  LIST={items:defItems()};
  /* 旧バージョン（固定チェックボックス）のチェック状態を引き継ぐ */
  try{
    var old=JSON.parse(localStorage.getItem('oshima-checklist-v1')||'null');
    if(old){
      var omap=['c1','c2','c3','c4','c5','c6','c7','c8','c9','c9','c10','c11','c12'];
      LIST.items.forEach(function(it,i){if(old[omap[i]])it.done=true;});
    }
  }catch(e){}
  saveList();
}

$('i-group').innerHTML=OS.GROUPS.map(function(g){return '<option>'+g+'</option>'}).join('');

function updateCount(){
  var n=LIST.items.length,done=LIST.items.filter(function(it){return it.done}).length;
  $('count').textContent=done+' / '+n;
  $('fill').style.width=(n?done/n*100:0)+'%';
}

OS.renderList=function(){
  var box=$('checklist');box.innerHTML='';
  if(!LIST.items.length){
    box.innerHTML='<div class="empty">リストが空です。下の「持ち物を追加する」から足せます。</div>';
  }
  OS.GROUPS.forEach(function(gname){
    var items=LIST.items.filter(function(it){return it.g===gname});
    if(!items.length)return;
    var g=D.createElement('div');g.className='group';
    var lb=D.createElement('span');lb.className='eyebrow';lb.textContent=gname;g.appendChild(lb);
    items.forEach(function(it){
      var row=D.createElement('div');row.className='item';
      var lab=D.createElement('label');
      var cb=D.createElement('input');cb.type='checkbox';cb.checked=!!it.done;
      var sp=D.createElement('span');sp.textContent=it.t;
      lab.appendChild(cb);lab.appendChild(sp);row.appendChild(lab);
      var del=D.createElement('button');del.type='button';del.className='idel';
      del.setAttribute('aria-label',it.t+' を削除');
      del.innerHTML='<i data-lucide="trash-2"></i>';
      row.appendChild(del);
      cb.addEventListener('change',function(){it.done=cb.checked;saveList();updateCount();});
      del.addEventListener('click',function(){
        OS.armIcon(del,it.t,function(){
          LIST.items=LIST.items.filter(function(x){return x.id!==it.id});
          saveList();OS.renderList();OS.toast('削除しました');
        });
      });
      g.appendChild(row);
    });
    box.appendChild(g);
  });
  updateCount();OS.icons();
};

$('itemform').addEventListener('submit',function(e){
  e.preventDefault();
  var t=$('i-text').value.trim();if(!t)return;
  LIST.items.push({id:OS.uid(),g:$('i-group').value,t:t,done:false});
  saveList();$('i-text').value='';OS.renderList();OS.toast(t+' を追加しました');
});
$('uncheck').addEventListener('click',function(){
  LIST.items.forEach(function(it){it.done=false});
  saveList();OS.renderList();
});
$('restore').addEventListener('click',function(e){
  OS.armDelete(e.currentTarget,function(){
    LIST={items:defItems()};saveList();OS.renderList();OS.toast('初期リストに戻しました');
  });
});
})();
