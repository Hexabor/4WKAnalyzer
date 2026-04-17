// ══════════════════════════════════════════════════════
//  BACKUP
// ══════════════════════════════════════════════════════
function saveBackup(){
  const b={
    version:5,savedAt:new Date().toISOString(),
    theme:document.documentElement.dataset.theme,
    activePanel:document.querySelector('.panel.active')?.id?.replace('panel-','')||'home',
    cexYearStart,updMode,updCustomEnd,updSortCol,updSortDir,wkSortCol,wkSortDir,
    diarioStoreSel,hitoData,
    analysisStore,analysisMetrics,analysisDayFilter,analysisStart,analysisEnd,analysisPresets,
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
      if(b.updSortCol){updSortCol=b.updSortCol;updSortDir=b.updSortDir??-1;}
      if(b.wkSortCol){wkSortCol=b.wkSortCol;wkSortDir=b.wkSortDir??-1;}
      if(b.diarioStoreSel)diarioStoreSel=b.diarioStoreSel;
      if(b.hitoData)hitoData=b.hitoData;
      if(b.analysisStore)analysisStore=b.analysisStore;
      if(Array.isArray(b.analysisMetrics)&&b.analysisMetrics.length)analysisMetrics=b.analysisMetrics;
      else if(b.analysisMetric)analysisMetrics=[b.analysisMetric];
      if(b.analysisDayFilter!=null)analysisDayFilter=b.analysisDayFilter;
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
      version:5,savedAt:new Date().toISOString(),
      theme:document.documentElement.dataset.theme,
      activePanel:document.querySelector('.panel.active')?.id?.replace('panel-','')||'home',
      cexYearStart,updMode,updCustomEnd,updSortCol,updSortDir,wkSortCol,wkSortDir,
      diarioSortCol,diarioSortDir,diarioDayFilter,
      diarioStoreSel,hitoData,
      analysisStore,analysisMetrics,analysisDayFilter,analysisStart,analysisEnd,analysisPresets,
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
    if(b.updSortCol){updSortCol=b.updSortCol;updSortDir=b.updSortDir??-1;}
    if(b.wkSortCol){wkSortCol=b.wkSortCol;wkSortDir=b.wkSortDir??-1;}
    if(b.diarioSortCol){diarioSortCol=b.diarioSortCol;diarioSortDir=b.diarioSortDir??-1;}
    if(b.diarioDayFilter!=null){
      diarioDayFilter=b.diarioDayFilter;
      document.querySelectorAll('#diarioDayFilter .diario-filter-pill').forEach(btn=>btn.classList.toggle('active',btn.dataset.day===diarioDayFilter));
    }
    if(b.diarioStoreSel)diarioStoreSel=b.diarioStoreSel;
    if(b.hitoData)hitoData=b.hitoData;
    if(b.analysisStore)analysisStore=b.analysisStore;
    if(Array.isArray(b.analysisMetrics)&&b.analysisMetrics.length)analysisMetrics=b.analysisMetrics;
    else if(b.analysisMetric)analysisMetrics=[b.analysisMetric];
    if(b.analysisDayFilter!=null)analysisDayFilter=b.analysisDayFilter;
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

