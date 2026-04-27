// ══════════════════════════════════════════════════════
//  BACKUP
// ══════════════════════════════════════════════════════
function migrateLegacyPresets(b){
  if(Array.isArray(b.updPresets))return b.updPresets.slice();
  const list=[];
  if(Array.isArray(b.updRangePresets))for(const p of b.updRangePresets)list.push({name:p.name,range:{start:p.start,end:p.end,endAuto:!!p.endAuto},stores:null});
  if(Array.isArray(b.updStorePresets))for(const p of b.updStorePresets)list.push({name:p.name,range:null,stores:p.stores});
  return list;
}
function saveBackup(){
  const b={
    version:6,savedAt:new Date().toISOString(),
    theme:document.documentElement.dataset.theme,
    activePanel:document.querySelector('.panel.active')?.id?.replace('panel-','')||'home',
    cexYearStart,updMode,updCustomEnd,updCustomStart,updCustomEndAuto,updStoreFilter,updPresets,updSortCol,updSortDir,wkSortCol,wkSortDir,
    diarioStoreSel,hitoData,
    dailySelectedDate,dailySortCol,dailySortDir,
    analysisStore,analysisStore2,analysisMetrics,analysisDayFilter,analysisDayFilter2,analysisGranularity,analysisStart,analysisEnd,analysisPresets,
    patStore,patMetric,patStart,patEnd,patSortCol,patSortDir,patColorWeeks,
    targetStore:document.getElementById('targetStore').value,
    todayRaw:document.getElementById('todayInput').value,
    dailyCSVRaw,dailyCSVName,manualLog,
    updTargetStore:document.getElementById('updTargetStore').value,
    wkWeek:document.getElementById('wkSelect').value,
  };
  const blob=new Blob([JSON.stringify(b,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=`4wks_backup_${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(url);
  toast('✓ Backup guardado','ok');
}
function loadBackup(event){
  const file=event.target.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{
    try{
      const b=JSON.parse(e.target.result);if(!b.version)throw new Error();
      if(b.theme)document.documentElement.dataset.theme=b.theme;
      if(b.cexYearStart)cexYearStart=b.cexYearStart;
      if(b.updMode){updMode=b.updMode;setUpdMode(updMode);}
      if(b.updCustomEnd)updCustomEnd=b.updCustomEnd;
      if(b.updCustomStart)updCustomStart=b.updCustomStart;
      if(typeof b.updCustomEndAuto==='boolean')updCustomEndAuto=b.updCustomEndAuto;
      if(b.updStoreFilter===null||Array.isArray(b.updStoreFilter))updStoreFilter=b.updStoreFilter;
      updPresets=migrateLegacyPresets(b);
      if(b.updSortCol){updSortCol=b.updSortCol;updSortDir=b.updSortDir??-1;}
      if(b.wkSortCol){wkSortCol=b.wkSortCol;wkSortDir=b.wkSortDir??-1;}
      if(b.diarioStoreSel)diarioStoreSel=b.diarioStoreSel;
      if(b.hitoData)hitoData=b.hitoData;
      if(typeof b.dailySelectedDate==='string')dailySelectedDate=b.dailySelectedDate;
      if(typeof b.dailySortCol==='string')dailySortCol=b.dailySortCol;
      if(b.dailySortDir===-1||b.dailySortDir===1)dailySortDir=b.dailySortDir;
      if(typeof b.patStore==='string')patStore=b.patStore;
      if(typeof b.patMetric==='string'&&b.patMetric in PAT_METRICS)patMetric=b.patMetric;
      if(typeof b.patStart==='string')patStart=b.patStart;
      if(typeof b.patEnd==='string')patEnd=b.patEnd;
      if(typeof b.patSortCol==='string')patSortCol=b.patSortCol;
      if(b.patSortDir===-1||b.patSortDir===1)patSortDir=b.patSortDir;
      if(typeof b.patColorWeeks==='boolean')patColorWeeks=b.patColorWeeks;
      if(b.analysisStore)analysisStore=b.analysisStore;
    if(typeof b.analysisStore2==='string')analysisStore2=b.analysisStore2;
      if(Array.isArray(b.analysisMetrics)&&b.analysisMetrics.length)analysisMetrics=b.analysisMetrics;
      else if(b.analysisMetric)analysisMetrics=[b.analysisMetric];
      if(b.analysisDayFilter!=null)analysisDayFilter=b.analysisDayFilter;
      if(b.analysisDayFilter2!=null)analysisDayFilter2=b.analysisDayFilter2;
    if(b.analysisGranularity==='week'||b.analysisGranularity==='day')analysisGranularity=b.analysisGranularity;
      if(b.analysisStart)analysisStart=b.analysisStart;
      if(b.analysisEnd)analysisEnd=b.analysisEnd;
      if(Array.isArray(b.analysisPresets))analysisPresets=b.analysisPresets;
      setDP('settingsCexStart',cexYearStart,false);
      if(b.dailyCSVRaw){
        manualLog=b.manualLog||[];
        applyRegistroCSV(b.dailyCSVRaw,b.dailyCSVName||'backup');
        for(const entry of manualLog){const{map}=parseDayPaste(entry.rawText);const dn=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date(entry.date+'T12:00:00Z').getUTCDay()];for(const s of Object.values(map))s.day=dn;if(!dailyData[entry.date])dailyData[entry.date]={};Object.assign(dailyData[entry.date],map);}
        renderUpdater();renderLog();
        if(b.updTargetStore){if((_ssOptions['updTargetStore']||[]).some(o=>o.value===b.updTargetStore)){ssSetValue('updTargetStore',b.updTargetStore,false);renderUpdTable();}}
        if(b.wkWeek){const s=document.getElementById('wkSelect');if([...s.options].some(o=>o.value===b.wkWeek))s.value=b.wkWeek;}
        if(b.diarioStoreSel&&(_ssOptions['diarioStore']||[]).some(o=>o.value===b.diarioStoreSel))ssSetValue('diarioStore',b.diarioStoreSel,false);
        if(b.semanalStoreSel&&(_ssOptions['semanalStore']||[]).some(o=>o.value===b.semanalStoreSel))ssSetValue('semanalStore',b.semanalStoreSel,false);
      }
      if(b.todayRaw){document.getElementById('todayInput').value=b.todayRaw;onTodayInput();}
      syncSimulator();
      if(b.activePanel){const nb=document.querySelector(`.nav-item[data-panel="${b.activePanel}"]`);if(nb)navigate(nb);}
      toast('✓ Backup restaurado','ok');
    }catch{toast('⚠ Error al leer el backup','err');}
    event.target.value='';
  };
  reader.readAsText(file,'UTF-8');
}

// ══════════════════════════════════════════════════════
//  PERSISTENCE (localStorage)
// ══════════════════════════════════════════════════════
const LS_KEY='4wks_state';

function persistState(){
  try{
    const s={
      version:6,savedAt:new Date().toISOString(),
      theme:document.documentElement.dataset.theme,
      activePanel:document.querySelector('.panel.active')?.id?.replace('panel-','')||'home',
      cexYearStart,updMode,updCustomEnd,updCustomStart,updCustomEndAuto,updStoreFilter,updPresets,updSortCol,updSortDir,wkSortCol,wkSortDir,
      diarioSortCol,diarioSortDir,diarioDayFilter,
      diarioStoreSel,hitoData,
      dailySelectedDate,dailySortCol,dailySortDir,
      semanalStoreSel,semanalSortCol,semanalSortDir,semanalColorBy,
      analysisStore,analysisStore2,analysisMetrics,analysisDayFilter,analysisDayFilter2,analysisGranularity,analysisStart,analysisEnd,analysisPresets,
      patStore,patMetric,patStart,patEnd,patSortCol,patSortDir,patColorWeeks,
      targetStore:document.getElementById('targetStore').value,
      todayRaw:document.getElementById('todayInput').value,
      dailyCSVRaw,dailyCSVName,manualLog,
      updTargetStore:document.getElementById('updTargetStore').value,
      wkWeek:document.getElementById('wkSelect').value,
    };
    localStorage.setItem(LS_KEY,JSON.stringify(s));
  }catch(e){/* quota exceeded — silent */}
}

function restoreState(){
  try{
    const raw=localStorage.getItem(LS_KEY);if(!raw)return;
    const b=JSON.parse(raw);if(!b.version)return;
    if(b.theme)document.documentElement.dataset.theme=b.theme;
    if(b.cexYearStart)cexYearStart=b.cexYearStart;
    if(b.updMode){updMode=b.updMode;setUpdMode(updMode);}
    if(b.updCustomEnd)updCustomEnd=b.updCustomEnd;
    if(b.updCustomStart)updCustomStart=b.updCustomStart;
    if(b.updStoreFilter===null||Array.isArray(b.updStoreFilter))updStoreFilter=b.updStoreFilter;
    updPresets=migrateLegacyPresets(b);
    if(b.updSortCol){updSortCol=b.updSortCol;updSortDir=b.updSortDir??-1;}
    if(b.wkSortCol){wkSortCol=b.wkSortCol;wkSortDir=b.wkSortDir??-1;}
    if(b.diarioSortCol){diarioSortCol=b.diarioSortCol;diarioSortDir=b.diarioSortDir??-1;}
    if(b.diarioDayFilter!=null){
      diarioDayFilter=b.diarioDayFilter;
      document.querySelectorAll('#diarioDayFilter .diario-filter-pill').forEach(btn=>btn.classList.toggle('active',btn.dataset.day===diarioDayFilter));
    }
    if(b.diarioStoreSel)diarioStoreSel=b.diarioStoreSel;
    if(typeof b.dailySelectedDate==='string')dailySelectedDate=b.dailySelectedDate;
    if(typeof b.dailySortCol==='string')dailySortCol=b.dailySortCol;
    if(b.dailySortDir===-1||b.dailySortDir===1)dailySortDir=b.dailySortDir;
    if(typeof b.patStore==='string')patStore=b.patStore;
    if(typeof b.patMetric==='string'&&b.patMetric in PAT_METRICS)patMetric=b.patMetric;
    if(typeof b.patStart==='string')patStart=b.patStart;
    if(typeof b.patEnd==='string')patEnd=b.patEnd;
    if(typeof b.patSortCol==='string')patSortCol=b.patSortCol;
    if(b.patSortDir===-1||b.patSortDir===1)patSortDir=b.patSortDir;
    if(typeof b.patColorWeeks==='boolean')patColorWeeks=b.patColorWeeks;
    if(b.semanalStoreSel)semanalStoreSel=b.semanalStoreSel;
    if(b.semanalSortCol){semanalSortCol=b.semanalSortCol;semanalSortDir=b.semanalSortDir??-1;}
    if(typeof b.semanalColorBy==='string')semanalColorBy=b.semanalColorBy;
    if(b.hitoData)hitoData=b.hitoData;
    if(b.analysisStore)analysisStore=b.analysisStore;
    if(typeof b.analysisStore2==='string')analysisStore2=b.analysisStore2;
    if(Array.isArray(b.analysisMetrics)&&b.analysisMetrics.length)analysisMetrics=b.analysisMetrics;
    else if(b.analysisMetric)analysisMetrics=[b.analysisMetric];
    if(b.analysisDayFilter!=null)analysisDayFilter=b.analysisDayFilter;
    if(b.analysisDayFilter2!=null)analysisDayFilter2=b.analysisDayFilter2;
    if(b.analysisGranularity==='week'||b.analysisGranularity==='day')analysisGranularity=b.analysisGranularity;
    if(b.analysisStart)analysisStart=b.analysisStart;
    if(b.analysisEnd)analysisEnd=b.analysisEnd;
    if(Array.isArray(b.analysisPresets))analysisPresets=b.analysisPresets;
    setDP('settingsCexStart',cexYearStart,false);
    if(b.dailyCSVRaw){
      manualLog=b.manualLog||[];
      applyRegistroCSV(b.dailyCSVRaw,b.dailyCSVName||'auto');
      for(const entry of manualLog){const{map}=parseDayPaste(entry.rawText);const dn=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date(entry.date+'T12:00:00Z').getUTCDay()];for(const s of Object.values(map))s.day=dn;if(!dailyData[entry.date])dailyData[entry.date]={};Object.assign(dailyData[entry.date],map);}
      renderUpdater();renderLog();
      if(b.updTargetStore){if((_ssOptions['updTargetStore']||[]).some(o=>o.value===b.updTargetStore)){ssSetValue('updTargetStore',b.updTargetStore,false);renderUpdTable();}}
      if(b.wkWeek){const s=document.getElementById('wkSelect');if([...s.options].some(o=>o.value===b.wkWeek))s.value=b.wkWeek;}
      if(b.diarioStoreSel&&(_ssOptions['diarioStore']||[]).some(o=>o.value===b.diarioStoreSel))ssSetValue('diarioStore',b.diarioStoreSel,false);
    }
    if(b.todayRaw){document.getElementById('todayInput').value=b.todayRaw;}
    syncSimulator();
    if(b.targetStore&&(_ssOptions['targetStore']||[]).some(o=>o.value===b.targetStore))ssSetValue('targetStore',b.targetStore,false);
    if(b.todayRaw)onTodayInput();
    if(b.activePanel){const nb=document.querySelector(`.nav-item[data-panel="${b.activePanel}"]`);if(nb)navigate(nb);}
  }catch(e){/* corrupted state — ignore */}
}

// Auto-save on every meaningful change (debounced)
let _persistTimer;
function schedulePersist(){clearTimeout(_persistTimer);_persistTimer=setTimeout(persistState,500);}

// Hook into all state-changing functions
const _origNav=navigate;
navigate=function(el){_origNav(el);schedulePersist();};
const _origToggle=toggleTheme;
toggleTheme=function(){_origToggle();schedulePersist();};
const _origSortUpd=sortUpd;
sortUpd=function(c){_origSortUpd(c);schedulePersist();};
const _origSortWk=sortWk;
sortWk=function(c){_origSortWk(c);schedulePersist();};
const _origSortDiario=sortDiario;
sortDiario=function(c){_origSortDiario(c);schedulePersist();};
const _origSortSemanal=sortSemanal;
sortSemanal=function(c){_origSortSemanal(c);schedulePersist();};
const _origRenderSemanal=renderSemanal;
renderSemanal=function(){_origRenderSemanal();schedulePersist();};
const _origFilterDay=filterDiarioDay;
filterDiarioDay=function(b){_origFilterDay(b);schedulePersist();};
const _origSetMode=setUpdMode;
setUpdMode=function(m){_origSetMode(m);schedulePersist();};
const _origCexStart=onCexStartChange;
onCexStartChange=function(){_origCexStart();schedulePersist();};
const _origSaveHito=saveHito;
saveHito=function(i){_origSaveHito(i);schedulePersist();};
const _origRenderUpd=renderUpdater;
renderUpdater=function(){_origRenderUpd();schedulePersist();};
const _origRecalc=recalc;
recalc=function(){_origRecalc();schedulePersist();};

