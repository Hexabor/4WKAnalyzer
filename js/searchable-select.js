// ══════════════════════════════════════════════════════
//  SEARCHABLE SELECT
//  El dropdown solo aparece al escribir y muestra solo coincidencias.
//  Click/focus no despliega: selecciona el texto para que escribir reemplace.
// ══════════════════════════════════════════════════════
const _ssOptions={}; // { hiddenId: [{value, label}] }
let _ssActive=null;  // { id, input, query, highlightIdx }
const _ssNorm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');

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
  if(_ssActive&&_ssActive.id===id)return; // no sobreescribir mientras el usuario escribe
  input.value=opt?opt.label:'';
}

// onfocus/onclick: seleccionar el texto (no abre dropdown).
function ssOpen(input){
  if(input.readOnly)return;
  if(input.value)input.select();
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
// oninput: solo abre dropdown si hay texto; lo cierra si se vacía.
function ssInput(input){
  const id=input.dataset.ssFor;
  const q=input.value;
  if(!q.trim()){
    if(_ssActive&&_ssActive.input===input)ssClose(false);
    return;
  }
  if(!_ssActive||_ssActive.input!==input){
    if(_ssActive)ssClose(false);
    _ssActive={id, input, query:q, highlightIdx:0};
    setTimeout(()=>document.addEventListener('click', ssOutsideClick, true),0);
  } else {
    _ssActive.query=q;
    _ssActive.highlightIdx=0;
  }
  ssRenderDropdown();
}
function ssKey(input, e){
  if(!_ssActive||_ssActive.input!==input){
    // Sin dropdown abierto: las flechas/Enter no abren nada — solo se abre al escribir.
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
    const empty=document.createElement('div');empty.className='ss-empty';empty.textContent='Sin coincidencias';
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
window.addEventListener('resize',()=>{if(_ssActive)ssClose(true);});
// Si el input pierde foco sin haberse seleccionado nada, restaurar el display al valor actual.
document.addEventListener('focusout',e=>{
  const inp=e.target;
  if(!inp||!inp.classList||!inp.classList.contains('ss-input'))return;
  if(_ssActive&&_ssActive.input===inp)return; // sesión activa: lo gestiona ssClose
  ssSyncDisplay(inp.dataset.ssFor);
},true);
