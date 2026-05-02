// ══════════════════════════════════════════════════════
//  MODE UI
// ══════════════════════════════════════════════════════
function setUpdMode(mode, fromUser=false){
  updMode=mode;
  ['consolidated','current','custom'].forEach(m=>{
    document.getElementById('mode'+m.charAt(0).toUpperCase()+m.slice(1)).classList.toggle('active',m===mode);
  });
  // Los modos por defecto (consolidated/current) son «todas las tiendas, todos los días»;
  // al cambiar manualmente desde el UI restablecemos los filtros
  if(fromUser&&mode!=='custom'){
    if(updStoreFilter!==null){
      updStoreFilter=null;
      updateStoreFilterCount();
      renderUpdStoreChecks();
    }
    if(updDayFilter!==null){
      updDayFilter=null;
    }
  }
  renderUpdater();
}

function setUpdDayFilter(action){
  if(action==='all'){
    // Reset → 0 días seleccionados = todos
    updDayFilter=null;
  }else{
    // Click solo añade el día a la selección; nunca lo quita.
    // Para deseleccionar un día concreto hay que volver a Todos y empezar otra vez.
    const cur=updDayFilter===null?[]:[...updDayFilter];
    if(!cur.includes(action))cur.push(action);
    if(cur.length===0||cur.length===7)updDayFilter=null;
    else updDayFilter=cur;
  }
  renderUpdater();schedulePersist();
}
function renderUpdDayFilterPills(){
  const wrap=document.getElementById('updDayPills');
  if(!wrap)return;
  const f=updDayFilter;
  wrap.querySelectorAll('[data-uday]').forEach(b=>{
    const d=b.dataset.uday;
    const active=d==='all'?f===null:Array.isArray(f)&&f.includes(d);
    b.classList.toggle('active',active);
  });
}
function onCustomStartChange(){
  updCustomStart=document.getElementById('updCustomStartWsel').dataset.value||null;
  if(updCustomStart&&updCustomEnd&&updCustomStart>updCustomEnd){
    updCustomEnd=updCustomStart;
    setWselValue(document.getElementById('updCustomEndWsel'),updCustomEnd);
  }
  renderUpdater();schedulePersist();
}
function onCustomEndChange(){
  updCustomEnd=document.getElementById('updCustomEndWsel').dataset.value||null;
  if(updCustomStart&&updCustomEnd&&updCustomStart>updCustomEnd){
    updCustomStart=updCustomEnd;
    setWselValue(document.getElementById('updCustomStartWsel'),updCustomStart);
  }
  renderUpdater();schedulePersist();
}
function onCustomEndAutoChange(){
  updCustomEndAuto=document.getElementById('updCustomEndAutoCb').checked;
  renderUpdater();schedulePersist();
}
// ── DROPDOWN CUSTOM (wsel) ──
function toggleWsel(btn,e){
  e.stopPropagation();
  const wsel=btn.closest('.wsel');
  if(wsel.classList.contains('wsel-disabled'))return;
  const willOpen=!wsel.classList.contains('open');
  document.querySelectorAll('.wsel.open').forEach(w=>w.classList.remove('open'));
  if(willOpen){
    wsel.classList.add('open');
    const cur=wsel.querySelector('.wsel-opt.active');
    if(cur)cur.scrollIntoView({block:'nearest'});
  }
}
function selectWsel(opt,e){
  e.stopPropagation();
  const wsel=opt.closest('.wsel');
  setWselValue(wsel,opt.dataset.value);
  wsel.classList.remove('open');
  const cb=wsel.dataset.onchange;
  if(cb&&typeof window[cb]==='function')window[cb]();
}
function setWselValue(wsel,value){
  if(!wsel)return;
  wsel.dataset.value=value||'';
  const tagEl=wsel.querySelector('.wsel-tag');
  if(tagEl)tagEl.textContent=value?weekTag(value):'—';
  wsel.querySelectorAll('.wsel-opt').forEach(o=>o.classList.toggle('active',o.dataset.value===value));
}
function fillWsel(wsel,weeks){
  if(!wsel)return;
  const pop=wsel.querySelector('.wsel-pop');
  if(!pop)return;
  pop.innerHTML='';
  if(!weeks.length){
    pop.innerHTML='<div class="wsel-empty">— sin datos —</div>';
    return;
  }
  [...weeks].reverse().forEach(ws=>{
    const opt=document.createElement('div');
    opt.className='wsel-opt';
    opt.dataset.value=ws;
    opt.textContent=weekLabel(ws);
    opt.onclick=(e)=>selectWsel(opt,e);
    pop.appendChild(opt);
  });
}
document.addEventListener('click',()=>document.querySelectorAll('.wsel.open').forEach(w=>w.classList.remove('open')));
function rebuildCustomSel(){
  const wselStart=document.getElementById('updCustomStartWsel');
  const wselEnd=document.getElementById('updCustomEndWsel');
  if(!wselStart||!wselEnd)return;
  const weeks=getWeeks();
  fillWsel(wselStart,weeks);fillWsel(wselEnd,weeks);
  if(!weeks.length){
    setWselValue(wselStart,'');setWselValue(wselEnd,'');
    return;
  }
  if(!updCustomEnd||!weeks.includes(updCustomEnd))updCustomEnd=weeks[weeks.length-1];
  if(!updCustomStart||!weeks.includes(updCustomStart))updCustomStart=weeks[Math.max(0,weeks.indexOf(updCustomEnd)-3)];
  if(updCustomStart>updCustomEnd){const t=updCustomStart;updCustomStart=updCustomEnd;updCustomEnd=t;}
  setWselValue(wselStart,updCustomStart);
  // Si endAuto está activo, el dropdown muestra la última semana viva y queda deshabilitado.
  setWselValue(wselEnd,updCustomEndAuto?weeks[weeks.length-1]:updCustomEnd);
  wselEnd.classList.toggle('wsel-disabled',updCustomEndAuto);
  const cb=document.getElementById('updCustomEndAutoCb');
  if(cb)cb.checked=updCustomEndAuto;
}

