// ══════════════════════════════════════════════════════
//  SIMULATOR
// ══════════════════════════════════════════════════════
function parseToday(text){
  const map={};let count=0;
  for(const line of text.trim().split('\n')){
    if(!line.trim())continue;const cols=line.split('\t');if(cols.length<5)continue;
    const store=(cols[1]||'').trim();if(!store)continue;
    map[store]={vc:pN(cols[3])+pN(cols[4])};count++;
  }
  return{map,count};
}
function calculate(){
  const list=BASE.map(s=>({...s}));
  for(const s of list){const t=todayMap[s.store];s.todayVC=t?t.vc:0;s.projVC=s.vc+s.todayVC;s.hasToday=!!t;}
  list.sort((a,b)=>b.projVC-a.projVC);list.forEach((s,i)=>s.newR=i+1);return list;
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
function renderSimTable(list,targetName,targetVC){
  const tbody=document.getElementById('rankingBody');tbody.innerHTML='';
  const maxDist=Math.max(...list.map(s=>Math.abs(s.projVC-targetVC)))||1;
  document.getElementById('distHeader').textContent=`Dist. ${targetName.split(' ').slice(-1)[0]}`;
  for(const s of list){
    const isTgt=s.store===targetName;
    const delta=(s.r??s.newR)-s.newR;let ct,cc;
    if(delta>0){ct=`↑${delta}`;cc='up';}else if(delta<0){ct=`↓${Math.abs(delta)}`;cc='down';}else{ct='—';cc='same';}
    const tc=s.hasToday?`<span class="pill">+${fmt(s.todayVC)}</span>`:`<span class="pill pill-zero">🔴 festivo</span>`;
    let dist;
    if(isTgt){dist=`<span class="dist-val self">— tú —</span>`;}
    else{const diff=targetVC-s.projVC,pct=Math.min(100,Math.round(Math.abs(diff)/maxDist*100));const cls=diff<0?'above':'below',sign=diff<0?`−${fmt(Math.abs(diff))}`:`+${fmt(diff)}`;dist=`<div class="dist-wrap"><div class="dist-bar-track"><div class="dist-bar-fill ${cls}" style="width:${pct}%"></div></div><span class="dist-val ${cls}">${sign}</span></div>`;}
    const tr=document.createElement('tr');if(isTgt)tr.className='target';
    tr.innerHTML=`<td><span class="rank-num">${s.newR}</span></td><td><span class="chg ${cc}">${ct}</span></td><td><span class="store-name${isTgt?' target-name':''}">${s.store}</span></td><td class="r">${fmt(s.projVC)}</td><td class="r">${tc}</td><td style="min-width:150px">${dist}</td>`;
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
  if(!ranking.length){
    BASE=[];
    document.getElementById('badge4w').textContent='Sin base';document.getElementById('badge4w').className='badge';
    ssSetOptions('targetStore',[]);ssSetValue('targetStore','',false);
    document.getElementById('banner').classList.remove('visible');document.getElementById('tableCard').classList.remove('visible');
    return;
  }
  BASE=ranking.map((s,i)=>({r:i+1,store:s.store,vc:s.vc}));
  const prev=document.getElementById('targetStore').value;
  const options=BASE.map(s=>({value:s.store,label:`#${s.r} · ${s.store}`}));
  ssSetOptions('targetStore',options);
  const newVal=BASE.some(s=>s.store===prev)?prev:(BASE.some(s=>s.store==='Madrid Islazul')?'Madrid Islazul':BASE[0].store);
  ssSetValue('targetStore',newVal,false);
  const last4=getSelected4Weeks();
  if(last4.length){const a=weekTag(last4[0]),b=weekTag(last4[last4.length-1]);document.getElementById('badge4w').textContent=last4.length===1?a:`${b}–${a}`;document.getElementById('badge4w').className='badge loaded';}
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

