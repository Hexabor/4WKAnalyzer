// ══════════════════════════════════════════════════════
//  DIARIO DE TIENDA
// ══════════════════════════════════════════════════════
function rebuildDiarioStore(){
  const hidden=document.getElementById('diarioStore');if(!hidden)return;
  const prev=diarioStoreSel||hidden.value;
  const stores=new Set();
  for(const dateStores of Object.values(dailyData))for(const s of Object.keys(dateStores))stores.add(s);
  const sorted=[...stores].sort();
  if(!sorted.length){ssSetOptions('diarioStore',[]);ssSetValue('diarioStore','',false);diarioStoreSel='';return;}
  const options=sorted.map(s=>({value:s,label:s}));
  ssSetOptions('diarioStore',options);
  const newVal=sorted.includes(prev)?prev:sorted[0];
  ssSetValue('diarioStore',newVal,false);
  diarioStoreSel=newVal;
}

function filterDiarioDay(btn){
  diarioDayFilter=btn.dataset.day;
  document.querySelectorAll('#diarioDayFilter .diario-filter-pill').forEach(b=>b.classList.toggle('active',b===btn));
  renderDiario();
}

function sortDiario(col){
  if(diarioSortCol===col)diarioSortDir*=-1;
  else{diarioSortCol=col;diarioSortDir= col==='date'||col==='wk'? -1 : -1;}
  const allCols=['wk','date','ranking','sales','buys','cashBuys','exchBuys','refunds','members','vc'];
  document.querySelectorAll('[data-dcol]').forEach(th=>{
    const c=th.dataset.dcol;
    th.classList.toggle('sort-active',c===col);
    const arrow=document.getElementById('dArr-'+c);
    if(arrow)arrow.textContent=c===col?(diarioSortDir===-1?'▼':'▲'):'';
  });
  renderDiario();
}

function renderDiario(){
  diarioStoreSel=document.getElementById('diarioStore').value;
  const store=diarioStoreSel;
  const tbody=document.getElementById('diarioBody');

  if(!store||!Object.keys(dailyData).length){
    tbody.innerHTML='<tr><td colspan="14"><span class="empty-state">Carga el registro diario en «Actualización 4WKS» para ver el diario de tienda</span></td></tr>';
    document.getElementById('diarioSummary').style.display='none';
    return;
  }

  // Collect all days for this store, sorted chronologically for rolling calc
  const days=Object.entries(dailyData)
    .filter(([,stores])=>stores[store])
    .map(([date,stores])=>({date,...stores[store],wk:weekStart(date)}))
    .sort((a,b)=>a.date.localeCompare(b.date));

  if(!days.length){
    tbody.innerHTML='<tr><td colspan="14"><span class="empty-state">No hay datos para esta tienda</span></td></tr>';
    document.getElementById('diarioSummary').style.display='none';
    return;
  }

  // Precompute rolling 7 in chronological order (always on full dataset)
  days.forEach((d,i)=>{
    const slice=days.slice(Math.max(0,i-6),i+1);
    d._roll7=slice.reduce((s,x)=>s+x.vc,0);
    d._avg7=Math.round(d._roll7/slice.length);
    d._full7=slice.length===7;
    d._wkTag=weekTag(d.wk);
  });

  // Apply day filter
  const filtered=diarioDayFilter?days.filter(d=>d.day===diarioDayFilter):days;

  // Summary stats (on filtered set)
  const totalVC=filtered.reduce((s,d)=>s+d.vc,0);
  const rankedDays=filtered.filter(d=>d.ranking>0);
  const bestRank=rankedDays.length?Math.min(...rankedDays.map(d=>d.ranking)):0;
  const avgVC=filtered.length?Math.round(totalVC/filtered.length):0;
  const topDay=filtered.length?filtered.reduce((a,b)=>b.vc>a.vc?b:a):null;
  const hitoCount=filtered.filter(d=>hitoData[d.date]).length;
  document.getElementById('diarioSummary').style.display='flex';
  document.getElementById('dSum-days').textContent=filtered.length;
  document.getElementById('dSum-vc').textContent=fmt(totalVC);
  document.getElementById('dSum-best').textContent=bestRank?`#${bestRank}`:'—';
  document.getElementById('dSum-avg').textContent=fmt(avgVC);
  document.getElementById('dSum-top').textContent=topDay?`${fmtDate(topDay.date)} · ${fmt(topDay.vc)}`:'—';
  document.getElementById('dSum-hitos').textContent=hitoCount;

  // Sort by active column
  const sorted=[...filtered];
  const col=diarioSortCol, dir=diarioSortDir;
  sorted.sort((a,b)=>{
    let va,vb;
    if(col==='date'){va=a.date;vb=b.date;return va<vb?-dir:va>vb?dir:0;}
    if(col==='wk'){va=a.wk;vb=b.wk;return va<vb?-dir:va>vb?dir:a.date.localeCompare(b.date);}
    va=a[col]??0;vb=b[col]??0;return(va-vb)*dir;
  });

  tbody.innerHTML='';
  sorted.forEach(d=>{
    // Day class
    const dayLow=(d.day||'').toLowerCase();
    let rowClass='';
    if(dayLow==='saturday')rowClass='day-sat';
    else if(dayLow==='sunday')rowClass='day-sun';

    // Rank badge
    let rankClass='other';
    if(d.ranking===1)rankClass='top1';
    else if(d.ranking<=3)rankClass='top3';
    else if(d.ranking<=10)rankClass='top10';
    const rankCell=d.ranking>0?`<span class="rank-badge ${rankClass}">${d.ranking}</span>`:'—';

    const tr=document.createElement('tr');
    if(rowClass)tr.className=rowClass;
    tr.innerHTML=`
      <td><span class="wk-label">${d._wkTag}</span></td>
      <td><span class="stat-val">${fmtDate(d.date)}</span></td>
      <td><span class="stat-val">${DAY_ES[d.day]||d.day||'—'}</span></td>
      <td class="r">${rankCell}</td>
      <td class="r"><span class="stat-val">${fmt(d.sales)}</span></td>
      <td class="r"><span class="stat-val">${fmt(d.buys)}</span></td>
      <td class="r"><span class="stat-val">${d.cashBuys?fmt(d.cashBuys):'—'}</span></td>
      <td class="r"><span class="stat-val">${d.exchBuys?fmt(d.exchBuys):'—'}</span></td>
      <td class="r"><span class="stat-val">${fmt(d.refunds)}</span></td>
      <td class="r"><span class="stat-val">${fmtN(d.members)}</span></td>
      <td class="r"><span class="stat-val vc">${fmt(d.vc)}</span></td>
      <td class="r"><span class="rolling-val${d._full7?' highlight':''}">${fmt(d._roll7)}</span></td>
      <td class="r"><span class="rolling-val${d._full7?' highlight':''}">${fmt(d._avg7)}</span></td>
      <td class="hito-cell"><input class="hito-input" type="text" placeholder="Anotar hito…" value="${(hitoData[d.date]||'').replace(/"/g,'&quot;')}" data-date="${d.date}" onchange="saveHito(this)" onblur="saveHito(this)"></td>`;
    tbody.appendChild(tr);
  });
}

function saveHito(input){
  const date=input.dataset.date, val=input.value.trim();
  if(val) hitoData[date]=val; else delete hitoData[date];
  // Refresh hito count in summary without full re-render
  const store=diarioStoreSel;
  const days=Object.keys(dailyData).filter(d=>dailyData[d][store]);
  document.getElementById('dSum-hitos').textContent=days.filter(d=>hitoData[d]).length;
}

