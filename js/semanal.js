// ══════════════════════════════════════════════════════
//  RESUMEN SEMANAL (tienda · semana a semana)
// ══════════════════════════════════════════════════════
function rebuildSemanalStore(){
  const hidden=document.getElementById('semanalStore');if(!hidden)return;
  const prev=semanalStoreSel||hidden.value;
  const stores=new Set();
  for(const dateStores of Object.values(dailyData))for(const s of Object.keys(dateStores))stores.add(s);
  const sorted=[...stores].sort();
  const options=sorted.map(s=>({value:s,label:s}));
  ssSetOptions('semanalStore',options);
  const newVal=sorted.includes(prev)?prev:(sorted.includes('Madrid Islazul')?'Madrid Islazul':sorted[0]||'');
  ssSetValue('semanalStore',newVal,false);
  semanalStoreSel=newVal;
}

function sortSemanal(col){
  if(semanalSortCol===col)semanalSortDir*=-1;
  else{semanalSortCol=col;semanalSortDir=-1;}
  renderSemanal();
}

function setSemanalColorBy(btn){
  semanalColorBy=btn.dataset.col;
  document.querySelectorAll('#semanalColorByPills .diario-filter-pill').forEach(b=>b.classList.toggle('active',b===btn));
  renderSemanal();
}

const SEMANAL_COLOR_OPTS={
  ws:      {value:r=>r.wsIdx,    inverted:false},
  pos:     {value:r=>r.pos,      inverted:true},  // mejor ranking (menor) = más intenso
  vc:      {value:r=>r.vc,       inverted:false},
  rolling4:{value:r=>r.rolling4, inverted:false},
};
function computeSemanalTints(rows){
  const opt=SEMANAL_COLOR_OPTS[semanalColorBy];
  if(!opt){rows.forEach(r=>r._tint=0);return;}
  const vals=rows.map(opt.value).filter(v=>v!=null&&!isNaN(v));
  if(!vals.length){rows.forEach(r=>r._tint=0);return;}
  const min=Math.min(...vals), max=Math.max(...vals), rng=max-min;
  rows.forEach(r=>{
    const v=opt.value(r);
    if(v==null||isNaN(v)){r._tint=0;return;}
    let n=rng>0?(v-min)/rng:0;
    if(opt.inverted)n=1-n;
    r._tint=0.03+n*0.19;
  });
}

function collectSemanalRows(){
  const storeName=semanalStoreSel;
  if(!storeName)return{rows:[],weeks:[]};
  const weeks=getWeeks();
  if(!weeks.length)return{rows:[],weeks:[]};

  // Pre-agregar totales por semana de todas las tiendas (para calcular ranking semanal)
  const byWeek={}; // ws → {days:Set, agg:{store:{...}}}
  for(const [d,stores] of Object.entries(dailyData)){
    const ws=weekStart(d);
    if(!byWeek[ws])byWeek[ws]={days:new Set(),agg:{}};
    byWeek[ws].days.add(d);
    for(const [store,s] of Object.entries(stores)){
      if(!byWeek[ws].agg[store])byWeek[ws].agg[store]={vc:0,sales:0,buys:0,cashBuys:0,exchBuys:0,refunds:0,members:0};
      const a=byWeek[ws].agg[store];
      a.vc+=s.vc||0;a.sales+=s.sales||0;a.buys+=s.buys||0;a.cashBuys+=s.cashBuys||0;a.exchBuys+=s.exchBuys||0;a.refunds+=s.refunds||0;a.members+=s.members||0;
    }
  }

  const rows=[];
  for(const ws of weeks){
    const w=byWeek[ws];if(!w)continue;
    const storeAgg=w.agg[storeName];if(!storeAgg)continue;
    const ordered=Object.entries(w.agg).sort((a,b)=>b[1].vc-a[1].vc);
    const pos=ordered.findIndex(([st])=>st===storeName)+1;
    rows.push({ws, wsIdx:weeks.indexOf(ws), wk:cexWeekNum(ws), days:w.days.size, pos, ...storeAgg});
  }

  // Rodante 4WKS cronológico: V+C de esta semana + hasta 3 semanas anteriores (ventana basada en weeks globales)
  const vcByWs=new Map(rows.map(r=>[r.ws,r.vc]));
  rows.forEach(r=>{
    const wsIdx=weeks.indexOf(r.ws);
    const window=weeks.slice(Math.max(0,wsIdx-3),wsIdx+1);
    r.rolling4=window.reduce((s,w)=>s+(vcByWs.get(w)||0),0);
  });

  return{rows,weeks};
}

