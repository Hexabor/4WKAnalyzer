// ══════════════════════════════════════════════════════
//  PATRÓN SEMANAL
// ══════════════════════════════════════════════════════
let patStore='', patMetric='vc', patStart='', patEnd='', patSortCol='ws', patSortDir=-1, patColorWeeks=false;

const PAT_METRICS={
  vc:      {label:'V+C',       fmt:fmt,                              rgb:'139,92,246'}, // violeta
  sales:   {label:'Net Sales', fmt:fmt,                              rgb:'20,184,166'}, // teal
  buys:    {label:'Buys',      fmt:fmt,                              rgb:'59,130,246'}, // azul
  cashBuys:{label:'Cash Buys', fmt:fmt,                              rgb:'16,185,129'}, // emerald
  exchBuys:{label:'Exch. Buys',fmt:fmt,                              rgb:'245,158,11'}, // ámbar
  refunds: {label:'Refunds',   fmt:fmt,                              rgb:'244,63,94'},  // rosa-rojo
  members: {label:'Members',   fmt:n=>fmtN(Math.round(n)),           rgb:'236,72,153'}, // pink
};
// Orden CEX: sáb→vie
const PAT_DAYS=['Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday','Friday'];
const PAT_DAY_LBL=['Sáb','Dom','Lun','Mar','Mié','Jue','Vie'];
const PAT_DAY_KEY=['sat','sun','mon','tue','wed','thu','fri'];

function rebuildPatStore(){
  const hidden=document.getElementById('patStore');if(!hidden)return;
  const prev=patStore||hidden.value;
  const stores=new Set();
  for(const dateStores of Object.values(dailyData))for(const s of Object.keys(dateStores))stores.add(s);
  const sorted=[...stores].sort();
  if(!sorted.length){ssSetOptions('patStore',[]);ssSetValue('patStore','',false);patStore='';return;}
  ssSetOptions('patStore',sorted.map(s=>({value:s,label:s})));
  const newVal=sorted.includes(prev)?prev:(sorted.includes('Madrid Islazul')?'Madrid Islazul':sorted[0]);
  ssSetValue('patStore',newVal,false);
  patStore=newVal;
}

function rebuildPatRange(){
  const weeks=getWeeks();
  const sStart=document.getElementById('patStart'),sEnd=document.getElementById('patEnd');
  if(!sStart||!sEnd)return;
  sStart.innerHTML='';sEnd.innerHTML='';
  if(!weeks.length){
    sStart.innerHTML='<option value="">— sin datos —</option>';
    sEnd.innerHTML='<option value="">— sin datos —</option>';
    patStart='';patEnd='';
    return;
  }
  weeks.forEach(ws=>{
    const oS=document.createElement('option');oS.value=ws;oS.textContent=weekLabel(ws);sStart.appendChild(oS);
    const oE=document.createElement('option');oE.value=ws;oE.textContent=weekLabel(ws);sEnd.appendChild(oE);
  });
  if(!patStart||!weeks.includes(patStart))patStart=weeks[0];
  if(!patEnd||!weeks.includes(patEnd))patEnd=weeks[weeks.length-1];
  // Garantizar que start <= end
  if(patStart>patEnd){const t=patStart;patStart=patEnd;patEnd=t;}
  sStart.value=patStart;sEnd.value=patEnd;
}

function onPatStoreChange(){patStore=document.getElementById('patStore').value;renderPattern();schedulePersist();}
function onPatRangeChange(){
  patStart=document.getElementById('patStart').value;
  patEnd=document.getElementById('patEnd').value;
  if(patStart&&patEnd&&patStart>patEnd){const t=patStart;patStart=patEnd;patEnd=t;document.getElementById('patStart').value=patStart;document.getElementById('patEnd').value=patEnd;}
  renderPattern();schedulePersist();
}
function setPatMetric(btn){
  patMetric=btn.dataset.metric;
  renderPattern();schedulePersist();
}
function sortPattern(col){
  if(patSortCol===col)patSortDir*=-1;
  else{patSortCol=col;patSortDir=-1;}
  renderPattern();schedulePersist();
}
function togglePatHighlight(btn){
  const key=btn.dataset.highlight;
  if(key==='weeks'){
    patColorWeeks=!patColorWeeks;
    btn.classList.toggle('active',patColorWeeks);
  }
  renderPattern();schedulePersist();
}
function applyPatSortHeaders(){
  const cols=['ws',...PAT_DAY_KEY];
  cols.forEach(c=>{
    const th=document.querySelector(`#patTable [data-pcol="${c}"]`);
    const arr=document.getElementById(`patArr-${c}`);
    if(!th||!arr)return;
    if(c===patSortCol){th.classList.add('sort-active');arr.style.opacity='1';arr.textContent=patSortDir===-1?'▼':'▲';}
    else{th.classList.remove('sort-active');arr.style.opacity='0';arr.textContent='';}
  });
}

