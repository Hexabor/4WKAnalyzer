// ══════════════════════════════════════════════════════
//  UTILS
// ══════════════════════════════════════════════════════
const pN  = s => parseInt(String(s??'').replace(/[€\s]/g,'').replace(/,/g,''),10)||0;
const fmt = n => n.toLocaleString('es-ES')+' €';
const fmtN= n => n.toLocaleString('es-ES');

function parseCSVLine(line){
  const cols=[]; let cur='',inQ=false;
  for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){inQ=!inQ;continue;}if(c===','&&!inQ){cols.push(cur);cur='';continue;}cur+=c;}
  cols.push(cur); return cols;
}
const ddmmyyyy=s=>{const p=s.trim().split('/');if(p.length!==3)return null;return `${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`;};
const fmtDate=iso=>{if(!iso||!iso.includes('-'))return '—';const p=iso.split('-');return `${p[2]}/${p[1]}/${p[0]}`;};

function weekStart(dateStr){
  const d=new Date(dateStr+'T12:00:00Z'),dow=d.getUTCDay(),dfs=dow===6?0:dow+1;
  const sat=new Date(d);sat.setUTCDate(sat.getUTCDate()-dfs);return sat.toISOString().slice(0,10);
}
function weekEnd(satStr){
  const d=new Date(satStr+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+6);return d.toISOString().slice(0,10);
}
function cexWeekNum(satStr){
  const wk1=weekStart(cexYearStart);
  const d1=new Date(wk1+'T12:00:00Z'),d2=new Date(satStr+'T12:00:00Z');
  const dw=Math.round((d2-d1)/(7*864e5));
  return ((dw%52)+52)%52+1;
}
function weekLabel(satStr){
  const n=cexWeekNum(satStr),we=weekEnd(satStr);
  return `WK${String(n).padStart(2,'0')} · Sáb ${fmtDate(satStr)} → Vie ${fmtDate(we)}`;
}
function weekTag(satStr){return `WK${String(cexWeekNum(satStr)).padStart(2,'0')}`;}

const DAY_ES={Saturday:'Sábado',Sunday:'Domingo',Monday:'Lunes',Tuesday:'Martes',Wednesday:'Miércoles',Thursday:'Jueves',Friday:'Viernes'};


// ══════════════════════════════════════════════════════
//  4WKS SELECTION
// ══════════════════════════════════════════════════════
function getWeeks(){const ws=new Set();for(const d of Object.keys(dailyData))ws.add(weekStart(d));return Array.from(ws).sort();}

function getSelected4Weeks(){
  const allWeeks=getWeeks(); if(!allWeeks.length)return[];
  const todayStr=new Date().toISOString().slice(0,10);
  if(updMode==='consolidated'){const done=allWeeks.filter(ws=>weekEnd(ws)<todayStr);return done.slice(-4);}
  if(updMode==='current'){return allWeeks.slice(-4);}
  const end=updCustomEnd||allWeeks[allWeeks.length-1];
  const idx=allWeeks.indexOf(end);
  if(idx<0)return allWeeks.slice(-4);
  return allWeeks.slice(Math.max(0,idx-3),idx+1);
}

function compute4WKS(){
  const last4=getSelected4Weeks();
  const agg={};
  for(const [d,stores] of Object.entries(dailyData)){
    if(!last4.includes(weekStart(d)))continue;
    for(const [store,s] of Object.entries(stores)){
      if(!agg[store])agg[store]={vc:0,sales:0,buys:0,members:0,refunds:0};
      agg[store].vc+=s.vc;agg[store].sales+=s.sales;agg[store].buys+=s.buys;agg[store].members+=s.members;agg[store].refunds+=s.refunds;
    }
  }
  const ranking=Object.entries(agg).map(([store,s])=>({store,...s})).sort((a,b)=>b.vc-a.vc).map((s,i)=>({...s,r:i+1}));
  return{ranking,last4};
}
