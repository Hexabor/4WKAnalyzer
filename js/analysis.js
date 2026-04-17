// ══════════════════════════════════════════════════════
//  ANÁLISIS POR RANGO
// ══════════════════════════════════════════════════════
const ANALYSIS_METRICS={
  vc:{label:'V+C',fmt:fmt,agg:'sum'},
  sales:{label:'Net Sales',fmt:fmt,agg:'sum'},
  buys:{label:'Buys',fmt:fmt,agg:'sum'},
  cashBuys:{label:'Cash Buys',fmt:fmt,agg:'sum'},
  exchBuys:{label:'Exch. Buys',fmt:fmt,agg:'sum'},
  refunds:{label:'Refunds',fmt:fmt,agg:'sum'},
  members:{label:'Members',fmt:n=>fmtN(Math.round(n)),agg:'sum'},
  ranking:{label:'Ranking',fmt:n=>`#${(Math.round(n*10)/10).toString().replace('.',',')}`,agg:'avg',inverted:true},
};

let analysisStore='__all__', analysisMetrics=['vc'], analysisDayFilter='';
let analysisStart='', analysisEnd='';
let analysisPresets=[];

function rebuildAnalysisStore(){
  const hidden=document.getElementById('aStore');if(!hidden)return;
  const prev=analysisStore||hidden.value;
  const stores=new Set();
  for(const dateStores of Object.values(dailyData))for(const s of Object.keys(dateStores))stores.add(s);
  const sorted=[...stores].sort();
  const options=[{value:'__all__',label:sorted.length?'Todas las tiendas':'— sin datos —'}];
  sorted.forEach(s=>options.push({value:s,label:s}));
  ssSetOptions('aStore',options);
  const newVal=(prev==='__all__'||sorted.includes(prev))?prev:'__all__';
  ssSetValue('aStore',newVal,false);
  analysisStore=newVal;
}

function initAnalysisRange(){
  const dates=Object.keys(dailyData).sort();
  const s=document.getElementById('aStart'),e=document.getElementById('aEnd');
  if(!dates.length){if(s){s.value='';s.min='';s.max='';}if(e){e.value='';e.min='';e.max='';}return;}
  const first=dates[0],last=dates[dates.length-1];
  if(!analysisStart||analysisStart<first||analysisStart>last)analysisStart=dates[Math.max(0,dates.length-30)];
  if(!analysisEnd||analysisEnd>last||analysisEnd<first)analysisEnd=last;
  if(analysisStart>analysisEnd)[analysisStart,analysisEnd]=[analysisEnd,analysisStart];
  if(s){s.min=first;s.max=last;}
  if(e){e.min=first;e.max=last;}
  setDP('aStart',analysisStart,false);
  setDP('aEnd',analysisEnd,false);
}

function onAnalysisStoreChange(){analysisStore=document.getElementById('aStore').value;renderAnalysis();schedulePersist();}
function toggleAnalysisMetric(btn){
  const m=btn.dataset.metric;
  const idx=analysisMetrics.indexOf(m);
  if(idx>=0){
    if(analysisMetrics.length===1){toast('⚠ Al menos una métrica seleccionada','err');return;}
    analysisMetrics.splice(idx,1);
  }else analysisMetrics.push(m);
  renderAnalysis();schedulePersist();
}
function onAnalysisRangeChange(){
  analysisStart=document.getElementById('aStart').value;
  analysisEnd=document.getElementById('aEnd').value;
  if(analysisStart&&analysisEnd&&analysisStart>analysisEnd){
    [analysisStart,analysisEnd]=[analysisEnd,analysisStart];
    setDP('aStart',analysisStart,false);
    setDP('aEnd',analysisEnd,false);
  }
  renderAnalysis();schedulePersist();
}
function filterAnalysisDay(btn){
  analysisDayFilter=btn.dataset.day;
  document.querySelectorAll('#aDayFilter .diario-filter-pill').forEach(b=>b.classList.toggle('active',b===btn));
  renderAnalysis();schedulePersist();
}

