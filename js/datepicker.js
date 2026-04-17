// ══════════════════════════════════════════════════════
//  DATE PICKER (lunes-primero, DD/MM/AAAA)
// ══════════════════════════════════════════════════════
const DP_MONTHS=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
let _dpState=null;

function setDP(id, iso, fire=true){
  const hidden=document.getElementById(id);if(!hidden)return;
  hidden.value=iso||'';
  const btn=document.querySelector(`.dp-btn[data-target="${id}"]`);
  if(btn){
    const span=btn.querySelector('.dp-val');
    if(span)span.textContent=iso?fmtDate(iso):'—';
    btn.classList.toggle('empty',!iso);
  }
  if(fire)hidden.dispatchEvent(new Event('change',{bubbles:true}));
}

function openDP(btn,ev){
  if(ev){ev.stopPropagation();ev.preventDefault();}
  if(_dpState&&_dpState.targetId===btn.dataset.target){closeDP();return;}
  const id=btn.dataset.target;
  const current=document.getElementById(id)?.value||'';
  const init=current?(()=>{const [y,m,d]=current.split('-').map(Number);return new Date(y,m-1,d);})():new Date();
  _dpState={targetId:id,btn,viewY:init.getFullYear(),viewM:init.getMonth()};
  renderDPPopup();
  positionDPPopup(btn);
  setTimeout(()=>{
    document.addEventListener('click',dpOutsideClick,true);
    document.addEventListener('keydown',dpKeyDown,true);
  },0);
}

function ensureDPPopup(){
  let p=document.getElementById('dpPopup');
  if(!p){p=document.createElement('div');p.id='dpPopup';p.className='dp-popup';document.body.appendChild(p);}
  return p;
}

function renderDPPopup(){
  const popup=ensureDPPopup();
  const {viewY,viewM,targetId}=_dpState;
  const selected=document.getElementById(targetId)?.value||'';
  const todayISO=new Date().toISOString().slice(0,10);
  const hidden=document.getElementById(targetId);
  const minISO=hidden?.min||'';
  const maxISO=hidden?.max||'';
  const firstDow=((new Date(Date.UTC(viewY,viewM,1)).getUTCDay())+6)%7;
  const daysInMonth=new Date(Date.UTC(viewY,viewM+1,0)).getUTCDate();
  const prevDays=new Date(Date.UTC(viewY,viewM,0)).getUTCDate();

  let cells='';
  for(let i=firstDow-1;i>=0;i--){
    const day=prevDays-i;
    const y=viewM===0?viewY-1:viewY, m=viewM===0?12:viewM;
    const iso=`${y}-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    cells+=`<button type="button" class="dp-cell dp-other" data-iso="${iso}">${day}</button>`;
  }
  for(let d=1;d<=daysInMonth;d++){
    const iso=`${viewY}-${String(viewM+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    let cls='';
    if(iso===todayISO)cls+=' dp-today';
    if(iso===selected)cls+=' dp-selected';
    const disabled=(minISO&&iso<minISO)||(maxISO&&iso>maxISO);
    if(disabled)cls+=' dp-disabled';
    cells+=`<button type="button" class="dp-cell${cls}" ${disabled?'disabled':''} data-iso="${iso}">${d}</button>`;
  }
  const fill=(7-(firstDow+daysInMonth)%7)%7;
  for(let i=1;i<=fill;i++){
    const y=viewM===11?viewY+1:viewY, m=viewM===11?1:viewM+2;
    const iso=`${y}-${String(m).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
    cells+=`<button type="button" class="dp-cell dp-other" data-iso="${iso}">${i}</button>`;
  }

  popup.innerHTML=`
    <div class="dp-header">
      <button type="button" class="dp-nav" data-dpnav="-1" aria-label="Mes anterior"><svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg></button>
      <span class="dp-title">${DP_MONTHS[viewM]} ${viewY}</span>
      <button type="button" class="dp-nav" data-dpnav="1" aria-label="Mes siguiente"><svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg></button>
    </div>
    <div class="dp-dow"><span>L</span><span>M</span><span>X</span><span>J</span><span>V</span><span>S</span><span>D</span></div>
    <div class="dp-grid">${cells}</div>`;
  popup.querySelectorAll('[data-dpnav]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();dpNav(+b.dataset.dpnav);}));
  popup.querySelectorAll('.dp-cell').forEach(c=>{
    if(c.disabled||c.classList.contains('dp-disabled'))return;
    c.addEventListener('click',e=>{e.stopPropagation();setDP(_dpState.targetId,c.dataset.iso,true);closeDP();});
  });
  popup.classList.add('show');
}

function positionDPPopup(btn){
  const popup=document.getElementById('dpPopup');
  const rect=btn.getBoundingClientRect();
  popup.style.left=rect.left+'px';
  popup.style.top=(rect.bottom+6)+'px';
  setTimeout(()=>{
    const pr=popup.getBoundingClientRect();
    if(pr.right>window.innerWidth-8)popup.style.left=Math.max(8,window.innerWidth-pr.width-8)+'px';
    if(pr.bottom>window.innerHeight-8){const t=rect.top-pr.height-6;popup.style.top=Math.max(8,t)+'px';}
  },0);
}

function dpNav(delta){
  let {viewY,viewM}=_dpState;
  viewM+=delta;
  if(viewM<0){viewM=11;viewY--;}else if(viewM>11){viewM=0;viewY++;}
  _dpState.viewY=viewY;_dpState.viewM=viewM;
  renderDPPopup();
}

function closeDP(){
  const p=document.getElementById('dpPopup');
  if(p)p.classList.remove('show');
  document.removeEventListener('click',dpOutsideClick,true);
  document.removeEventListener('keydown',dpKeyDown,true);
  _dpState=null;
}

function dpOutsideClick(e){
  const p=document.getElementById('dpPopup');if(!p)return;
  if(p.contains(e.target))return;
  if(e.target.closest('.dp-btn'))return;
  closeDP();
}

function dpKeyDown(e){if(e.key==='Escape'){e.preventDefault();closeDP();}}

document.addEventListener('scroll',()=>{if(_dpState)closeDP();},true);
window.addEventListener('resize',()=>{if(_dpState)closeDP();});
