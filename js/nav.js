// ══════════════════════════════════════════════════════
//  NAV / THEME / TOAST
// ══════════════════════════════════════════════════════
function navigate(el){
  const target=el.dataset.panel;
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  const nb=document.querySelector(`.nav-item[data-panel="${target}"]`);
  const pb=document.getElementById(`panel-${target}`);
  if(nb)nb.classList.add('active');if(pb)pb.classList.add('active');
  if(target==='weekly')renderWeekly();
  if(target==='diario')renderDiario();
  if(target==='analysis')renderAnalysis();
  if(target==='simulator')syncSimulator();
  if(target==='settings')renderSettingsNote();
}
function toggleTheme(){const h=document.documentElement;h.dataset.theme=h.dataset.theme==='dark'?'light':'dark';}
function toggleChangelog(){document.getElementById('changelogOverlay').classList.toggle('visible');}
function toast(msg,type=''){
  const el=document.getElementById('toast');el.textContent=msg;el.className=`toast ${type} show`;
  clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('show'),2800);
}

