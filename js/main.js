// ══════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════
setDP('updDayDate',new Date().toISOString().slice(0,10),false);
setDP('settingsCexStart',cexYearStart,false);
renderSettingsNote();
rebuildWeekSelect();
rebuildDiarioStore();
rebuildAnalysisStore();
renderAnalysisPresets();
restoreState();
