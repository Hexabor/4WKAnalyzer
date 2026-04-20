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

let analysisStore='__all__', analysisStore2='', analysisMetrics=['vc'], analysisDayFilter='', analysisGranularity='day';
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
  // Segundo selector: sin "__all__", con opción vacía
  const options2=[{value:'',label:'— sin comparación —'}];
  sorted.forEach(s=>{if(s!==analysisStore)options2.push({value:s,label:s});});
  ssSetOptions('aStore2',options2);
  const newVal2=(analysisStore2===''||(sorted.includes(analysisStore2)&&analysisStore2!==analysisStore))?analysisStore2:'';
  ssSetValue('aStore2',newVal2,false);
  analysisStore2=newVal2;
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

function onAnalysisStoreChange(){analysisStore=document.getElementById('aStore').value;if(analysisStore2===analysisStore)analysisStore2='';renderAnalysis();schedulePersist();}
function onAnalysisStore2Change(){analysisStore2=document.getElementById('aStore2').value;renderAnalysis();schedulePersist();}
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
function setAnalysisGranularity(btn){
  analysisGranularity=btn.dataset.gran;
  document.querySelectorAll('#aGranularity .diario-filter-pill').forEach(b=>b.classList.toggle('active',b===btn));
  renderAnalysis();schedulePersist();
}

function collectAnalysisSeries(metric, storeKey){
  if(!storeKey)return[];
  if(!analysisStart||!analysisEnd)return[];
  const meta=ANALYSIS_METRICS[metric];
  const out=[];
  const datesInRange=Object.keys(dailyData).filter(d=>d>=analysisStart&&d<=analysisEnd).sort();

  if(analysisGranularity==='week'){
    // Agrupar por semana (sábado). Suma para métricas sum; para ranking usar lógica específica.
    const byWs={};
    for(const d of datesInRange){
      const ws=weekStart(d);
      (byWs[ws]=byWs[ws]||[]).push(d);
    }
    const weeks=Object.keys(byWs).sort();
    for(const ws of weeks){
      const days=byWs[ws];
      let value;
      if(storeKey==='__all__'){
        if(meta.agg==='sum'){
          value=0;
          for(const d of days)for(const s of Object.values(dailyData[d]))value+=s[metric]||0;
        }else{
          // ranking: media de rankings medios diarios
          let sum=0,count=0;
          for(const d of days){
            const ranked=Object.values(dailyData[d]).filter(x=>x.ranking>0);
            if(!ranked.length)continue;
            sum+=ranked.reduce((s,x)=>s+x.ranking,0)/ranked.length;
            count++;
          }
          if(!count)continue;
          value=sum/count;
        }
      }else{
        if(metric==='ranking'){
          // Posición en ranking semanal por V+C
          const agg={};
          for(const d of days)for(const [st,s] of Object.entries(dailyData[d])){agg[st]=(agg[st]||0)+(s.vc||0);}
          const ordered=Object.entries(agg).sort((a,b)=>b[1]-a[1]);
          const pos=ordered.findIndex(([st])=>st===storeKey)+1;
          if(!pos)continue;
          value=pos;
        }else{
          value=0;let hasData=false;
          for(const d of days){const s=dailyData[d][storeKey];if(s){value+=s[metric]||0;hasData=true;}}
          if(!hasData)continue;
        }
      }
      out.push({date:ws,day:'Saturday',value,ws});
    }
    return out;
  }

  for(const date of datesInRange){
    const stores=dailyData[date];
    let dayName='',value=0;
    if(storeKey==='__all__'){
      const entries=Object.values(stores);if(!entries.length)continue;
      dayName=entries.find(x=>x.day)?.day||'';
      if(meta.agg==='sum'){value=entries.reduce((s,x)=>s+(x[metric]||0),0);}
      else{const ranked=entries.filter(x=>x.ranking>0);if(!ranked.length)continue;value=ranked.reduce((s,x)=>s+x.ranking,0)/ranked.length;}
    }else{
      const s=stores[storeKey];if(!s)continue;
      dayName=s.day||'';
      value=s[metric]||0;
      if(metric==='ranking'&&value===0)continue;
    }
    if(analysisDayFilter&&dayName!==analysisDayFilter)continue;
    out.push({date,day:dayName,value});
  }
  return out;
}
function kpiCompareHTML(valA, valB, meta){
  const a=valA!=null?meta.fmt(valA):'—';
  const b=valB!=null?meta.fmt(valB):'—';
  let delta='';
  if(valA!=null&&valB!=null&&valB!==0){
    const diff=((valA-valB)/Math.abs(valB))*100;
    const aBetter = meta.inverted ? (valA<valB) : (valA>valB);
    const aWorse  = meta.inverted ? (valA>valB) : (valA<valB);
    const color=aBetter?'green':aWorse?'red':'muted';
    const arrow=aBetter?'↑':aWorse?'↓':'=';
    const pctTxt=(diff>0?'+':'')+diff.toFixed(1)+'%';
    delta=`<span class="kpi-delta ${color}">${arrow} ${pctTxt}</span>`;
  }
  return `<span class="kpi-val-a">${a}</span><span class="kpi-vs">vs</span><span class="kpi-val-b">${b}</span>${delta}`;
}
function kpiBestWorstHTML(rowA, rowB, meta, weekMode){
  const lbl=r=>weekMode?`${weekTag(r.date)} · ${fmtDate(r.date)}`:fmtDate(r.date);
  const a=rowA?`${lbl(rowA)} · ${meta.fmt(rowA.value)}`:'—';
  const b=rowB?`${lbl(rowB)} · ${meta.fmt(rowB.value)}`:'—';
  return `<span class="kpi-compare-list"><span><span class="kpi-dot dot-a"></span>${a}</span><span><span class="kpi-dot dot-b"></span>${b}</span></span>`;
}

