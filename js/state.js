// ══════════════════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════════════════
// dailyData[date][store] = {vc,sales,buys,cashBuys,exchBuys,members,refunds,ranking,day}
let dailyData={}, dailyCSVRaw='', dailyCSVName='', manualLog=[];
// hitoData[date] = string  (store-agnostic — could extend to per-store if needed)
let hitoData={};

let BASE=[], todayMap={};
let cexYearStart='2025-12-29';
let updMode='consolidated', updCustomEnd=null, updCustomStart=null, updCustomEndAuto=false;
// updStoreFilter: null = sin filtro (todas las tiendas), [] = ninguna, [...] = solo esas
let updStoreFilter=null;
// updDayFilter: null = todos los días; [...] = solo esos días (en inglés: 'Saturday','Sunday',...)
let updDayFilter=null;
// updPresets: cada preset agrupa rango + tiendas. Modelo:
//   {name, range: {start,end,endAuto} | null, stores: string[] | null}
//   range=null: el preset no toca el rango (legacy: solo-tiendas)
//   stores=null: aplicar a todas las tiendas (sin filtro) — o legacy solo-rango
let updPresets=[];
let updSortCol='vc', updSortDir=-1;
let wkSortCol='vc',  wkSortDir=-1;
let diarioSortCol='date', diarioSortDir=-1;
let diarioDayFilter='';
let diarioStoreSel='Madrid Islazul';
let semanalSortCol='ws', semanalSortDir=-1;
let semanalStoreSel='Madrid Islazul';
let semanalColorBy='none';
let simSortCol='projVC', simSortDir=-1;