function collectAnalysisSeries(metric){
  if(!analysisStart||!analysisEnd)return[];
  const meta=ANALYSIS_METRICS[metric];
  const out=[];
  const dates=Object.keys(dailyData).filter(d=>d>=analysisStart&&d<=analysisEnd).sort();
  for(const date of dates){
    const stores=dailyData[date];
    let dayName='',value=0;
    if(analysisStore==='__all__'){
      const entries=Object.values(stores);if(!entries.length)continue;
      dayName=entries.find(x=>x.day)?.day||'';
      if(meta.agg==='sum'){value=entries.reduce((s,x)=>s+(x[metric]||0),0);}
      else{const ranked=entries.filter(x=>x.ranking>0);if(!ranked.length)continue;value=ranked.reduce((s,x)=>s+x.ranking,0)/ranked.length;}
    }else{
      const s=stores[analysisStore];if(!s)continue;
      dayName=s.day||'';
      value=s[metric]||0;
      if(metric==='ranking'&&value===0)continue;
    }
    if(analysisDayFilter&&dayName!==analysisDayFilter)continue;
    out.push({date,day:dayName,value});
  }
  return out;
}

function renderAnalysis(){
  rebuildAnalysisStore();
  initAnalysisRange();
  document.querySelectorAll('#aMetricPills .diario-filter-pill').forEach(p=>p.classList.toggle('active',analysisMetrics.includes(p.dataset.metric)));
  document.querySelectorAll('#aDayFilter .diario-filter-pill').forEach(b=>b.classList.toggle('active',b.dataset.day===analysisDayFilter));
  renderAnalysisPresets();

  const summary=document.getElementById('aSummary');
  const wrap=document.getElementById('aChartsWrap');

  if(!Object.keys(dailyData).length){
    summary.style.display='none';
    wrap.innerHTML='<div class="chart-card"><div class="chart-empty">Carga el registro diario en «Actualización 4WKS» para empezar</div></div>';
    return;
  }
  if(!analysisMetrics.length){
    summary.style.display='none';
    wrap.innerHTML='<div class="chart-card"><div class="chart-empty">Selecciona al menos una métrica</div></div>';
    return;
  }

  // Primary metric (first) drives the summary
  const primary=analysisMetrics[0];
  const primaryMeta=ANALYSIS_METRICS[primary];
  const primarySeries=collectAnalysisSeries(primary);

  if(!primarySeries.length){
    summary.style.display='none';
    wrap.innerHTML='<div class="chart-card"><div class="chart-empty">Sin datos en el rango seleccionado</div></div>';
    return;
  }

  // Summary (always primary metric)
  summary.style.display='flex';
  const pv=primarySeries.map(d=>d.value);
  const pTotal=pv.reduce((s,v)=>s+v,0);
  const pAvg=pTotal/pv.length;
  const pMax=Math.max(...pv), pMin=Math.min(...pv);
  const pBest=primarySeries.find(d=>d.value===(primaryMeta.inverted?pMin:pMax));
  const pWorst=primarySeries.find(d=>d.value===(primaryMeta.inverted?pMax:pMin));
  const pStd=Math.sqrt(pv.reduce((s,v)=>s+(v-pAvg)**2,0)/pv.length);

  document.getElementById('aSum-days').textContent=primarySeries.length;
  document.getElementById('aSum-total').textContent=primaryMeta.agg==='sum'?primaryMeta.fmt(pTotal):'—';
  document.getElementById('aSum-avg').textContent=primaryMeta.fmt(pAvg);
  document.getElementById('aSum-best').textContent=pBest?`${fmtDate(pBest.date)} · ${primaryMeta.fmt(pBest.value)}`:'—';
  document.getElementById('aSum-worst').textContent=pWorst?`${fmtDate(pWorst.date)} · ${primaryMeta.fmt(pWorst.value)}`:'—';
  document.getElementById('aSum-std').textContent=primaryMeta.fmt(pStd);

  // Render one chart per selected metric (primary first, apilados)
  const storeLabel=analysisStore==='__all__'?'Todas las tiendas':analysisStore;
  wrap.innerHTML='';
  analysisMetrics.forEach((m,idx)=>{
    const meta=ANALYSIS_METRICS[m];
    const series=m===primary?primarySeries:collectAnalysisSeries(m);
    const card=document.createElement('div');
    card.className='chart-card';
    if(!series.length){
      card.innerHTML=`<div class="chart-title">${meta.label} · ${storeLabel}</div><div class="chart-empty">Sin datos para esta métrica en el rango</div>`;
      wrap.appendChild(card);return;
    }
    const avg=series.reduce((s,d)=>s+d.value,0)/series.length;
    const title=`${meta.label} · ${storeLabel} · ${fmtDate(analysisStart)} → ${fmtDate(analysisEnd)} · ${series.length} días`;
    card.innerHTML=`<div class="chart-title">${title}</div><div class="chart-wrap"><svg class="chart-svg"></svg><div class="chart-tooltip"></div></div>`;
    wrap.appendChild(card);
    const svg=card.querySelector('svg');
    const tt=card.querySelector('.chart-tooltip');
    drawAnalysisChart(svg, tt, series, meta, avg, idx===analysisMetrics.length-1);
  });
}