function renderAnalysis(){
  rebuildAnalysisStore();
  initAnalysisRange();
  document.querySelectorAll('#aMetricPills .diario-filter-pill').forEach(p=>p.classList.toggle('active',analysisMetrics.includes(p.dataset.metric)));
  document.querySelectorAll('#aDayFilter .diario-filter-pill').forEach(b=>b.classList.toggle('active',b.dataset.day===analysisDayFilter));
  document.querySelectorAll('#aGranularity .diario-filter-pill').forEach(b=>b.classList.toggle('active',b.dataset.gran===analysisGranularity));
  // Hide day-of-week filter when grouping by week
  const weekMode=analysisGranularity==='week';
  const dayFilterEls=['aDayFilterSep','aDayFilterLabel','aDayFilter'];
  dayFilterEls.forEach(id=>{const el=document.getElementById(id);if(el)el.style.display=weekMode?'none':'';});
  // KPI labels that change with granularity
  const k=id=>document.getElementById(id);
  if(k('aSumKey-days'))k('aSumKey-days').textContent=weekMode?'Semanas':'Días';
  if(k('aSumKey-avg'))k('aSumKey-avg').textContent=weekMode?'Media/sem.':'Media/día';
  if(k('aSumKey-best'))k('aSumKey-best').textContent=weekMode?'Mejor semana':'Mejor día';
  if(k('aSumKey-worst'))k('aSumKey-worst').textContent=weekMode?'Peor semana':'Peor día';
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

  const compare=!!analysisStore2;
  const primary=analysisMetrics[0];
  const primaryMeta=ANALYSIS_METRICS[primary];
  const primarySeries1=collectAnalysisSeries(primary,analysisStore);
  const primarySeries2=compare?collectAnalysisSeries(primary,analysisStore2):[];

  if(!primarySeries1.length&&!primarySeries2.length){
    summary.style.display='none';
    wrap.innerHTML='<div class="chart-card"><div class="chart-empty">Sin datos en el rango seleccionado</div></div>';
    return;
  }

  summary.style.display='flex';
  const stats=s=>{
    if(!s.length)return null;
    const v=s.map(d=>d.value);
    const total=v.reduce((a,b)=>a+b,0);
    const avg=total/v.length;
    const max=Math.max(...v), min=Math.min(...v);
    const best=s.find(d=>d.value===(primaryMeta.inverted?min:max));
    const worst=s.find(d=>d.value===(primaryMeta.inverted?max:min));
    const std=Math.sqrt(v.reduce((a,x)=>a+(x-avg)**2,0)/v.length);
    return{count:s.length,total,avg,best,worst,std};
  };
  const s1=stats(primarySeries1), s2=stats(primarySeries2);
  const set=(id,html)=>{document.getElementById(id).innerHTML=html;};
  const bestLabel=r=>weekMode?`${weekTag(r.date)} · ${fmtDate(r.date)}`:fmtDate(r.date);
  if(!compare){
    set('aSum-days', s1?s1.count:'—');
    set('aSum-total', s1&&primaryMeta.agg==='sum'?primaryMeta.fmt(s1.total):'—');
    set('aSum-avg', s1?primaryMeta.fmt(s1.avg):'—');
    set('aSum-best', s1&&s1.best?`${bestLabel(s1.best)} · ${primaryMeta.fmt(s1.best.value)}`:'—');
    set('aSum-worst', s1&&s1.worst?`${bestLabel(s1.worst)} · ${primaryMeta.fmt(s1.worst.value)}`:'—');
    set('aSum-std', s1?primaryMeta.fmt(s1.std):'—');
  }else{
    const d1=s1?s1.count:null, d2=s2?s2.count:null;
    set('aSum-days', d1!=null&&d2!=null&&d1===d2?d1:`<span class="kpi-val-a">${d1??'—'}</span><span class="kpi-vs">vs</span><span class="kpi-val-b">${d2??'—'}</span>`);
    set('aSum-total', primaryMeta.agg==='sum'?kpiCompareHTML(s1?.total,s2?.total,primaryMeta):'—');
    set('aSum-avg', kpiCompareHTML(s1?.avg,s2?.avg,primaryMeta));
    set('aSum-best', kpiBestWorstHTML(s1?.best,s2?.best,primaryMeta,weekMode));
    set('aSum-worst', kpiBestWorstHTML(s1?.worst,s2?.worst,primaryMeta,weekMode));
    set('aSum-std', kpiCompareHTML(s1?.std,s2?.std,primaryMeta));
  }

  const label1=analysisStore==='__all__'?'Todas las tiendas':analysisStore;
  const label2=analysisStore2;
  wrap.innerHTML='';
  analysisMetrics.forEach((m,idx)=>{
    const meta=ANALYSIS_METRICS[m];
    const ser1=m===primary?primarySeries1:collectAnalysisSeries(m,analysisStore);
    const ser2=compare?(m===primary?primarySeries2:collectAnalysisSeries(m,analysisStore2)):[];
    const card=document.createElement('div');
    card.className='chart-card';
    if(!ser1.length&&!ser2.length){
      card.innerHTML=`<div class="chart-title">${meta.label} · ${label1}${compare?' vs '+label2:''}</div><div class="chart-empty">Sin datos para esta métrica en el rango</div>`;
      wrap.appendChild(card);return;
    }
    const avg1=ser1.length?ser1.reduce((a,d)=>a+d.value,0)/ser1.length:0;
    const avg2=ser2.length?ser2.reduce((a,d)=>a+d.value,0)/ser2.length:0;
    const unit=weekMode?'sem.':'días';
    const title=compare
      ? `${meta.label} · <span class="chart-legend-dot dot-a"></span>${label1} vs <span class="chart-legend-dot dot-b"></span>${label2} · ${fmtDate(analysisStart)} → ${fmtDate(analysisEnd)}`
      : `${meta.label} · ${label1} · ${fmtDate(analysisStart)} → ${fmtDate(analysisEnd)} · ${ser1.length} ${unit}`;
    card.innerHTML=`<div class="chart-title">${title}</div><div class="chart-wrap"><svg class="chart-svg"></svg><div class="chart-tooltip"></div></div>`;
    wrap.appendChild(card);
    const svg=card.querySelector('svg');
    const tt=card.querySelector('.chart-tooltip');
    drawAnalysisChart(svg, tt, ser1, ser2, meta, avg1, avg2, idx===analysisMetrics.length-1, label1, label2, weekMode);
  });
}