// ── NAVEGACIÓN ENTRE VENTANAS ──
function shiftUpdWindow(delta){
  const allWeeks=getWeeks();
  if(!allWeeks.length)return;
  const cur=getSelected4Weeks();
  if(!cur.length)return;
  const startIdx=allWeeks.indexOf(cur[0]);
  const endIdx=allWeeks.indexOf(cur[cur.length-1]);
  const newStartIdx=startIdx+delta;
  const newEndIdx=endIdx+delta;
  if(newStartIdx<0||newEndIdx>=allWeeks.length||newEndIdx<0)return;
  updMode='custom';
  updCustomStart=allWeeks[newStartIdx];
  updCustomEnd=allWeeks[newEndIdx];
  updCustomEndAuto=false;
  setUpdMode('custom');
  schedulePersist();
}

// ── PRESETS UNIFICADOS (rango + tiendas) ──
function isUpdPresetActive(p){
  // Comparación estricta: cada componente del estado actual ha de coincidir con
  // el del preset. Un componente ausente en el preset (legacy) se interpreta como
  // «sin filtro» (null) — así solo un preset puede estar activo a la vez.
  if(p.range){
    if(updMode!=='custom')return false;
    if(updCustomStart!==p.range.start)return false;
    if(p.range.endAuto){if(!updCustomEndAuto)return false;}
    else if(updCustomEndAuto||updCustomEnd!==p.range.end)return false;
  }else{
    if(updMode==='custom')return false;
  }
  const pStores=p.stores===undefined?null:p.stores;
  const aS=pStores===null?null:[...pStores].sort().join('|');
  const bS=updStoreFilter===null?null:[...updStoreFilter].sort().join('|');
  if(aS!==bS)return false;
  const pDays=p.days===undefined?null:p.days;
  const aD=pDays===null?null:[...pDays].sort().join('|');
  const bD=updDayFilter===null?null:[...updDayFilter].sort().join('|');
  if(aD!==bD)return false;
  return true;
}
function presetSummary(p){
  const parts=[];
  if(p.range){
    const endLbl=p.range.endAuto?'última ↻':weekTag(p.range.end);
    parts.push(`${weekTag(p.range.start)} → ${endLbl}`);
  }
  if(p.stores!==undefined){
    parts.push(p.stores===null?'todas':`${p.stores.length} tiendas`);
  }
  if(p.days!==undefined){
    if(p.days===null)parts.push('todos los días');
    else parts.push(`${p.days.length} día${p.days.length===1?'':'s'}`);
  }
  return parts.join(' · ')||'sin filtros';
}
function renderUpdPresets(){
  const list=document.getElementById('updPresetsList');
  if(!list)return;
  list.innerHTML='';
  if(!updPresets.length){
    const empty=document.createElement('span');empty.className='preset-pill empty';empty.textContent='Sin presets guardados';list.appendChild(empty);return;
  }
  updPresets.forEach((p,i)=>{
    const isActive=isUpdPresetActive(p);
    const pill=document.createElement('span');pill.className='preset-pill mode-preset-pill'+(isActive?' active':'');
    const name=document.createElement('span');name.className='pp-name';
    name.textContent=p.name;
    name.title=presetSummary(p);
    name.onclick=()=>applyUpdPreset(i);
    const del=document.createElement('span');del.className='pp-del';del.textContent='×';del.title='Eliminar';del.onclick=(e)=>{e.stopPropagation();deleteUpdPreset(i);};
    pill.appendChild(name);pill.appendChild(del);list.appendChild(pill);
  });
}
function applyUpdPreset(i){
  const p=updPresets[i];if(!p)return;
  // Aplicación estricta: el preset describe el estado completo. Cualquier
  // componente ausente (presets legacy) se trata como «sin filtro».
  if(p.range){
    updCustomStart=p.range.start;updCustomEnd=p.range.end;updCustomEndAuto=!!p.range.endAuto;
    setUpdMode('custom');
  }else{
    setUpdMode('consolidated');
  }
  const pStores=p.stores===undefined?null:p.stores;
  if(pStores===null){updStoreFilter=null;}
  else{
    const all=getAllStoresInData();
    const filtered=pStores.filter(s=>all.includes(s));
    updStoreFilter=filtered.length===all.length?null:filtered;
  }
  updateStoreFilterCount();renderUpdStoreChecks();
  updDayFilter=(p.days===undefined||p.days===null)?null:[...p.days];
  renderUpdater();schedulePersist();
  toast(`✓ Preset «${p.name}» aplicado`,'ok');
}
function saveUpdPreset(){
  if(!updCustomStart||!updCustomEnd){toast('⚠ Configura un rango primero','err');return;}
  const storesSnap=updStoreFilter===null?null:updStoreFilter.slice();
  const daysSnap=updDayFilter===null?null:updDayFilter.slice();
  const name=prompt('Nombre para el preset:','');
  if(name==null)return;
  const trimmed=name.trim();if(!trimmed){toast('⚠ Nombre vacío','err');return;}
  const idx=updPresets.findIndex(p=>p.name.toLowerCase()===trimmed.toLowerCase());
  const entry={name:trimmed,range:{start:updCustomStart,end:updCustomEnd,endAuto:updCustomEndAuto},stores:storesSnap,days:daysSnap};
  if(idx>=0){if(!confirm(`Sobrescribir «${trimmed}»?`))return;updPresets[idx]=entry;}
  else updPresets.push(entry);
  renderUpdPresets();schedulePersist();
  toast(`✓ Preset «${trimmed}» guardado`,'ok');
}
function deleteUpdPreset(i){
  const p=updPresets[i];if(!p)return;
  if(!confirm(`Eliminar «${p.name}»?`))return;
  updPresets.splice(i,1);renderUpdPresets();schedulePersist();
}