function drawAnalysisChart(svg, tooltip, series, meta, avg, showMonthNames){
  const rect=svg.getBoundingClientRect();
  const W=Math.max(480, Math.round(rect.width||svg.clientWidth||800));
  const H=showMonthNames?360:280;
  const pad={l:82,r:22,t:20,b:showMonthNames?74:40};
  svg.style.height=H+'px';
  const plotW=W-pad.l-pad.r, plotH=H-pad.t-pad.b;
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
  svg.setAttribute('preserveAspectRatio','none');

  const n=series.length;
  const values=series.map(d=>d.value);
  let yMin=0, yMax=Math.max(...values);
  if(meta.inverted){yMin=Math.max(1,Math.floor(Math.min(...values))-1);yMax=Math.ceil(Math.max(...values))+1;if(yMax===yMin)yMax=yMin+1;}
  else{yMax=yMax*1.08||1;}
  if(yMax===yMin)yMax=yMin+1;

  // For inverted (ranking): #1 at top, worse rank at bottom. Bar grows from top to the value position.
  // For normal: 0 at bottom, value at top.
  const valueToY = v => {
    if(meta.inverted){return pad.t + ((v - yMin)/(yMax - yMin))*plotH;}
    return pad.t + plotH - ((v - yMin)/(yMax - yMin))*plotH;
  };

  const barGap=Math.max(1,Math.min(3, plotW/(n*8)));
  const barW=Math.max(3,(plotW - barGap*(n+1))/n);
  const bx = i => pad.l + barGap + i*(barW+barGap);

  const parts=[];
  // Grid + Y labels
  const ticks=5;
  for(let i=0;i<=ticks;i++){
    const v=yMin+(yMax-yMin)*i/ticks;
    const y=valueToY(v);
    parts.push(`<line class="grid-line" x1="${pad.l}" y1="${y}" x2="${W-pad.r}" y2="${y}"/>`);
    const lbl=meta.inverted?`#${Math.round(v)}`:meta.fmt(v);
    parts.push(`<text class="axis-label" x="${pad.l-8}" y="${y+3}" text-anchor="end">${lbl}</text>`);
  }
  // Baseline
  const baseY=meta.inverted?pad.t:pad.t+plotH;
  parts.push(`<line class="axis-line" x1="${pad.l}" y1="${pad.t+plotH}" x2="${W-pad.r}" y2="${pad.t+plotH}"/>`);

  // Bars
  series.forEach((d,i)=>{
    const vy=valueToY(d.value);
    const x=bx(i);
    let y,h;
    if(meta.inverted){y=pad.t; h=Math.max(0.8, vy-pad.t);} // bar grows down from top-baseline (ranking)
    else{y=vy; h=Math.max(0.8, pad.t+plotH-vy);}
    const dayLow=(d.day||'').toLowerCase();
    const cls=dayLow==='saturday'?'sat':dayLow==='sunday'?'sun':'';
    parts.push(`<rect class="bar ${cls}" x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${barW.toFixed(2)}" height="${h.toFixed(2)}" data-idx="${i}" rx="2"/>`);
  });

  // Mean line
  const meanY=valueToY(avg);
  parts.push(`<line class="mean-line" x1="${pad.l}" y1="${meanY}" x2="${W-pad.r}" y2="${meanY}"/>`);
  parts.push(`<text class="mean-label" x="${W-pad.r-4}" y="${meanY-4}" text-anchor="end">Media · ${meta.fmt(avg)}</text>`);

  // Valor sobre cada barra (miles + 1 decimal + K). Para ranking no aplica.
  if(!meta.inverted){
    series.forEach((d,i)=>{
      const cx=(bx(i)+barW/2).toFixed(2);
      const ly=(valueToY(d.value)-5).toFixed(2);
      parts.push(`<text class="bar-value" x="${cx}" y="${ly}" text-anchor="middle">${(d.value/1000).toFixed(1)}K</text>`);
    });
  }

  // Month blocks (for dividers and month labels)
  const MONTH_ES=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const DOW_LETTER={Monday:'L',Tuesday:'M',Wednesday:'X',Thursday:'J',Friday:'V',Saturday:'S',Sunday:'D'};
  const monthBlocks=[];let curBlk=null;
  const monthDivIdx=new Set();
  series.forEach((d,i)=>{
    const [y,m]=d.date.split('-');const key=y+'-'+m;
    if(!curBlk||curBlk.key!==key){
      if(curBlk){monthBlocks.push(curBlk);monthDivIdx.add(i);}
      curBlk={key,start:i,end:i,month:+m,year:+y};
    }else curBlk.end=i;
  });
  if(curBlk)monthBlocks.push(curBlk);

  // Week dividers (antes de cada lunes, excepto si coincide con separador de mes)
  series.forEach((d,i)=>{
    if(i===0||d.day!=='Monday'||monthDivIdx.has(i))return;
    const xDiv=(bx(i-1)+barW+bx(i))/2;
    parts.push(`<line class="week-divider" x1="${xDiv.toFixed(2)}" y1="${pad.t}" x2="${xDiv.toFixed(2)}" y2="${(pad.t+plotH).toFixed(2)}"/>`);
  });

  // Month dividers (encima de week dividers, más prominentes). Se extienden bajo la fila de día/letra siempre; hasta bajo el mes solo en la gráfica con nombres de mes.
  const monthDivBottom = showMonthNames ? pad.t+plotH+60 : pad.t+plotH+30;
  for(let b=1;b<monthBlocks.length;b++){
    const prev=monthBlocks[b-1], cur=monthBlocks[b];
    const xDiv=(bx(prev.end)+barW+bx(cur.start))/2;
    parts.push(`<line class="month-divider" x1="${xDiv.toFixed(2)}" y1="${pad.t}" x2="${xDiv.toFixed(2)}" y2="${monthDivBottom.toFixed(2)}"/>`);
  }

  // Per-bar labels (día + letra de día de semana) — siempre, en todas las gráficas
  series.forEach((d,i)=>{
    const cx=(bx(i)+barW/2).toFixed(2);
    const dayNum=parseInt(d.date.split('-')[2],10);
    const letter=DOW_LETTER[d.day]||'';
    const isWk=(d.day==='Saturday'||d.day==='Sunday');
    parts.push(`<text class="bar-label-day" x="${cx}" y="${(pad.t+plotH+13).toFixed(2)}" text-anchor="middle">${dayNum}</text>`);
    parts.push(`<text class="bar-label-dow${isWk?' weekend':''}" x="${cx}" y="${(pad.t+plotH+25).toFixed(2)}" text-anchor="middle">${letter}</text>`);
  });

  if(showMonthNames){
    // Month names centrados bajo cada bloque (solo en la gráfica inferior)
    monthBlocks.forEach(b=>{
      const cx=((bx(b.start)+bx(b.end)+barW)/2).toFixed(2);
      parts.push(`<text class="month-label" x="${cx}" y="${(pad.t+plotH+52).toFixed(2)}" text-anchor="middle">${MONTH_ES[b.month-1]} ${b.year}</text>`);
    });
  }

  svg.innerHTML=parts.join('');

  // Tooltip bindings
  const wrap=svg.parentElement;
  svg.querySelectorAll('rect.bar').forEach(r=>{
    r.addEventListener('mousemove', e=>{
      const i=+r.dataset.idx, d=series[i];
      tooltip.innerHTML=`<div class="tt-date">${fmtDate(d.date)} · ${DAY_ES[d.day]||d.day||'—'}</div>${meta.label}: <strong>${meta.fmt(d.value)}</strong>`;
      const wr=wrap.getBoundingClientRect();
      let x=e.clientX-wr.left+12, y=e.clientY-wr.top-14;
      if(x+220>wr.width)x=e.clientX-wr.left-228;
      if(y<0)y=e.clientY-wr.top+18;
      tooltip.style.left=x+'px';tooltip.style.top=y+'px';
      tooltip.classList.add('show');
    });
    r.addEventListener('mouseleave', ()=>tooltip.classList.remove('show'));
  });
}

