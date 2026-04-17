// ══════════════════════════════════════════════════════
//  MODE UI
// ══════════════════════════════════════════════════════
function setUpdMode(mode){
  updMode=mode;
  ['consolidated','current','custom'].forEach(m=>{
    document.getElementById('mode'+m.charAt(0).toUpperCase()+m.slice(1)).classList.toggle('active',m===mode);
  });
  document.getElementById('updCustomEndSel').style.display=mode==='custom'?'block':'none';
  renderUpdater();
}
function onCustomEndChange(){updCustomEnd=document.getElementById('updCustomEndSel').value||null;renderUpdater();}
function rebuildCustomSel(){
  const sel=document.getElementById('updCustomEndSel'),prev=sel.value||updCustomEnd;
  const weeks=getWeeks();sel.innerHTML='';
  [...weeks].reverse().forEach(ws=>{const o=document.createElement('option');o.value=ws;o.textContent=weekLabel(ws);if(ws===prev)o.selected=true;sel.appendChild(o);});
  if(!updCustomEnd&&weeks.length)updCustomEnd=weeks[weeks.length-1];
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
    updateHomeKPI();rebuildWeekSelect();return;
  }
  wksCard.classList.add('visible');
  const allWeeks=getWeeks();
  document.getElementById('wksDays').textContent=dates.length;
  document.getElementById('wksRange').textContent=`${fmtDate(dates[0])} → ${fmtDate(dates[dates.length-1])}`;
  document.getElementById('wksWeeks').textContent=allWeeks.length;
  rebuildCustomSel();
  const{ranking,last4}=compute4WKS();
  if(last4.length){
    const a=weekTag(last4[0]),b=weekTag(last4[last4.length-1]);
    document.getElementById('wksResultTag').textContent=last4.length===1?a:`${b} – ${a}`;
  }
  const prev=document.getElementById('updTargetStore').value;
  const options=ranking.map(s=>({value:s.store,label:`#${s.r} · ${s.store}`}));
  ssSetOptions('updTargetStore',options);
  const newVal=ranking.some(s=>s.store===prev)?prev:(ranking.some(s=>s.store==='Madrid Islazul')?'Madrid Islazul':(ranking[0]?.store||''));
  ssSetValue('updTargetStore',newVal,false);
  document.getElementById('updSelectorCard').style.display='flex';
  renderUpdTable();updateHomeKPI();rebuildWeekSelect();rebuildDiarioStore();rebuildAnalysisStore();
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
  const targetName=document.getElementById('updTargetStore').value;
  const sorted=[...ranking].sort((a,b)=>(b[updSortCol]-a[updSortCol])*updSortDir);
  applySortHeaders('upd',updSortCol,updSortDir,['vc','sales','buys','members','refunds']);
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
    const tr=document.createElement('tr');if(isTgt)tr.className='target';
    tr.innerHTML=`<td><span class="rank-num">${i+1}</span></td><td><span class="store-name${isTgt?' target-name':''}">${s.store}</span></td><td class="r"><span class="stat-val vc">${fmt(s.vc)}</span></td><td class="r"><span class="stat-val">${fmt(s.sales)}</span></td><td class="r"><span class="stat-val">${fmt(s.buys)}</span></td><td class="r"><span class="stat-val">${fmtN(s.members)}</span></td><td class="r"><span class="stat-val">${fmt(s.refunds)}</span></td><td style="min-width:150px">${dist}</td>`;
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
  renderUpdater();renderLog();
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
  document.getElementById('updBadgeDay').textContent=`${manualLog.length} días`;
  document.getElementById('updBadgeDay').className='badge loaded';
  document.getElementById('updDayInput').value='';
  renderUpdater();renderLog();
  toast(`✓ ${fmtDate(dateVal)} incorporado (${count} tiendas)`,'ok');
}
function renderLog(){
  const c=document.getElementById('updLog');
  if(!manualLog.length){c.innerHTML='<div style="font-size:11px;color:var(--muted);padding:6px 0;">Sin entradas manuales todavía</div>';return;}
  c.innerHTML=manualLog.slice(0,8).map(e=>`<div class="log-item"><span class="li-date">${fmtDate(e.date)}</span><span>${e.count} tiendas</span></div>`).join('');
}