// ── INSPECTOR (drawer flotante derecho con ambos paneles) ──
function openInspector(){
  const insp=document.getElementById('updInspector');
  if(!insp)return;
  insp.classList.add('open');
  // Si no hay datos aún, no tiene sentido abrirlo; pero igual lo dejamos navegable
  renderUpdStoreChecks();
}
function closeInspector(){
  const insp=document.getElementById('updInspector');
  if(insp)insp.classList.remove('open');
}

// ── FILTRO DE TIENDAS ──
function getAllStoresInData(){
  const stores=new Set();
  for(const dateStores of Object.values(dailyData))for(const s of Object.keys(dateStores))stores.add(s);
  return [...stores].sort();
}
function clearUpdStoreFilter(){
  updStoreFilter=null;
  updateStoreFilterCount();
  renderUpdStoreChecks();
  renderUpdater();schedulePersist();
}
function updStoreFilterAll(){updStoreFilter=null;updateStoreFilterCount();renderUpdStoreChecks();renderUpdater();schedulePersist();}
function updStoreFilterNone(){updStoreFilter=[];updateStoreFilterCount();renderUpdStoreChecks();renderUpdater();schedulePersist();}
function onUpdStoreCheckChange(cb){
  const store=cb.value;
  const all=getAllStoresInData();
  if(updStoreFilter===null){
    // Estaba "todas". Desmarcar significa filtro = todas menos esta.
    updStoreFilter=all.filter(s=>s!==store);
  }else{
    if(cb.checked){
      if(!updStoreFilter.includes(store))updStoreFilter.push(store);
      // Si ahora están todas seleccionadas, vuelve a "sin filtro"
      if(updStoreFilter.length===all.length)updStoreFilter=null;
    }else{
      updStoreFilter=updStoreFilter.filter(s=>s!==store);
    }
  }
  updateStoreFilterCount();
  renderUpdater();schedulePersist();
}
function renderUpdStoreChecks(){
  const wrap=document.getElementById('updStoreChecks');
  if(!wrap)return;
  const all=getAllStoresInData();
  if(!all.length){wrap.innerHTML='<span class="empty-state">Sin datos cargados</span>';return;}
  wrap.innerHTML='';
  const set=updStoreFilter===null?new Set(all):new Set(updStoreFilter);
  all.forEach(store=>{
    const lbl=document.createElement('label');lbl.className='store-check';
    const cb=document.createElement('input');cb.type='checkbox';cb.value=store;cb.checked=set.has(store);
    cb.onchange=()=>onUpdStoreCheckChange(cb);
    const span=document.createElement('span');span.textContent=store;
    lbl.appendChild(cb);lbl.appendChild(span);wrap.appendChild(lbl);
  });
}
function updateStoreFilterCount(){
  const all=getAllStoresInData();
  const countEl=document.getElementById('updStoreFilterCount');
  const counterEl=document.getElementById('updStoreFilterCounter');
  if(updStoreFilter===null){
    if(countEl)countEl.textContent=`Todas (${all.length})`;
    if(counterEl)counterEl.textContent=`${all.length} / ${all.length}`;
  }else{
    if(countEl)countEl.textContent=`${updStoreFilter.length} de ${all.length}`;
    if(counterEl)counterEl.textContent=`${updStoreFilter.length} / ${all.length}`;
  }
}