function renderAnalysisPresets(){
  const list=document.getElementById('aPresetsList');if(!list)return;
  if(!analysisPresets.length){list.innerHTML='<span class="preset-pill empty">Sin presets guardados · usa «Guardar rango actual»</span>';return;}
  list.innerHTML='';
  analysisPresets.forEach((p,idx)=>{
    const pill=document.createElement('span');pill.className='preset-pill';
    const name=document.createElement('span');name.className='pp-name';
    name.textContent=`${p.name} · ${fmtDate(p.start)}→${fmtDate(p.end)}`;
    name.title='Aplicar preset';
    name.onclick=()=>applyAnalysisPreset(idx);
    const del=document.createElement('span');del.className='pp-del';del.textContent='×';del.title='Eliminar preset';
    del.onclick=e=>{e.stopPropagation();deleteAnalysisPreset(idx);};
    pill.appendChild(name);pill.appendChild(del);
    list.appendChild(pill);
  });
}

function applyAnalysisPreset(idx){
  const p=analysisPresets[idx];if(!p)return;
  analysisStart=p.start;analysisEnd=p.end;
  setDP('aStart',p.start,false);
  setDP('aEnd',p.end,false);
  renderAnalysis();schedulePersist();
  toast(`✓ Preset «${p.name}» aplicado`,'ok');
}

