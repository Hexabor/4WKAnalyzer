// ══════════════════════════════════════════════════════
//  SEARCHABLE SELECT
// ══════════════════════════════════════════════════════
const _ssOptions={}; // { hiddenId: [{value, label}] }
let _ssActive=null;  // { id, input, query, highlightIdx }
const _ssNorm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');

function ssSetOptions(id, options){
  _ssOptions[id]=options||[];
  ssSyncDisplay(id);
}
function ssSetValue(id, value, fire=true){
  const hidden=document.getElementById(id);if(!hidden)return;
  hidden.value=value||'';
  ssSyncDisplay(id);
  if(fire)hidden.dispatchEvent(new Event('change',{bubbles:true}));
}
function ssSyncDisplay(id){
  const hidden=document.getElementById(id);
  const input=document.querySelector(`input.ss-input[data-ss-for="${id}"]`);
  if(!hidden||!input)return;
  const opts=_ssOptions[id]||[];
  const opt=opts.find(o=>o.value===hidden.value);
  if(_ssActive&&_ssActive.id===id)return; // don't overwrite while user is typing
  input.value=opt?opt.label:'';
}

function ssOpen(input){
  if(input.readOnly)return;
  const id=input.dataset.ssFor;
  if(_ssActive&&_ssActive.id===id){ssRenderDropdown();return;}
  if(_ssActive)ssClose(true);
  _ssActive={id, input, query:'', highlightIdx:-1};
  input.select();
  ssRenderDropdown();
  setTimeout(()=>document.addEventListener('click', ssOutsideClick, true),0);
}
function ssClose(restoreDisplay=true){
  if(!_ssActive)return;
  const id=_ssActive.id;
  _ssActive=null;
  document.removeEventListener('click', ssOutsideClick, true);
  document.querySelectorAll('.ss-dropdown.show').forEach(d=>d.classList.remove('show'));
  if(restoreDisplay)ssSyncDisplay(id);
}
function ssOutsideClick(e){
  if(!_ssActive)return;
  const wrap=_ssActive.input.closest('.ss-wrap');
  if(wrap&&wrap.contains(e.target))return;
  ssClose(true);
}
function ssInput(input){
  if(!_ssActive||_ssActive.input!==input){ssOpen(input);}
  _ssActive.query=input.value;
  _ssActive.highlightIdx=0;
  ssRenderDropdown();
}
function ssKey(input, e){
  if(!_ssActive||_ssActive.input!==input){
    if(e.key==='ArrowDown'||e.key==='Enter'){e.preventDefault();ssOpen(input);}
    return;
  }
  const filtered=ssFilter(_ssActive.id, _ssActive.query);
  if(e.key==='ArrowDown'){
    e.preventDefault();
    _ssActive.highlightIdx=Math.min(filtered.length-1,_ssActive.highlightIdx+1);
    ssRenderDropdown();ssScrollHighlight();
  }else if(e.key==='ArrowUp'){
    e.preventDefault();
    _ssActive.highlightIdx=Math.max(0,_ssActive.highlightIdx-1);
    ssRenderDropdown();ssScrollHighlight();
  }else if(e.key==='Enter'){
    e.preventDefault();
    const opt=filtered[_ssActive.highlightIdx>=0?_ssActive.highlightIdx:0];
    if(opt)ssPick(opt.value);
  }else if(e.key==='Escape'){
    e.preventDefault();ssClose(true);
  }else if(e.key==='Tab'){
    ssClose(true);
  }
}
function ssPick(value){
  if(!_ssActive)return;
  const id=_ssActive.id;
  _ssActive=null;
  document.removeEventListener('click', ssOutsideClick, true);
  document.querySelectorAll('.ss-dropdown.show').forEach(d=>d.classList.remove('show'));
  ssSetValue(id, value, true);
}
function ssFilter(id, query){
  const opts=_ssOptions[id]||[];
  if(!query.trim())return opts;
  const q=_ssNorm(query);
  return opts.filter(o=>_ssNorm(o.label).includes(q)||_ssNorm(o.value).includes(q));
}
function ssRenderDropdown(){
  if(!_ssActive)return;
  const wrap=_ssActive.input.closest('.ss-wrap');
  const dd=wrap.querySelector('.ss-dropdown');
  const filtered=ssFilter(_ssActive.id, _ssActive.query);
  const hidden=document.getElementById(_ssActive.id);
  const curVal=hidden?.value||'';
  dd.innerHTML='';
  if(!filtered.length){
    const empty=document.createElement('div');empty.className='ss-empty';empty.textContent='Sin resultados';
    dd.appendChild(empty);
  }else{
    filtered.forEach((o,i)=>{
      const el=document.createElement('div');
      el.className='ss-option';
      if(o.value===curVal)el.classList.add('ss-selected');
      if(i===_ssActive.highlightIdx)el.classList.add('ss-highlight');
      el.textContent=o.label;
      el.dataset.val=o.value;
      el.addEventListener('mousedown',e=>{e.preventDefault();ssPick(el.dataset.val);});
      dd.appendChild(el);
    });
  }
  dd.classList.add('show');
}
function ssScrollHighlight(){
  if(!_ssActive)return;
  const wrap=_ssActive.input.closest('.ss-wrap');
  const hi=wrap.querySelector('.ss-option.ss-highlight');
  if(hi)hi.scrollIntoView({block:'nearest'});
}
document.addEventListener('scroll',()=>{if(_ssActive)ssClose(true);},true);
window.addEventListener('resize',()=>{if(_ssActive)ssClose(true);});