// ══════════════════════════════════════════════════════
//  SETTINGS
// ══════════════════════════════════════════════════════
function onCexStartChange(){const v=document.getElementById('settingsCexStart').value;if(v){cexYearStart=v;renderSettingsNote();rebuildWeekSelect();renderWeekly();renderUpdater();}}
function renderSettingsNote(){
  const el=document.getElementById('settingsCexNote');
  const wk1=weekStart(cexYearStart),n=cexWeekNum(weekStart(new Date().toISOString().slice(0,10)));
  el.innerHTML=`WK01 empieza el <strong>Sáb ${fmtDate(wk1)}</strong>. Semana actual: <strong>WK${String(n).padStart(2,'0')}</strong>.`;
  setDP('settingsCexStart',cexYearStart,false);
}


// ══════════════════════════════════════════════════════
//  UPDATER
// ══════════════════════════════════════════════════════
function renderUpdater(){
  const dates=Object.keys(dailyData).sort();
  const wksCard=document.getElementById('wksCard');
  if(!dates.length){
    wksCard.classList.remove('visible');
    document.getElementById('updSelectorCard').style.display='none';
    document.getElementById('updRankingBody').innerHTML='<tr><td colspan="8"><span class="empty-state">Carga el registro diario para calcular el 4WKS</span></td></tr>';
    closeInspector();
    updateHomeKPI();rebuildWeekSelect();return;
  }
  wksCard.classList.add('visible');
  const allWeeks=getWeeks();
  document.getElementById('wksDays').textContent=dates.length;
  document.getElementById('wksRange').textContent=`${fmtDate(dates[0])} → ${fmtDate(dates[dates.length-1])}`;
  document.getElementById('wksWeeks').textContent=allWeeks.length;
  rebuildCustomSel();
  renderUpdPresets();
  renderUpdDayFilterPills();
  updateStoreFilterCount();
  renderUpdStoreChecks();
  const{ranking,last4}=compute4WKS();
  if(last4.length){
    const a=weekTag(last4[0]),b=weekTag(last4[last4.length-1]);
    document.getElementById('wksResultTag').textContent=last4.length===1?a:`${a} – ${b}`;
    const startIdx=allWeeks.indexOf(last4[0]);
    const endIdx=allWeeks.indexOf(last4[last4.length-1]);
    const np=document.getElementById('wksNavPrev'),nn=document.getElementById('wksNavNext');
    if(np)np.disabled=startIdx<=0;
    if(nn)nn.disabled=endIdx>=allWeeks.length-1;
  }
  const prev=document.getElementById('updTargetStore').value;
  const options=ranking.map(s=>({value:s.store,label:`#${s.r} · ${s.store}`}));
  ssSetOptions('updTargetStore',options);
  const newVal=ranking.some(s=>s.store===prev)?prev:(ranking.some(s=>s.store==='Madrid Islazul')?'Madrid Islazul':(ranking[0]?.store||''));
  ssSetValue('updTargetStore',newVal,false);
  document.getElementById('updSelectorCard').style.display='flex';
  renderUpdTable();updateHomeKPI();rebuildWeekSelect();rebuildDiarioStore();rebuildSemanalStore();rebuildAnalysisStore();rebuildDailyDate();rebuildPatStore();rebuildPatRange();
}

