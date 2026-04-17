// ══════════════════════════════════════════════════════
//  WEEKLY
// ══════════════════════════════════════════════════════
function rebuildWeekSelect(){
  const sel=document.getElementById('wkSelect'),prev=sel.value;
  const weeks=getWeeks();sel.innerHTML='';
  if(!weeks.length){sel.innerHTML='<option value="">— sin datos —</option>';document.getElementById('wkBody').innerHTML='<tr><td colspan="7"><span class="empty-state">Carga el registro diario en «Actualización 4WKS» para ver el ranking semanal</span></td></tr>';return;}
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
  rows.sort((a,b)=>(b[wkSortCol]-a[wkSortCol])*wkSortDir);
  const daysInWeek=Object.keys(dailyData).filter(d=>weekStart(d)===ws).length;
  document.getElementById('wkMeta').textContent=`${rows.length} tiendas · ${daysInWeek}/7 días`;
  const tbody=document.getElementById('wkBody');tbody.innerHTML='';
  rows.forEach((s,i)=>{
    const isTgt=s.store==='Madrid Islazul';
    const tr=document.createElement('tr');if(isTgt)tr.className='target';
    tr.innerHTML=`<td><span class="rank-num">${i+1}</span></td><td><span class="store-name${isTgt?' target-name':''}">${s.store}</span></td><td class="r"><span class="stat-val vc">${fmt(s.vc)}</span></td><td class="r"><span class="stat-val">${fmt(s.sales)}</span></td><td class="r"><span class="stat-val">${fmt(s.buys)}</span></td><td class="r"><span class="stat-val">${fmtN(s.members)}</span></td><td class="r"><span class="stat-val">${fmt(s.refunds)}</span></td>`;
    tbody.appendChild(tr);
  });
}

