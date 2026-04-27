// ══════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════
setDP('settingsCexStart',cexYearStart,false);
renderChangelog();
renderSettingsNote();
rebuildWeekSelect();
rebuildDiarioStore();
rebuildSemanalStore();
rebuildAnalysisStore();
renderAnalysisPresets();
restoreState();
suggestNextUpdDate();

document.addEventListener('click',e=>{
  document.querySelectorAll('details.paste-help[open]').forEach(d=>{if(!d.contains(e.target))d.removeAttribute('open');});
});