function applySortHeaders(prefix,col,dir,cols){
  cols.forEach(c=>{
    const th=document.querySelector(`[data-col="${c}"]`);
    const arr=document.getElementById(`${prefix}Arr-${c}`);
    if(!th||!arr)return;
    if(c===col){th.classList.add('sort-active');arr.style.opacity='1';arr.textContent=dir===-1?'▼':'▲';}
    else{th.classList.remove('sort-active');arr.style.opacity='0';}
  });
}

function sortUpd(col){if(updSortCol===col)updSortDir*=-1;else{updSortCol=col;updSortDir=-1;}renderUpdTable();}

const UPD_ALT_LABELS={
  sales:'# Ventas',
  buys:'# Compras',
  members:'# Socios',
  refunds:'# Devol.',
};
function renderUpdTable(){
  const{ranking}=compute4WKS();
  const prevRank=computePrev4WKSRanking();
  ranking.forEach(s=>{const p=prevRank.get(s.store);s.delta=p==null?null:p-s.r;});
  const targetName=document.getElementById('updTargetStore').value;
  const sorted=[...ranking].sort((a,b)=>{
    if(updSortCol==='delta'){
      if(a.delta==null&&b.delta==null)return 0;
      if(a.delta==null)return 1;
      if(b.delta==null)return -1;
      return(a.delta-b.delta)*updSortDir;
    }
    return(a[updSortCol]-b[updSortCol])*updSortDir;
  });
  applySortHeaders('upd',updSortCol,updSortDir,['vc','sales','buys','members','refunds','delta']);
  // Columna alterna: solo si ordenamos por una métrica distinta de V+C (vc) y de delta
  const altCol=UPD_ALT_LABELS[updSortCol]?updSortCol:null;
  const altHeader=document.getElementById('updAltRankHeader');
  let altRankMap=null;
  if(altCol){
    altHeader.style.display='';
    altHeader.textContent=UPD_ALT_LABELS[altCol];
    const byAlt=[...ranking].sort((a,b)=>(b[altCol]||0)-(a[altCol]||0));
    altRankMap=new Map(byAlt.map((s,i)=>[s.store,i+1]));
  }else{
    altHeader.style.display='none';
    altHeader.textContent='';
  }
  const targetRow=sorted.find(s=>s.store===targetName);
  const targetVC=targetRow?targetRow.vc:0;
  const maxDist=Math.max(...sorted.map(s=>Math.abs(s.vc-targetVC)))||1;
  document.getElementById('updDistHeader').textContent=`Dist. ${targetName.split(' ').slice(-1)[0]}`;
  const tbody=document.getElementById('updRankingBody');tbody.innerHTML='';
  sorted.forEach((s,i)=>{
    const isTgt=s.store===targetName;
    const diff=targetVC-s.vc,pct=Math.min(100,Math.round(Math.abs(diff)/maxDist*100));
    let dist;
    if(isTgt){dist=`<span class="dist-val self">— tú —</span>`;}
    else{const cls=diff<0?'above':'below',sign=diff<0?`−${fmt(Math.abs(diff))}`:`+${fmt(diff)}`;dist=`<div class="dist-wrap"><div class="dist-bar-track"><div class="dist-bar-fill ${cls}" style="width:${pct}%"></div></div><span class="dist-val ${cls}">${sign}</span></div>`;}
    const prevR=prevRank.get(s.store);
    let trendCell;
    if(prevR==null){trendCell=`<span class="trend new">Nuevo</span>`;}
    else{
      const delta=prevR-s.r;
      if(delta>0)trendCell=`<span class="trend up">▲ ${delta}</span>`;
      else if(delta<0)trendCell=`<span class="trend down">▼ ${-delta}</span>`;
      else trendCell=`<span class="trend same">—</span>`;
    }
    const altCell=altCol
      ?`<td class="r alt-rank-col"><span class="rank-num alt-rank">${altRankMap.get(s.store)}</span></td>`
      :`<td class="r alt-rank-col" style="display:none"></td>`;
    const tr=document.createElement('tr');if(isTgt)tr.className='target';
    tr.innerHTML=`<td><span class="rank-num">${s.r}</span></td><td class="r">${trendCell}</td>${altCell}<td><span class="store-name${isTgt?' target-name':''}">${s.store}</span></td><td class="r"><span class="stat-val vc">${fmt(s.vc)}</span></td><td class="r"><span class="stat-val">${fmt(s.sales)}</span></td><td class="r"><span class="stat-val">${fmt(s.buys)}</span></td><td class="r"><span class="stat-val">${fmtN(s.members)}</span></td><td class="r"><span class="stat-val">${fmt(s.refunds)}</span></td><td style="min-width:150px">${dist}</td>`;
    tbody.appendChild(tr);
  });
}

