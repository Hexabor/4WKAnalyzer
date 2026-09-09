// ══════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════
setDP('settingsCexStart',cexYearStart,false);
renderChangelog();
renderSettingsNote();
rebuildWeekSelect();
rebuildDiarioStore();
rebuildSemanalStore();
rebuildDailyStore();
rebuildWeeklyStore();
rebuildAnalysisStore();
renderAnalysisPresets();
restoreState();
suggestNextUpdDate();

document.addEventListener('click',e=>{
  document.querySelectorAll('details.paste-help[open], details.diario-group[open]').forEach(d=>{if(!d.contains(e.target))d.removeAttribute('open');});
});