function drawAnalysisChart(svg, tooltip, series1, series2, meta, avg1, avg2, showMonthNames, label1, label2, weekMode){
  const compare = !!(series2 && series2.length);
  // Union of dates (sorted)
  let rows;
  if(compare){
    const map=new Map();
    series1.forEach(d=>map.set(d.date,{date:d.date,day:d.day,v1:d.value,v2:null}));
    series2.forEach(d=>{if(map.has(d.date))map.get(d.date).v2=d.value;else map.set(d.date,{date:d.date,day:d.day,v1:null,v2:d.value});});
    rows=[...map.values()].sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0);
  }else{
    rows=series1.map(d=>({date:d.date,day:d.day,v1:d.value,v2:null}));
  }
  const rect=svg.getBoundingClientRect();
  const W=Math.max(480, Math.round(rect.width||svg.clientWidth||800));
  const H=showMonthNames?360:280;
  const pad={l:82,r:22,t:20,b:showMonthNames?74:40};
  svg.style.height=H+'px';
  const plotW=W-pad.l-pad.r, plotH=H-pad.t-pad.b;
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
  svg.setAttribute('preserveAspectRatio','none');

  const n=rows.length;
  const allValues=compare?rows.flatMap(r=>[r.v1,r.v2].filter(v=>v!=null)):rows.map(r=>r.v1).filter(v=>v!=null);
  let yMin=0, yMax=allValues.length?Math.max(...allValues):1;
  if(meta.inverted){yMin=Math.max(1,Math.floor(Math.min(...allValues))-1);yMax=Math.ceil(Math.max(...allValues))+1;if(yMax===yMin)yMax=yMin+1;}
  else{yMax=yMax*1.08||1;}
  if(yMax===yMin)yMax=yMin+1;

  const valueToY = v => {
    if(meta.inverted){return pad.t + ((v - yMin)/(yMax - yMin))*plotH;}
    return pad.t + plotH - ((v - yMin)/(yMax - yMin))*plotH;
  };

  const barsPer=compare?2:1;
  const groupGap=Math.max(1,Math.min(3, plotW/(n*8)));
  const groupW=Math.max(3,(plotW - groupGap*(n+1))/n);
  const inGap=compare?1:0;
  const barW=(groupW - inGap*(barsPer-1))/barsPer;
  const gx = i => pad.l + groupGap + i*(groupW+groupGap);

  const parts=[];
  const ticks=5;
  for(let i=0;i<=ticks;i++){
    const v=yMin+(yMax-yMin)*i/ticks;
    const y=valueToY(v);
    parts.push(`<line class="grid-line" x1="${pad.l}" y1="${y}" x2="${W-pad.r}" y2="${y}"/>`);
    const lbl=meta.inverted?`#${Math.round(v)}`:meta.fmt(v);
    parts.push(`<text class="axis-label" x="${pad.l-8}" y="${y+3}" text-anchor="end">${lbl}</text>`);
  }
  parts.push(`<line class="axis-line" x1="${pad.l}" y1="${pad.t+plotH}" x2="${W-pad.r}" y2="${pad.t+plotH}"/>`);

  const drawBar=(val,x,cls,i,series)=>{
    if(val==null)return;
    const vy=valueToY(val);
    let y,h;
    if(meta.inverted){y=pad.t; h=Math.max(0.8, vy-pad.t);}
    else{y=vy; h=Math.max(0.8, pad.t+plotH-vy);}
    parts.push(`<rect class="bar ${cls}" x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${barW.toFixed(2)}" height="${h.toFixed(2)}" data-idx="${i}" data-series="${series}" rx="2"/>`);
  };
  rows.forEach((r,i)=>{
    const g=gx(i);
    if(compare){
      drawBar(r.v1, g, 'bar-a', i, 1);
      drawBar(r.v2, g+barW+inGap, 'bar-b', i, 2);
    }else{
      const dayLow=(r.day||'').toLowerCase();
      const cls=dayLow==='saturday'?'sat':dayLow==='sunday'?'sun':'';
      drawBar(r.v1, g, cls, i, 1);
    }
  });

  // Mean lines
  if(compare){
    if(series1.length){const y=valueToY(avg1);parts.push(`<line class="mean-line mean-a" x1="${pad.l}" y1="${y}" x2="${W-pad.r}" y2="${y}"/><text class="mean-label mean-label-a" x="${pad.l+4}" y="${y-4}" text-anchor="start">A · ${meta.fmt(avg1)}</text>`);}
    if(series2.length){const y=valueToY(avg2);parts.push(`<line class="mean-line mean-b" x1="${pad.l}" y1="${y}" x2="${W-pad.r}" y2="${y}"/><text class="mean-label mean-label-b" x="${W-pad.r-4}" y="${y-4}" text-anchor="end">B · ${meta.fmt(avg2)}</text>`);}
  }else{
    const y=valueToY(avg1);
    parts.push(`<line class="mean-line" x1="${pad.l}" y1="${y}" x2="${W-pad.r}" y2="${y}"/>`);
    parts.push(`<text class="mean-label" x="${W-pad.r-4}" y="${y-4}" text-anchor="end">Media · ${meta.fmt(avg1)}</text>`);
  }

  // Bar values above each bar (solo en single mode y métricas no invertidas)
  if(!meta.inverted && !compare){
    rows.forEach((r,i)=>{
      if(r.v1==null)return;
      const cx=(gx(i)+barW/2).toFixed(2);
      const ly=(valueToY(r.v1)-5).toFixed(2);
      parts.push(`<text class="bar-value" x="${cx}" y="${ly}" text-anchor="middle">${(r.v1/1000).toFixed(1)}K</text>`);
    });
  }

  const MONTH_ES=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const DOW_LETTER={Monday:'L',Tuesday:'M',Wednesday:'X',Thursday:'J',Friday:'V',Saturday:'S',Sunday:'D'};
  const monthBlocks=[];let curBlk=null;const monthDivIdx=new Set();
  rows.forEach((d,i)=>{
    const [y,m]=d.date.split('-');const key=y+'-'+m;
    if(!curBlk||curBlk.key!==key){
      if(curBlk){monthBlocks.push(curBlk);monthDivIdx.add(i);}
      curBlk={key,start:i,end:i,month:+m,year:+y};
    }else curBlk.end=i;
  });
  if(curBlk)monthBlocks.push(curBlk);

  if(!weekMode){
    rows.forEach((d,i)=>{
      if(i===0||d.day!=='Monday'||monthDivIdx.has(i))return;
      const xDiv=(gx(i-1)+groupW+gx(i))/2;
      parts.push(`<line class="week-divider" x1="${xDiv.toFixed(2)}" y1="${pad.t}" x2="${xDiv.toFixed(2)}" y2="${(pad.t+plotH).toFixed(2)}"/>`);
    });
  }

  const monthDivBottom = showMonthNames ? pad.t+plotH+60 : pad.t+plotH+30;
  for(let b=1;b<monthBlocks.length;b++){
    const prev=monthBlocks[b-1], cur=monthBlocks[b];
    const xDiv=(gx(prev.end)+groupW+gx(cur.start))/2;
    parts.push(`<line class="month-divider" x1="${xDiv.toFixed(2)}" y1="${pad.t}" x2="${xDiv.toFixed(2)}" y2="${monthDivBottom.toFixed(2)}"/>`);
  }

  rows.forEach((d,i)=>{
    const cx=(gx(i)+groupW/2).toFixed(2);
    if(weekMode){
      const wk=weekTag(d.date);
      const dmPart=d.date.split('-');
      const dm=`${dmPart[2]}/${dmPart[1]}`;
      parts.push(`<text class="bar-label-day" x="${cx}" y="${(pad.t+plotH+13).toFixed(2)}" text-anchor="middle">${wk}</text>`);
      parts.push(`<text class="bar-label-dow" x="${cx}" y="${(pad.t+plotH+25).toFixed(2)}" text-anchor="middle">${dm}</text>`);
    }else{
      const dayNum=parseInt(d.date.split('-')[2],10);
      const letter=DOW_LETTER[d.day]||'';
      const isWk=(d.day==='Saturday'||d.day==='Sunday');
      parts.push(`<text class="bar-label-day" x="${cx}" y="${(pad.t+plotH+13).toFixed(2)}" text-anchor="middle">${dayNum}</text>`);
      parts.push(`<text class="bar-label-dow${isWk?' weekend':''}" x="${cx}" y="${(pad.t+plotH+25).toFixed(2)}" text-anchor="middle">${letter}</text>`);
    }
  });

  if(showMonthNames){
    monthBlocks.forEach(b=>{
      const cx=((gx(b.start)+gx(b.end)+groupW)/2).toFixed(2);
      parts.push(`<text class="month-label" x="${cx}" y="${(pad.t+plotH+52).toFixed(2)}" text-anchor="middle">${MONTH_ES[b.month-1]} ${b.year}</text>`);
    });
  }

  svg.innerHTML=parts.join('');

  const wrap=svg.parentElement;
  svg.querySelectorAll('rect.bar').forEach(r=>{
    r.addEventListener('mousemove', e=>{
      const i=+r.dataset.idx, d=rows[i];
      const dateLbl=weekMode
        ? `${weekTag(d.date)} · ${fmtDate(d.date)} → ${fmtDate(weekEnd(d.date))}`
        : `${fmtDate(d.date)} · ${DAY_ES[d.day]||d.day||'—'}`;
      let html;
      if(compare){
        const v1=d.v1!=null?meta.fmt(d.v1):'—';
        const v2=d.v2!=null?meta.fmt(d.v2):'—';
        html=`<div class="tt-date">${dateLbl}</div>`+
             `<div class="tt-row"><span class="tt-dot tt-dot-a"></span>${label1}: <strong>${v1}</strong></div>`+
             `<div class="tt-row"><span class="tt-dot tt-dot-b"></span>${label2}: <strong>${v2}</strong></div>`;
      }else{
        html=`<div class="tt-date">${dateLbl}</div>${meta.label}: <strong>${meta.fmt(d.v1)}</strong>`;
      }
      tooltip.innerHTML=html;
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

