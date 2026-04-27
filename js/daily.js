// ══════════════════════════════════════════════════════
//  DÍA COMPLETO
// ══════════════════════════════════════════════════════
let dailySelectedDate='', dailySortCol='ranking', dailySortDir=1;

function rebuildDailyDate(){
  const dates=Object.keys(dailyData).sort();
  const hidden=document.getElementById('dailyDate');if(!hidden)return;
  if(!dates.length){
    if(hidden){hidden.value='';hidden.min='';hidden.max='';}
    setDP('dailyDate','',false);
    dailySelectedDate='';
    return;
  }
  const first=dates[0],last=dates[dates.length-1];
  if(!dailySelectedDate||!dates.includes(dailySelectedDate))dailySelectedDate=last;
  hidden.min=first;hidden.max=last;
  setDP('dailyDate',dailySelectedDate,false);
}

function onDailyDateChange(){
  const v=document.getElementById('dailyDate').value;
  if(v)dailySelectedDate=v;
  renderDaily();schedulePersist();
}

function dailyStep(delta){
  const dates=Object.keys(dailyData).sort();
  if(!dates.length)return;
  const idx=dates.indexOf(dailySelectedDate);
  const next=idx+delta;
  if(next<0||next>=dates.length)return;
  dailySelectedDate=dates[next];
  setDP('dailyDate',dailySelectedDate,false);
  renderDaily();schedulePersist();
}

function sortDaily(col){
  if(dailySortCol===col)dailySortDir*=-1;
  else{dailySortCol=col;dailySortDir= col==='ranking'? 1 : -1;}
  renderDaily();schedulePersist();
}

function applyDailySortHeaders(){
  const cols=['ranking','vc','sales','buys','cashBuys','exchBuys','refunds','members'];
  cols.forEach(c=>{
    const th=document.querySelector(`[data-dlycol="${c}"]`);
    const arr=document.getElementById(`dlyArr-${c}`);
    if(!th||!arr)return;
    if(c===dailySortCol){th.classList.add('sort-active');arr.style.opacity='1';arr.textContent=dailySortDir===-1?'▼':'▲';}
    else{th.classList.remove('sort-active');arr.style.opacity='0';arr.textContent='';}
  });
}

function renderDaily(){
  rebuildDailyDate();
  applyDailySortHeaders();
  const tbody=document.getElementById('dailyBody');
  const summary=document.getElementById('dailySummary');
  const dates=Object.keys(dailyData);
  if(!dates.length||!dailySelectedDate||!dailyData[dailySelectedDate]){
    if(summary)summary.style.display='none';
    if(tbody)tbody.innerHTML='<tr><td colspan="10"><span class="empty-state">Carga el registro diario en «Actualización 4WKS» para ver la tabla completa de un día</span></td></tr>';
    document.getElementById('dlyMeta').textContent='';
    return;
  }
  const stores=dailyData[dailySelectedDate];
  const rows=Object.entries(stores).map(([store,s])=>({store,...s}));
  if(!rows.length){
    if(summary)summary.style.display='none';
    if(tbody)tbody.innerHTML='<tr><td colspan="10"><span class="empty-state">Sin datos para este día</span></td></tr>';
    return;
  }

  // Nav: prev/next disabled state
  const allDates=dates.sort();
  const idx=allDates.indexOf(dailySelectedDate);
  document.getElementById('dlyPrev').disabled=idx<=0;
  document.getElementById('dlyNext').disabled=idx>=allDates.length-1;
  document.getElementById('dlyMeta').textContent=`${rows.length} tiendas`;

  // KPIs
  const totalVC=rows.reduce((s,r)=>s+(r.vc||0),0);
  const avgVC=Math.round(totalVC/rows.length);
  const top=rows.reduce((a,b)=>b.vc>a.vc?b:a,rows[0]);
  const bot=rows.reduce((a,b)=>b.vc<a.vc?b:a,rows[0]);
  const dayName=rows.find(r=>r.day)?.day||'';
  summary.style.display='flex';
  document.getElementById('dlySum-dow').textContent=`${DAY_ES[dayName]||dayName||'—'} · ${fmtDate(dailySelectedDate)}`;
  document.getElementById('dlySum-stores').textContent=rows.length;
  document.getElementById('dlySum-total').textContent=fmt(totalVC);
  document.getElementById('dlySum-avg').textContent=fmt(avgVC);
  document.getElementById('dlySum-top').textContent=`${top.store} · ${fmt(top.vc)}`;
  document.getElementById('dlySum-bot').textContent=`${bot.store} · ${fmt(bot.vc)}`;

  // Sort
  const col=dailySortCol, dir=dailySortDir;
  const sorted=[...rows].sort((a,b)=>{
    if(col==='ranking'){
      const ra=a.ranking||9999, rb=b.ranking||9999;
      return(ra-rb)*dir;
    }
    return((a[col]||0)-(b[col]||0))*dir;
  });

  // Distancia (a Madrid Islazul si existe; si no, a la primera)
  const targetName=sorted.some(r=>r.store==='Madrid Islazul')?'Madrid Islazul':sorted[0].store;
  const targetRow=sorted.find(r=>r.store===targetName);
  const targetVC=targetRow?targetRow.vc||0:0;
  const maxDist=Math.max(...sorted.map(r=>Math.abs((r.vc||0)-targetVC)))||1;
  document.getElementById('dlyDistHeader').textContent=`Dist. ${targetName.split(' ').slice(-1)[0]}`;

  tbody.innerHTML='';
  sorted.forEach((r,i)=>{
    const isTgt=r.store===targetName;
    const rankCell=`<span class="rank-num">${i+1}</span>`;
    let dist;
    if(isTgt){dist=`<span class="dist-val self">— tú —</span>`;}
    else{
      const diff=targetVC-(r.vc||0),pct=Math.min(100,Math.round(Math.abs(diff)/maxDist*100));
      const cls=diff<0?'above':'below',sign=diff<0?`−${fmt(Math.abs(diff))}`:`+${fmt(diff)}`;
      dist=`<div class="dist-wrap"><div class="dist-bar-track"><div class="dist-bar-fill ${cls}" style="width:${pct}%"></div></div><span class="dist-val ${cls}">${sign}</span></div>`;
    }
    const tr=document.createElement('tr');if(isTgt)tr.className='target';
    tr.innerHTML=`<td>${rankCell}</td>`+
      `<td><span class="store-name${isTgt?' target-name':''}">${r.store}</span></td>`+
      `<td class="r"><span class="stat-val vc">${fmt(r.vc||0)}</span></td>`+
      `<td class="r"><span class="stat-val">${fmt(r.sales||0)}</span></td>`+
      `<td class="r"><span class="stat-val">${fmt(r.buys||0)}</span></td>`+
      `<td class="r"><span class="stat-val">${r.cashBuys?fmt(r.cashBuys):'—'}</span></td>`+
      `<td class="r"><span class="stat-val">${r.exchBuys?fmt(r.exchBuys):'—'}</span></td>`+
      `<td class="r"><span class="stat-val">${fmt(r.refunds||0)}</span></td>`+
      `<td class="r"><span class="stat-val">${fmtN(r.members||0)}</span></td>`+
      `<td style="min-width:150px">${dist}</td>`;
    tbody.appendChild(tr);
  });
}
