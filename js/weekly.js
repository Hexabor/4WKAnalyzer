// ══════════════════════════════════════════════════════
//  WEEKLY
// ══════════════════════════════════════════════════════
function rebuildWeeklyStore(){
  const hidden=document.getElementById('weeklyStore');if(!hidden)return;
  const prev=weeklyStoreSel||hidden.value;
  const stores=new Set();
  for(const dateStores of Object.values(dailyData))for(const s of Object.keys(dateStores))stores.add(s);
  const sorted=[...stores].sort();
  const options=sorted.map(s=>({value:s,label:s}));
  ssSetOptions('weeklyStore',options);
  if(!sorted.length){ssSetValue('weeklyStore','',false);weeklyStoreSel='';return;}
  const newVal=sorted.includes(prev)?prev:(sorted.includes('Madrid Islazul')?'Madrid Islazul':sorted[0]);
  ssSetValue('weeklyStore',newVal,false);
  weeklyStoreSel=newVal;
}

function onWeeklyStoreChange(){
  weeklyStoreSel=document.getElementById('weeklyStore').value;
  renderWeekly();schedulePersist();
}

function rebuildWeekSelect(){
  const sel=document.getElementById('wkSelect'),prev=sel.value;
  const weeks=getWeeks();sel.innerHTML='';
  if(!weeks.length){sel.innerHTML='<option value="">— sin datos —</option>';document.getElementById('wkBody').innerHTML='<tr><td colspan="7"><span class="empty-state">Carga el registro diario en «Ranking por rango» para ver el ranking semanal</span></td></tr>';return;}
  [...weeks].reverse().forEach(ws=>{const o=document.createElement('option');o.value=ws;o.textContent=weekLabel(ws);if(ws===prev)o.selected=true;sel.appendChild(o);});
  if(!prev||!weeks.includes(prev))sel.value=[...weeks].reverse()[0];
  updateWkNav();
}
function wkStep(delta){
  const sel=document.getElementById('wkSelect'),opts=Array.from(sel.options);
  // Options are reverse-chronological (newest=0), so ← (prev) = +1 index, → (next) = -1 index
  const idx=opts.findIndex(o=>o.value===sel.value),next=idx-delta;
  if(next>=0&&next<opts.length){sel.value=opts[next].value;renderWeekly();}
}
function updateWkNav(){
  const sel=document.getElementById('wkSelect'),opts=Array.from(sel.options);
  const idx=opts.findIndex(o=>o.value===sel.value);
  document.getElementById('wkPrev').disabled=idx>=opts.length-1;
  document.getElementById('wkNext').disabled=idx<=0;
}
function sortWk(col){if(wkSortCol===col)wkSortDir*=-1;else{wkSortCol=col;wkSortDir=-1;}renderWeekly();}
function renderWeekly(){
  const sel=document.getElementById('wkSelect'),ws=sel.value;
  updateWkNav();
  rebuildWeeklyStore();
  applySortHeaders('wk',wkSortCol,wkSortDir,['vc','sales','buys','members','refunds']);
  if(!ws)return;
  const agg={};
  for(const [d,stores] of Object.entries(dailyData)){
    if(weekStart(d)!==ws)continue;
    for(const [store,s] of Object.entries(stores)){
      if(!agg[store])agg[store]={vc:0,sales:0,buys:0,members:0,refunds:0};
      agg[store].vc+=s.vc;agg[store].sales+=s.sales;agg[store].buys+=s.buys;agg[store].members+=s.members;agg[store].refunds+=s.refunds;
    }
  }
  const rows=Object.entries(agg).map(([store,s])=>({store,...s}));
  rows.sort((a,b)=>(a[wkSortCol]-b[wkSortCol])*wkSortDir);
  const daysInWeek=Object.keys(dailyData).filter(d=>weekStart(d)===ws).length;
  document.getElementById('wkMeta').textContent=`${rows.length} tiendas · ${daysInWeek}/7 días`;
  const tbody=document.getElementById('wkBody');tbody.innerHTML='';
  rows.forEach((s,i)=>{
    const isTgt=s.store===weeklyStoreSel;
    const tr=document.createElement('tr');if(isTgt)tr.className='target';
    tr.innerHTML=`<td><span class="rank-num">${i+1}</span></td><td><span class="store-name${isTgt?' target-name':''}">${s.store}</span></td><td class="r"><span class="stat-val vc">${fmt(s.vc)}</span></td><td class="r"><span class="stat-val">${fmt(s.sales)}</span></td><td class="r"><span class="stat-val">${fmt(s.buys)}</span></td><td class="r"><span class="stat-val">${fmtN(s.members)}</span></td><td class="r"><span class="stat-val">${fmt(s.refunds)}</span></td>`;
    tbody.appendChild(tr);
  });
}

function exportWeeklyCSV(){
  const ws=document.getElementById('wkSelect').value;
  if(!ws)return;
  const agg={};
  for(const [d,stores] of Object.entries(dailyData)){
    if(weekStart(d)!==ws)continue;
    for(const [store,s] of Object.entries(stores)){
      if(!agg[store])agg[store]={vc:0,sales:0,buys:0,members:0,refunds:0};
      agg[store].vc+=s.vc;agg[store].sales+=s.sales;agg[store].buys+=s.buys;agg[store].members+=s.members;agg[store].refunds+=s.refunds;
    }
  }
  const rows=Object.entries(agg).map(([store,s])=>({store,...s}));
  if(!rows.length)return;
  rows.sort((a,b)=>(a[wkSortCol]-b[wkSortCol])*wkSortDir);
  const header=['Rank','Tienda','V+C','Net Sales','Buys','Members','Refunds'];
  const rows2=rows.map((s,i)=>[i+1,s.store,s.vc,s.sales,s.buys,s.members,s.refunds]);
  downloadCSV(`semana-a-semana_${ws}.csv`,header,rows2);
}

function exportWeeklyPDF(){
  const sel=document.getElementById('wkSelect'),ws=sel.value;
  if(!ws)return;
  const table=document.getElementById('wkTable');
  const rowCount=table.querySelectorAll('tbody tr').length;
  if(!rowCount)return;
  exportPDF('Semana a semana',`${weekLabel(ws)} · ${rowCount} tiendas`,table);
}

