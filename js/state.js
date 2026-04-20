// ══════════════════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════════════════
// dailyData[date][store] = {vc,sales,buys,cashBuys,exchBuys,members,refunds,ranking,day}
let dailyData={}, dailyCSVRaw='', dailyCSVName='', manualLog=[];
// hitoData[date] = string  (store-agnostic — could extend to per-store if needed)
let hitoData={};

let BASE=[], todayMap={};
let cexYearStart='2025-12-29';
let updMode='consolidated', updCustomEnd=null;
let updSortCol='vc', updSortDir=-1;
let wkSortCol='vc',  wkSortDir=-1;
let diarioSortCol='date', diarioSortDir=-1;
let diarioDayFilter='';
let diarioStoreSel='Madrid Islazul';
let semanalSortCol='ws', semanalSortDir=-1;
let semanalStoreSel='Madrid Islazul';
let semanalColorBy='none';