function saveAnalysisPreset(){
  if(!analysisStart||!analysisEnd){toast('⚠ Elige un rango primero','err');return;}
  const name=prompt(`Nombre del preset para ${fmtDate(analysisStart)} → ${fmtDate(analysisEnd)}:`,'');
  if(name==null)return;
  const trimmed=name.trim();if(!trimmed){toast('⚠ Nombre vacío','err');return;}
  const existingIdx=analysisPresets.findIndex(p=>p.name.toLowerCase()===trimmed.toLowerCase());
  const entry={name:trimmed,start:analysisStart,end:analysisEnd};
  if(existingIdx>=0){if(!confirm(`Ya existe «${trimmed}». ¿Sobrescribir?`))return;analysisPresets[existingIdx]=entry;}
  else analysisPresets.push(entry);
  renderAnalysisPresets();schedulePersist();
  toast(`✓ Preset «${trimmed}» guardado`,'ok');
}

function deleteAnalysisPreset(idx){
  const p=analysisPresets[idx];if(!p)return;
  if(!confirm(`Eliminar preset «${p.name}»?`))return;
  analysisPresets.splice(idx,1);renderAnalysisPresets();schedulePersist();
}

let _analysisResizeTimer;
window.addEventListener('resize',()=>{
  if(!document.getElementById('panel-analysis')?.classList.contains('active'))return;
  clearTimeout(_analysisResizeTimer);
  _analysisResizeTimer=setTimeout(renderAnalysis,150);
});

