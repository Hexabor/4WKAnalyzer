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
