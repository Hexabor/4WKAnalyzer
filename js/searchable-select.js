// ══════════════════════════════════════════════════════
//  SEARCHABLE SELECT
//  Click/foco despliega el listado completo (roll-up); escribir lo filtra en vivo.
//  Campos con una opción value:'' en su lista admiten quedarse sin selección
//  al borrar el texto y perder el foco; el resto revierte a la tienda anterior.
// ══════════════════════════════════════════════════════
const _ssOptions={}; // { hiddenId: [{value, label}] }
let _ssActive=null;  // { id, input, query, highlightIdx }
const _ssNorm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');

function ssSetOptions(id, options){
  _ssOptions[id]=options||[];
  ssSyncDisplay(id);
}
function ssAllowsClear(id){
  return (_ssOptions[id]||[]).some(o=>o.value==='');
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
  const wrap=input.closest('.ss-wrap');
  if(wrap)wrap.classList.toggle('has-value', !!hidden.value);
  const opts=_ssOptions[id]||[];
  const opt=opts.find(o=>o.value===hidden.value);
  if(_ssActive&&_ssActive.id===id)return; // no sobreescribir mientras el usuario edita
  input.value=opt?opt.label:'';
}

// onfocus/onclick: despliega el listado completo y selecciona el texto (para que escribir lo reemplace).
function ssOpen(input){
  if(input.readOnly)return;
  const id=input.dataset.ssFor;
  if(input.value)input.select();
  _ssActive={id, input, query:'', highlightIdx:ssCurrentIdx(id)};
  document.removeEventListener('click', ssOutsideClick, true);
  setTimeout(()=>document.addEventListener('click', ssOutsideClick, true),0);
  ssRenderDropdown();
}
function ssCurrentIdx(id){
  const hidden=document.getElementById(id);
  const opts=_ssOptions[id]||[];
  const i=opts.findIndex(o=>o.value===(hidden?hidden.value:''));
  return i>=0?i:0;
}
// Cierra el dropdown. Si el campo admite quedarse vacío (tiene opción value:'')
// y el usuario borró el texto sin elegir nada, confirma la deselección.
function ssClose(restoreDisplay=true, allowCommitEmpty=true){
  if(!_ssActive)return;
  const {id, query}=_ssActive;
  _ssActive=null;
  document.removeEventListener('click', ssOutsideClick, true);
  document.querySelectorAll('.ss-wrap.open').forEach(w=>w.classList.remove('open'));
  const hidden=document.getElementById(id);
  if(allowCommitEmpty&&hidden&&ssAllowsClear(id)&&!(query||'').trim()&&hidden.value!==''){
    ssSetValue(id,'',true);
    return;
  }
  if(restoreDisplay)ssSyncDisplay(id);
}
function ssOutsideClick(e){
  if(!_ssActive)return;
  const wrap=_ssActive.input.closest('.ss-wrap');
  if(wrap&&wrap.contains(e.target))return;
  ssClose(true);
}
// oninput: siempre mantiene el dropdown abierto (vacío = listado completo).
function ssInput(input){
  const id=input.dataset.ssFor;
  const q=input.value;
  if(!_ssActive||_ssActive.input!==input){
    _ssActive={id, input, query:q, highlightIdx:0};
    document.removeEventListener('click', ssOutsideClick, true);
    setTimeout(()=>document.addEventListener('click', ssOutsideClick, true),0);
  } else {
    _ssActive.query=q;
    _ssActive.highlightIdx=0;
  }
  ssRenderDropdown();
}
function ssKey(input, e){
  if(!_ssActive||_ssActive.input!==input)return;
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
    e.preventDefault();ssClose(true,false); // cancelar edición: siempre revierte, nunca vacía
  }else if(e.key==='Tab'){
    ssClose(true);
  }
}
function ssPick(value){
  if(!_ssActive)return;
  const id=_ssActive.id;
  _ssActive=null;
  document.removeEventListener('click', ssOutsideClick, true);
  document.querySelectorAll('.ss-wrap.open').forEach(w=>w.classList.remove('open'));
  ssSetValue(id, value, true);
}
// Botón «×»: vacía el texto y reabre el listado completo. Si el campo admite
// quedarse sin selección, confirma la deselección al instante.
function ssClearInput(id){
  const hidden=document.getElementById(id);
  const input=document.querySelector(`input.ss-input[data-ss-for="${id}"]`);
  if(!hidden||!input)return;
  input.value='';
  input.focus();
  if(ssAllowsClear(id)&&hidden.value!=='')ssSetValue(id,'',true);
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
  wrap.classList.add('open');
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
      if(o.value==='')el.classList.add('ss-muted');
      if(o.value===curVal)el.classList.add('ss-selected');
      if(i===_ssActive.highlightIdx)el.classList.add('ss-highlight');
      el.textContent=o.label;
      el.dataset.val=o.value;
      el.addEventListener('mousedown',e=>{e.preventDefault();ssPick(el.dataset.val);});
      dd.appendChild(el);
    });
  }
}
function ssScrollHighlight(){
  if(!_ssActive)return;
  const wrap=_ssActive.input.closest('.ss-wrap');
  const hi=wrap.querySelector('.ss-option.ss-highlight');
  if(hi)hi.scrollIntoView({block:'nearest'});
}
window.addEventListener('resize',()=>{if(_ssActive)ssClose(true);});
// Si el input pierde foco sin haberse gestionado ya (click fuera, Tab, Escape),
// restaura el display al valor actual como red de seguridad.
document.addEventListener('focusout',e=>{
  const inp=e.target;
  if(!inp||!inp.classList||!inp.classList.contains('ss-input'))return;
  if(_ssActive&&_ssActive.input===inp)return; // sesión activa: lo gestiona ssClose
  ssSyncDisplay(inp.dataset.ssFor);
},true);