function updateHomeKPI(){
  const dates=Object.keys(dailyData).sort();
  document.getElementById('homeKpiDays').textContent=dates.length||'—';
  document.getElementById('homeKpiRange').textContent=dates.length?`${fmtDate(dates[0])} → ${fmtDate(dates[dates.length-1])}`:'sin datos';
}

function applyRegistroCSV(text,fname){
  const{data,rows}=parseRegistroCSV(text);
  if(!rows)return;
  dailyData=data;dailyCSVRaw=text;dailyCSVName=fname||'';
  for(const entry of manualLog){const{map}=parseDayPaste(entry.rawText);const dn=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date(entry.date+'T12:00:00Z').getUTCDay()];for(const s of Object.values(map))s.day=dn;if(!dailyData[entry.date])dailyData[entry.date]={};Object.assign(dailyData[entry.date],map);}
  renderUpdater();renderLog();suggestNextUpdDate();
}
function suggestNextUpdDate(){
  const dates=Object.keys(dailyData);
  if(!dates.length){setDP('updDayDate',new Date().toISOString().slice(0,10),false);return;}
  const last=dates.sort().slice(-1)[0];
  const d=new Date(last+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+1);
  setDP('updDayDate',d.toISOString().slice(0,10),false);
}
function incorporateDay(){
  const dateVal=document.getElementById('updDayDate').value;
  const text=document.getElementById('updDayInput').value.trim();
  const replaceCb=document.getElementById('updDayReplaceCb');
  const replace=!!(replaceCb&&replaceCb.checked);
  if(!dateVal){toast('⚠ Elige una fecha','err');return;}
  if(!text){toast('⚠ Pega los datos del día','err');return;}
  const{map,count}=parseDayPaste(text);
  if(!count){toast('⚠ No se han detectado filas válidas','err');return;}
  const dayName=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date(dateVal+'T12:00:00Z').getUTCDay()];
  for(const s of Object.values(map))s.day=dayName;
  const prevCount=dailyData[dateVal]?Object.keys(dailyData[dateVal]).length:0;
  if(replace&&prevCount>0){
    if(!confirm(`¿Sustituir el día ${fmtDate(dateVal)}?\n\nSe borrarán las ${prevCount} tiendas existentes y quedarán las ${count} nuevas. Esta acción no se puede deshacer.`))return;
    dailyData[dateVal]=map;
  }else{
    if(!dailyData[dateVal])dailyData[dateVal]={};
    Object.assign(dailyData[dateVal],map);
  }
  const idx=manualLog.findIndex(e=>e.date===dateVal);
  const entry={date:dateVal,count,rawText:text};
  if(idx>=0)manualLog[idx]=entry;else manualLog.unshift(entry);
  document.getElementById('updDayInput').value='';
  if(replaceCb)replaceCb.checked=false;
  renderUpdater();renderLog();suggestNextUpdDate();
  const verb=replace&&prevCount>0?'sustituido':'incorporado';
  toast(`✓ ${fmtDate(dateVal)} ${verb} (${count} tiendas)`,'ok');
}
function renderLog(){
  const c=document.getElementById('updLog');
  if(!manualLog.length){c.innerHTML='<div class="log-empty">Sin entradas todavía</div>';return;}
  c.innerHTML=manualLog.slice(0,6).map(e=>`<div class="log-item"><span class="li-date">${fmtDate(e.date)}</span><span>${e.count} tiendas</span></div>`).join('');
}
function copyBookmarklet(){
  const el=document.getElementById('cexBookmarkletSrc');
  if(!el){toast('⚠ Script no encontrado','err');return;}
  const src=el.textContent.trim();
  if(navigator.clipboard&&window.isSecureContext){
    navigator.clipboard.writeText(src).then(()=>toast('✓ Bookmarklet copiado','ok'),()=>toast('⚠ No se pudo copiar','err'));
  }else{
    const ta=document.createElement('textarea');ta.value=src;document.body.appendChild(ta);ta.select();
    try{document.execCommand('copy');toast('✓ Bookmarklet copiado','ok');}
    catch(e){toast('⚠ No se pudo copiar','err');}
    finally{document.body.removeChild(ta);}
  }
}