function renderSemanal(){
  rebuildSemanalStore();
  applySemanalSortHeaders();
  document.querySelectorAll('#semanalColorByPills .diario-filter-pill').forEach(b=>b.classList.toggle('active',b.dataset.col===semanalColorBy));

  const{rows}=collectSemanalRows();
  computeSemanalTints(rows);
  const summary=document.getElementById('semanalSummary');
  const tbody=document.getElementById('semanalBody');

  if(!rows.length){
    summary.style.display='none';
    tbody.innerHTML='<tr><td colspan="12"><span class="empty-state">'+(Object.keys(dailyData).length?'Sin datos para esta tienda':'Carga el registro diario en «Actualización 4WKS» para ver el resumen semanal')+'</span></td></tr>';
    return;
  }

  // Summary
  summary.style.display='flex';
  const totalVC=rows.reduce((s,r)=>s+r.vc,0);
  const avgVC=totalVC/rows.length;
  const topWeek=rows.reduce((best,r)=>r.vc>best.vc?r:best, rows[0]);
  const validPos=rows.filter(r=>r.pos>0).map(r=>r.pos);
  const bestPos=validPos.length?Math.min(...validPos):null;
  const lastRow=rows[rows.length-1];
  document.getElementById('semSum-weeks').textContent=rows.length;
  document.getElementById('semSum-vc').textContent=fmt(totalVC);
  document.getElementById('semSum-best').textContent=bestPos!=null?`#${bestPos}`:'—';
  document.getElementById('semSum-avg').textContent=fmt(Math.round(avgVC));
  document.getElementById('semSum-top').textContent=topWeek?`${weekTag(topWeek.ws)} · ${fmt(topWeek.vc)}`:'—';
  document.getElementById('semSum-roll').textContent=lastRow?fmt(lastRow.rolling4):'—';

  // Sort
  const col=semanalSortCol, dir=semanalSortDir;
  const sorted=[...rows].sort((a,b)=>{
    if(col==='ws'){return a.ws<b.ws?-dir:a.ws>b.ws?dir:0;}
    if(col==='pos'){const aa=a.pos||9999, bb=b.pos||9999;return(aa-bb)*dir;}
    const va=a[col]??0, vb=b[col]??0;
    return(va-vb)*dir;
  });

  tbody.innerHTML='';
  sorted.forEach(r=>{
    let rankClass='other';
    if(r.pos===1)rankClass='top1';
    else if(r.pos<=3)rankClass='top3';
    else if(r.pos<=10)rankClass='top10';
    const rankCell=r.pos>0?`<span class="rank-badge ${rankClass}">${r.pos}</span>`:'—';
    const rangeTxt=`${fmtDate(r.ws)} → ${fmtDate(weekEnd(r.ws))}`;
    const incomplete=r.days<7;
    const daysCls=incomplete?' sem-days-inc':'';
    const tr=document.createElement('tr');
    if(r._tint>0)tr.style.background=`rgba(var(--accent-rgb),${r._tint.toFixed(3)})`;
    tr.innerHTML=`<td><span class="wk-label">${weekTag(r.ws)}</span></td>
      <td><span class="stat-val">${rangeTxt}</span></td>
      <td><span class="stat-val${daysCls}">${r.days}/7</span></td>
      <td class="r">${rankCell}</td>
      <td class="r"><span class="stat-val">${fmt(r.sales)}</span></td>
      <td class="r"><span class="stat-val">${fmt(r.buys)}</span></td>
      <td class="r"><span class="stat-val">${fmt(r.cashBuys)}</span></td>
      <td class="r"><span class="stat-val">${fmt(r.exchBuys)}</span></td>
      <td class="r"><span class="stat-val">${fmt(r.refunds)}</span></td>
      <td class="r"><span class="stat-val">${fmtN(r.members)}</span></td>
      <td class="r"><span class="stat-val vc">${fmt(r.vc)}</span></td>
      <td class="r"><span class="stat-val">${fmt(r.rolling4)}</span></td>`;
    tbody.appendChild(tr);
  });
}

function applySemanalSortHeaders(){
  const cols=['ws','pos','sales','buys','cashBuys','exchBuys','refunds','members','vc','rolling4'];
  cols.forEach(c=>{
    const th=document.querySelector(`#panel-semanal [data-scol="${c}"]`);
    const arr=document.getElementById(`semArr-${c}`);
    if(!th||!arr)return;
    if(c===semanalSortCol){th.classList.add('sort-active');arr.style.opacity='1';arr.textContent=semanalSortDir===-1?'▼':'▲';}
    else{th.classList.remove('sort-active');arr.style.opacity='0';arr.textContent='';}
  });
}
