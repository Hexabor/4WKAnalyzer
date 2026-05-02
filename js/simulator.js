// ══════════════════════════════════════════════════════
//  SIMULATOR
// ══════════════════════════════════════════════════════
function parseToday(text){
  const map={};let count=0;
  for(const line of text.trim().split('\n')){
    if(!line.trim())continue;const cols=line.split('\t');if(cols.length<5)continue;
    const store=(cols[1]||'').trim();if(!store)continue;
    const sales=pN(cols[3]),buys=pN(cols[4]);
    const cashBuys=pN(cols[5]??0),exchBuys=pN(cols[6]??0);
    const refunds=pN(cols[7]??0),members=pN(cols[8]??0);
    map[store]={vc:sales+buys,sales,buys,cashBuys,exchBuys,refunds,members};count++;
  }
  return{map,count};
}
function calculate(){
  const list=BASE.map(s=>({...s}));
  for(const s of list){
    const t=todayMap[s.store];
    s.hasToday=!!t;
    s.todayVC     =t?(t.vc||0):0;
    s.todaySales  =t?(t.sales||0):0;
    s.todayBuys   =t?(t.buys||0):0;
    s.todayExch   =t?(t.exchBuys||0):0;
    s.todayRefunds=t?(t.refunds||0):0;
    s.todayMembers=t?(t.members||0):0;
    s.projVC     =(s.vc      ||0)+s.todayVC;
    s.projSales  =(s.sales   ||0)+s.todaySales;
    s.projBuys   =(s.buys    ||0)+s.todayBuys;
    s.projExch   =(s.exchBuys||0)+s.todayExch;
    s.projRefunds=(s.refunds ||0)+s.todayRefunds;
    s.projMembers=(s.members ||0)+s.todayMembers;
  }
  // newR siempre se calcula por projVC (es la posición proyectada del ranking)
  const byVC=[...list].sort((a,b)=>b.projVC-a.projVC);
  byVC.forEach((s,i)=>s.newR=i+1);
  return list;
}
function renderBanner(td,name){
  const banner=document.getElementById('banner');
  if(!td){banner.classList.remove('visible');return;}
  banner.classList.add('visible');
  const delta=(td.r??td.newR)-td.newR;let ch,cc;
  if(delta>0){ch=`↑${delta}`;cc='up';}else if(delta<0){ch=`↓${Math.abs(delta)}`;cc='down';}else{ch='=';cc='same';}
  document.getElementById('bLabel').textContent=`Posición proyectada · ${name}`;
  document.getElementById('bPos').textContent=`#${td.newR}`;
  document.getElementById('bVc').textContent=`V+C proyectado: ${fmt(td.projVC)}`;
  document.getElementById('bToday').textContent=td.hasToday?`Aportación de hoy: +${fmt(td.todayVC)}`:'🔴 festivo — sin ventas hoy';
  const bch=document.getElementById('bChange');bch.textContent=ch;bch.className=`banner-change-val ${cc}`;
  document.getElementById('bFrom').textContent=td.r?`antes #${td.r}`:'tienda nueva';
}
function applySimSortHeaders(){
  const cols=['projVC','todayVC','projSales','projBuys','projExch','projRefunds','projMembers'];
  cols.forEach(c=>{
    const th=document.querySelector(`[data-simcol="${c}"]`);
    const arr=document.getElementById(`simArr-${c}`);
    if(!th||!arr)return;
    if(c===simSortCol){th.classList.add('sort-active');arr.style.opacity='1';arr.textContent=simSortDir===-1?'▼':'▲';}
    else{th.classList.remove('sort-active');arr.style.opacity='0';arr.textContent='';}
  });
}
function sortSim(col){
  if(simSortCol===col)simSortDir*=-1;
  else{simSortCol=col;simSortDir=-1;}
  recalc();
}
function renderSimTable(list,targetName,targetVC){
  const tbody=document.getElementById('rankingBody');tbody.innerHTML='';
  const maxDist=Math.max(...list.map(s=>Math.abs(s.projVC-targetVC)))||1;
  document.getElementById('distHeader').textContent=`Dist. ${targetName.split(' ').slice(-1)[0]}`;
  applySimSortHeaders();
  const sorted=[...list].sort((a,b)=>((a[simSortCol]||0)-(b[simSortCol]||0))*simSortDir);
  for(const s of sorted){
    const isTgt=s.store===targetName;
    const delta=(s.r??s.newR)-s.newR;let ct,cc;
    if(delta>0){ct=`↑${delta}`;cc='up';}else if(delta<0){ct=`↓${Math.abs(delta)}`;cc='down';}else{ct='—';cc='same';}
    const tc=s.hasToday?`<span class="pill">+${fmt(s.todayVC)}</span>`:`<span class="pill pill-zero">🔴 festivo</span>`;
    let dist;
    if(isTgt){dist=`<span class="dist-val self">— tú —</span>`;}
    else{const diff=targetVC-s.projVC,pct=Math.min(100,Math.round(Math.abs(diff)/maxDist*100));const cls=diff<0?'above':'below',sign=diff<0?`−${fmt(Math.abs(diff))}`:`+${fmt(diff)}`;dist=`<div class="dist-wrap"><div class="dist-bar-track"><div class="dist-bar-fill ${cls}" style="width:${pct}%"></div></div><span class="dist-val ${cls}">${sign}</span></div>`;}
    const tr=document.createElement('tr');if(isTgt)tr.className='target';
    tr.innerHTML=`<td><span class="rank-num">${s.newR}</span></td>`+
      `<td><span class="chg ${cc}">${ct}</span></td>`+
      `<td><span class="store-name${isTgt?' target-name':''}">${s.store}</span></td>`+
      `<td class="r"><span class="stat-val vc">${fmt(s.projVC)}</span></td>`+
      `<td class="r">${tc}</td>`+
      `<td class="r"><span class="stat-val">${fmt(s.projSales)}</span></td>`+
      `<td class="r"><span class="stat-val">${fmt(s.projBuys)}</span></td>`+
      `<td class="r"><span class="stat-val">${s.projExch?fmt(s.projExch):'—'}</span></td>`+
      `<td class="r"><span class="stat-val">${fmt(s.projRefunds)}</span></td>`+
      `<td class="r"><span class="stat-val">${fmtN(s.projMembers)}</span></td>`+
      `<td style="min-width:150px">${dist}</td>`;
    tbody.appendChild(tr);
  }
}
function recalc(){
  const sel=document.getElementById('targetStore');
  if(!BASE.length){document.getElementById('banner').classList.remove('visible');document.getElementById('tableCard').classList.remove('visible');return;}
  const name=sel.value,list=calculate(),td=list.find(s=>s.store===name);
  renderBanner(td,name);renderSimTable(list,name,td?td.projVC:0);
  document.getElementById('tableCard').classList.add('visible');
  setTimeout(()=>{const r=document.querySelector('#tableCard tr.target');if(r)r.scrollIntoView({behavior:'smooth',block:'nearest'});},100);
}
function syncSimulator(){
  const{ranking}=compute4WKS();
  const baseInfo=document.getElementById('simBaseInfo');
  if(!ranking.length){
    BASE=[];
    if(baseInfo)baseInfo.style.display='none';
    ssSetOptions('targetStore',[]);ssSetValue('targetStore','',false);
    document.getElementById('banner').classList.remove('visible');document.getElementById('tableCard').classList.remove('visible');
    return;
  }
  BASE=ranking.map((s,i)=>({r:i+1,store:s.store,vc:s.vc,sales:s.sales,buys:s.buys,exchBuys:s.exchBuys||0,refunds:s.refunds,members:s.members}));
  const prev=document.getElementById('targetStore').value;
  const options=BASE.map(s=>({value:s.store,label:`#${s.r} · ${s.store}`}));
  ssSetOptions('targetStore',options);
  const newVal=BASE.some(s=>s.store===prev)?prev:(BASE.some(s=>s.store==='Madrid Islazul')?'Madrid Islazul':BASE[0].store);
  ssSetValue('targetStore',newVal,false);
  const last4=getSelected4Weeks();
  if(last4.length&&baseInfo){
    const a=weekTag(last4[0]),b=weekTag(last4[last4.length-1]);
    const wkText=last4.length===1?a:`${a} → ${b}`;
    const modeText={consolidated:'4 últimas consolidadas',current:'Incl. semana actual',custom:'Personalizada'}[updMode]||'—';
    const dateText=`${fmtDate(last4[0])} → ${fmtDate(weekEnd(last4[last4.length-1]))}`;
    document.getElementById('simBaseMode').textContent=modeText;
    document.getElementById('simBaseWeeks').textContent=wkText;
    document.getElementById('simBaseDates').textContent=dateText;
    baseInfo.style.display='';
  }
  recalc();
}
function onTodayInput(){
  const text=document.getElementById('todayInput').value;
  if(!text.trim()){todayMap={};resetTodayUI();recalc();return;}
  const{map,count}=parseToday(text);todayMap=map;
  const matched=Object.keys(map).filter(k=>BASE.some(b=>b.store===k)).length;
  document.getElementById('statusToday').textContent=`✓ ${count} tiendas · ${matched} coinciden`;document.getElementById('statusToday').className='status-text ok';
  document.getElementById('badgeToday').textContent=`${count} tiendas`;document.getElementById('badgeToday').className='badge loaded';
  recalc();
}
function resetTodayUI(){document.getElementById('statusToday').textContent='Pega el ranking del día (sin cabecera)';document.getElementById('statusToday').className='status-text';document.getElementById('badgeToday').textContent='Sin datos';document.getElementById('badgeToday').className='badge';}
function resetToday(){document.getElementById('todayInput').value='';todayMap={};resetTodayUI();recalc();}

