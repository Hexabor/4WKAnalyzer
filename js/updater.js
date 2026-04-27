// ══════════════════════════════════════════════════════
//  MODE UI
// ══════════════════════════════════════════════════════
function setUpdMode(mode){
  updMode=mode;
  ['consolidated','current','custom'].forEach(m=>{
    document.getElementById('mode'+m.charAt(0).toUpperCase()+m.slice(1)).classList.toggle('active',m===mode);
  });
  const block=document.getElementById('updCustomBlock');
  if(block)block.style.display=mode==='custom'?'':'none';
  renderUpdater();
}
function onCustomStartChange(){
  updCustomStart=document.getElementById('updCustomStartSel').value||null;
  if(updCustomStart&&updCustomEnd&&updCustomStart>updCustomEnd){
    updCustomEnd=updCustomStart;
    document.getElementById('updCustomEndSel').value=updCustomEnd;
  }
  renderUpdater();schedulePersist();
}
function onCustomEndChange(){
  updCustomEnd=document.getElementById('updCustomEndSel').value||null;
  if(updCustomStart&&updCustomEnd&&updCustomStart>updCustomEnd){
    updCustomStart=updCustomEnd;
    document.getElementById('updCustomStartSel').value=updCustomStart;
  }
  renderUpdater();schedulePersist();
}
function onCustomEndAutoChange(){
  updCustomEndAuto=document.getElementById('updCustomEndAutoCb').checked;
  renderUpdater();schedulePersist();
}
function rebuildCustomSel(){
  const selStart=document.getElementById('updCustomStartSel');
  const selEnd=document.getElementById('updCustomEndSel');
  if(!selStart||!selEnd)return;
  const weeks=getWeeks();
  selStart.innerHTML='';selEnd.innerHTML='';
  if(!weeks.length){
    selStart.innerHTML='<option value="">— sin datos —</option>';
    selEnd.innerHTML='<option value="">— sin datos —</option>';
    return;
  }
  [...weeks].reverse().forEach(ws=>{
    const oS=document.createElement('option');oS.value=ws;oS.textContent=weekLabel(ws);selStart.appendChild(oS);
    const oE=document.createElement('option');oE.value=ws;oE.textContent=weekLabel(ws);selEnd.appendChild(oE);
  });
  if(!updCustomEnd||!weeks.includes(updCustomEnd))updCustomEnd=weeks[weeks.length-1];
  if(!updCustomStart||!weeks.includes(updCustomStart))updCustomStart=weeks[Math.max(0,weeks.indexOf(updCustomEnd)-3)];
  if(updCustomStart>updCustomEnd){const t=updCustomStart;updCustomStart=updCustomEnd;updCustomEnd=t;}
  selStart.value=updCustomStart;
  // Si endAuto está activo, el select muestra la última semana viva y queda deshabilitado.
  selEnd.value=updCustomEndAuto?weeks[weeks.length-1]:updCustomEnd;
  selEnd.disabled=updCustomEndAuto;
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

// ── PRESETS DE RANGO ──
function isUpdRangePresetActive(p){
  if(updMode!=='custom')return false;
  if(updCustomStart!==p.start)return false;
  if(p.endAuto)return !!updCustomEndAuto;
  return !updCustomEndAuto&&updCustomEnd===p.end;
}
function renderUpdRangePresets(){
  const list=document.getElementById('updRangePresetsList');
  if(!list)return;
  if(!updRangePresets.length){list.innerHTML='';list.style.display='none';return;}
  list.style.display='';
  list.innerHTML='';
  updRangePresets.forEach((p,i)=>{
    const isActive=isUpdRangePresetActive(p);
    const pill=document.createElement('span');pill.className='preset-pill mode-preset-pill'+(isActive?' active':'');
    const name=document.createElement('span');name.className='pp-name';
    name.textContent=p.endAuto?`${p.name} ↻`:p.name;
    name.title=p.endAuto?`${weekTag(p.start)} → última (vivo)`:`${weekTag(p.start)} → ${weekTag(p.end)}`;
    name.onclick=()=>applyUpdRangePreset(i);
    const del=document.createElement('span');del.className='pp-del';del.textContent='×';del.title='Eliminar';del.onclick=(e)=>{e.stopPropagation();deleteUpdRangePreset(i);};
    pill.appendChild(name);pill.appendChild(del);list.appendChild(pill);
  });
}
function applyUpdRangePreset(i){
  const p=updRangePresets[i];if(!p)return;
  updCustomStart=p.start;updCustomEnd=p.end;
  updCustomEndAuto=!!p.endAuto;
  setUpdMode('custom');
  schedulePersist();
  toast(`✓ Rango «${p.name}» aplicado`,'ok');
}
function saveUpdRangePreset(){
  if(!updCustomStart){toast('⚠ Elige un inicio primero','err');return;}
  const endLbl=updCustomEndAuto?'última':weekTag(updCustomEnd);
  const name=prompt(`Nombre para el rango ${weekTag(updCustomStart)} → ${endLbl}:`,'');
  if(name==null)return;
  const trimmed=name.trim();if(!trimmed){toast('⚠ Nombre vacío','err');return;}
  const idx=updRangePresets.findIndex(p=>p.name.toLowerCase()===trimmed.toLowerCase());
  const entry={name:trimmed,start:updCustomStart,end:updCustomEnd,endAuto:updCustomEndAuto};
  if(idx>=0){if(!confirm(`Sobrescribir «${trimmed}»?`))return;updRangePresets[idx]=entry;}
  else updRangePresets.push(entry);
  renderUpdRangePresets();schedulePersist();
  toast(`✓ Rango «${trimmed}» guardado`,'ok');
}
function deleteUpdRangePreset(i){
  const p=updRangePresets[i];if(!p)return;
  if(!confirm(`Eliminar «${p.name}»?`))return;
  updRangePresets.splice(i,1);renderUpdRangePresets();schedulePersist();
}

// ── FILTRO DE TIENDAS ──
function getAllStoresInData(){
  const stores=new Set();
  for(const dateStores of Object.values(dailyData))for(const s of Object.keys(dateStores))stores.add(s);
  return [...stores].sort();
}
function toggleUpdStoreFilter(){
  const panel=document.getElementById('updStoreFilterPanel');
  const open=panel.style.display==='none';
  panel.style.display=open?'':'none';
  const btn=document.getElementById('updStoreFilterToggleBtn');
  if(btn)btn.textContent=open?'Cerrar':'Editar selección';
  if(open){renderUpdStoreChecks();renderUpdStorePresets();}
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
  // Visibilidad de la card: mostrar si hay datos
  const card=document.getElementById('updStoreFilterCard');
  if(card)card.style.display=all.length?'':'none';
}
function renderUpdStorePresets(){
  const list=document.getElementById('updStorePresetsList');
  if(!list)return;
  if(!updStorePresets.length){list.innerHTML='<span class="preset-pill empty">Sin selecciones guardadas</span>';return;}
  list.innerHTML='';
  updStorePresets.forEach((p,i)=>{
    const pill=document.createElement('span');pill.className='preset-pill';
    const name=document.createElement('span');name.className='pp-name';name.textContent=`${p.name} (${p.stores.length})`;name.title='Aplicar';name.onclick=()=>applyUpdStorePreset(i);
    const del=document.createElement('span');del.className='pp-del';del.textContent='×';del.title='Eliminar';del.onclick=()=>deleteUpdStorePreset(i);
    pill.appendChild(name);pill.appendChild(del);list.appendChild(pill);
  });
}
function applyUpdStorePreset(i){
  const p=updStorePresets[i];if(!p)return;
  // Solo conservar las tiendas que existen en los datos actuales
  const all=getAllStoresInData();
  updStoreFilter=p.stores.filter(s=>all.includes(s));
  if(updStoreFilter.length===all.length)updStoreFilter=null;
  updateStoreFilterCount();renderUpdStoreChecks();renderUpdater();schedulePersist();
  toast(`✓ Selección «${p.name}» aplicada`,'ok');
}
function saveUpdStorePreset(){
  const all=getAllStoresInData();
  const stores=updStoreFilter===null?all.slice():updStoreFilter.slice();
  if(!stores.length){toast('⚠ La selección está vacía','err');return;}
  const name=prompt(`Nombre para esta selección (${stores.length} tiendas):`,'');
  if(name==null)return;
  const trimmed=name.trim();if(!trimmed){toast('⚠ Nombre vacío','err');return;}
  const idx=updStorePresets.findIndex(p=>p.name.toLowerCase()===trimmed.toLowerCase());
  const entry={name:trimmed,stores};
  if(idx>=0){if(!confirm(`Sobrescribir «${trimmed}»?`))return;updStorePresets[idx]=entry;}
  else updStorePresets.push(entry);
  renderUpdStorePresets();schedulePersist();
  toast(`✓ Selección «${trimmed}» guardada`,'ok');
}
function deleteUpdStorePreset(i){
  const p=updStorePresets[i];if(!p)return;
  if(!confirm(`Eliminar «${p.name}»?`))return;
  updStorePresets.splice(i,1);renderUpdStorePresets();schedulePersist();
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
    const sfc=document.getElementById('updStoreFilterCard');if(sfc)sfc.style.display='none';
    document.getElementById('updRankingBody').innerHTML='<tr><td colspan="8"><span class="empty-state">Carga el registro diario para calcular el 4WKS</span></td></tr>';
    updateHomeKPI();rebuildWeekSelect();return;
  }
  wksCard.classList.add('visible');
  const allWeeks=getWeeks();
  document.getElementById('wksDays').textContent=dates.length;
  document.getElementById('wksRange').textContent=`${fmtDate(dates[0])} → ${fmtDate(dates[dates.length-1])}`;
  document.getElementById('wksWeeks').textContent=allWeeks.length;
  rebuildCustomSel();
  renderUpdRangePresets();
  updateStoreFilterCount();
  renderUpdStorePresets();
  const{ranking,last4}=compute4WKS();
  if(last4.length){
    const a=weekTag(last4[0]),b=weekTag(last4[last4.length-1]);
    document.getElementById('wksResultTag').textContent=last4.length===1?a:`${b} – ${a}`;
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
    const tr=document.createElement('tr');if(isTgt)tr.className='target';
    tr.innerHTML=`<td><span class="rank-num">${s.r}</span></td><td class="r">${trendCell}</td><td><span class="store-name${isTgt?' target-name':''}">${s.store}</span></td><td class="r"><span class="stat-val vc">${fmt(s.vc)}</span></td><td class="r"><span class="stat-val">${fmt(s.sales)}</span></td><td class="r"><span class="stat-val">${fmt(s.buys)}</span></td><td class="r"><span class="stat-val">${fmtN(s.members)}</span></td><td class="r"><span class="stat-val">${fmt(s.refunds)}</span></td><td style="min-width:150px">${dist}</td>`;
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
  if(!dateVal){toast('⚠ Elige una fecha','err');return;}
  if(!text){toast('⚠ Pega los datos del día','err');return;}
  const{map,count}=parseDayPaste(text);
  if(!count){toast('⚠ No se han detectado filas válidas','err');return;}
  const dayName=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date(dateVal+'T12:00:00Z').getUTCDay()];
  for(const s of Object.values(map))s.day=dayName;
  if(!dailyData[dateVal])dailyData[dateVal]={};
  Object.assign(dailyData[dateVal],map);
  const idx=manualLog.findIndex(e=>e.date===dateVal);
  const entry={date:dateVal,count,rawText:text};
  if(idx>=0)manualLog[idx]=entry;else manualLog.unshift(entry);
  document.getElementById('updDayInput').value='';
  renderUpdater();renderLog();suggestNextUpdDate();
  toast(`✓ ${fmtDate(dateVal)} incorporado (${count} tiendas)`,'ok');
}
function renderLog(){
  const c=document.getElementById('updLog');
  if(!manualLog.length){c.innerHTML='<div style="font-size:11px;color:var(--muted);padding:6px 0;">Sin entradas manuales todavía</div>';return;}
  c.innerHTML=manualLog.slice(0,5).map(e=>`<div class="log-item"><span class="li-date">${fmtDate(e.date)}</span><span>${e.count} tiendas</span></div>`).join('');
}