function collectPatternRows(){
  // Devuelve [{ws, days:[v_sat, v_sun, ..., v_fri], _weekIntensity}], dailyAvg:[7]
  if(!patStore||!patStart||!patEnd)return{rows:[],dailyAvg:[]};
  const allWeeks=getWeeks().filter(ws=>ws>=patStart&&ws<=patEnd);
  const N=allWeeks.length;
  const rows=allWeeks.map((ws,i)=>({ws,days:Array(7).fill(null),_weekIntensity:N>1?i/(N-1):1}));
  for(const [date,stores] of Object.entries(dailyData)){
    const ws=weekStart(date);
    if(ws<patStart||ws>patEnd)continue;
    const s=stores[patStore];if(!s)continue;
    const v=s[patMetric];if(v==null)continue;
    const idx=PAT_DAYS.indexOf(s.day);
    if(idx<0)continue;
    const row=rows.find(r=>r.ws===ws);
    if(row)row.days[idx]=v;
  }
  // Media por columna (ignorando nulls)
  const dailyAvg=Array(7).fill(null);
  for(let i=0;i<7;i++){
    const vals=rows.map(r=>r.days[i]).filter(v=>v!=null);
    dailyAvg[i]=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null;
  }
  return{rows,dailyAvg};
}

function drawPatternChart(dailyAvg, meta){
  const svg=document.getElementById('patChart');
  const tt=document.getElementById('patChartTip');
  if(!svg)return;
  const rect=svg.getBoundingClientRect();
  const W=Math.max(480,Math.round(rect.width||svg.clientWidth||800));
  const H=180;
  const pad={l:74,r:18,t:14,b:34};
  svg.style.height=H+'px';
  const plotW=W-pad.l-pad.r, plotH=H-pad.t-pad.b;
  svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
  svg.setAttribute('preserveAspectRatio','none');
  const valid=dailyAvg.filter(v=>v!=null);
  if(!valid.length){svg.innerHTML=`<text x="${W/2}" y="${H/2}" text-anchor="middle" class="axis-label">Sin datos</text>`;return;}
  const yMax=(Math.max(...valid))*1.1||1;
  const yMin=0;
  const valueToY=v=>pad.t+plotH-((v-yMin)/(yMax-yMin))*plotH;
  const n=7;
  const groupGap=2.5;
  const groupW=(plotW-groupGap*(n+1))/n;
  const gx=i=>pad.l+groupGap+i*(groupW+groupGap);
  const parts=[];
  const ticks=4;
  for(let i=0;i<=ticks;i++){
    const v=yMin+(yMax-yMin)*i/ticks;
    const y=valueToY(v);
    parts.push(`<line class="grid-line" x1="${pad.l}" y1="${y}" x2="${W-pad.r}" y2="${y}"/>`);
    parts.push(`<text class="axis-label" x="${pad.l-8}" y="${y+3}" text-anchor="end">${meta.fmt(v)}</text>`);
  }
  parts.push(`<line class="axis-line" x1="${pad.l}" y1="${pad.t+plotH}" x2="${W-pad.r}" y2="${pad.t+plotH}"/>`);
  const compactNum=v=>{
    if(v==null)return '';
    if(Math.abs(v)>=10000)return Math.round(v/1000)+'K';
    if(Math.abs(v)>=1000)return (v/1000).toFixed(1).replace('.',',')+'K';
    return Math.round(v).toString();
  };
  dailyAvg.forEach((v,i)=>{
    const x=gx(i),cx=x+groupW/2;
    const cls=i===0?'sat':(i===1?'sun':'');
    if(v!=null){
      const y=valueToY(v),h=Math.max(0.8,pad.t+plotH-y);
      parts.push(`<rect class="bar ${cls}" x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${groupW.toFixed(2)}" height="${h.toFixed(2)}" data-i="${i}" rx="2"/>`);
      parts.push(`<text class="bar-value" x="${cx.toFixed(2)}" y="${(y-5).toFixed(2)}" text-anchor="middle">${compactNum(v)}</text>`);
    }
    const labelStyle=cls?' style="fill:var(--accent);font-weight:700"':'';
    parts.push(`<text class="bar-label-day" x="${cx.toFixed(2)}" y="${(pad.t+plotH+18).toFixed(2)}" text-anchor="middle"${labelStyle}>${PAT_DAY_LBL[i]}</text>`);
  });
  svg.innerHTML=parts.join('');
  // Tooltip
  svg.querySelectorAll('rect.bar').forEach(r=>{
    r.addEventListener('mousemove',e=>{
      const i=+r.dataset.i,v=dailyAvg[i];
      tt.innerHTML=`<div class="tt-date">${PAT_DAY_LBL[i]}</div>${meta.label}: <strong>${meta.fmt(v)}</strong>`;
      const wr=svg.parentElement.getBoundingClientRect();
      let x=e.clientX-wr.left+12,y=e.clientY-wr.top-14;
      if(x+220>wr.width)x=e.clientX-wr.left-228;
      if(y<0)y=0;
      tt.style.left=x+'px';tt.style.top=y+'px';tt.classList.add('show');
    });
    r.addEventListener('mouseleave',()=>tt.classList.remove('show'));
  });
}

function renderPattern(){
  rebuildPatStore();
  rebuildPatRange();
  document.querySelectorAll('#patMetricPills .diario-filter-pill').forEach(b=>{
    const m=PAT_METRICS[b.dataset.metric];
    const isActive=b.dataset.metric===patMetric;
    b.classList.toggle('active',isActive);
    b.style.cssText=isActive&&m?`background:rgba(${m.rgb},.18);border-color:rgba(${m.rgb},.7);color:rgb(${m.rgb})`:'';
  });
  const colorBtn=document.querySelector('#patHighlightPills [data-highlight="weeks"]');
  if(colorBtn)colorBtn.classList.toggle('active',patColorWeeks);
  applyPatSortHeaders();
  const meta=PAT_METRICS[patMetric];
  const tbody=document.getElementById('patBody');
  const chartTitle=document.getElementById('patChartTitle');
  if(!patStore||!Object.keys(dailyData).length){
    tbody.innerHTML='<tr><td colspan="8"><span class="empty-state">Carga el registro diario en «Ranking por rango» para ver el patrón semanal</span></td></tr>';
    if(chartTitle)chartTitle.textContent='Media por día de la semana';
    drawPatternChart([null,null,null,null,null,null,null],meta);
    return;
  }
  const{rows,dailyAvg}=collectPatternRows();
  if(chartTitle)chartTitle.textContent=`Media ${meta.label} por día · ${patStore}`;
  drawPatternChart(dailyAvg,meta);
  if(!rows.length){
    tbody.innerHTML='<tr><td colspan="8"><span class="empty-state">Sin semanas en el rango seleccionado</span></td></tr>';
    return;
  }
  // Min/max para color (sobre los datos crudos antes de ordenar)
  const allVals=rows.flatMap(r=>r.days).filter(v=>v!=null);
  const min=allVals.length?Math.min(...allVals):0;
  const max=allVals.length?Math.max(...allVals):1;
  const range=max-min||1;
  // Sort
  const sorted=[...rows];
  const dir=patSortDir;
  sorted.sort((a,b)=>{
    if(patSortCol==='ws')return a.ws<b.ws?-dir:a.ws>b.ws?dir:0;
    const idx=PAT_DAY_KEY.indexOf(patSortCol);
    const va=a.days[idx], vb=b.days[idx];
    if(va==null&&vb==null)return 0;
    if(va==null)return 1;
    if(vb==null)return -1;
    return(va-vb)*dir;
  });
  tbody.innerHTML='';
  sorted.forEach(r=>{
    const tr=document.createElement('tr');
    const wkBg=patColorWeeks?` style="background:rgba(82,138,156,${(r._weekIntensity*0.55).toFixed(3)})"`:'';
    let html=`<td${wkBg}><span class="wk-label">${weekTag(r.ws)}</span></td>`;
    r.days.forEach(v=>{
      if(v==null){
        html+=`<td class="r"><span class="stat-val" style="color:var(--muted);opacity:.4">—</span></td>`;
      }else{
        const intensity=(v-min)/range;
        const bg=`background:rgba(${meta.rgb},${(intensity*0.45).toFixed(3)})`;
        html+=`<td class="r" style="${bg}"><span class="stat-val">${meta.fmt(v)}</span></td>`;
      }
    });
    tr.innerHTML=html;
    tbody.appendChild(tr);
  });
}
