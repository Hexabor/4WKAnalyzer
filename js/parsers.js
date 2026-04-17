// ══════════════════════════════════════════════════════
//  PARSERS
// ══════════════════════════════════════════════════════
// CSV: WK,FECHA,DÍA,RANKING,TIENDA,COMPAÑÍA,NET SALES,BUYS,CASH BUYS,EXCH.BUYS,REFUNDS,MEMBERS,V+C
function parseRegistroCSV(text){
  const data={};let rows=0;const days=new Set(),stores=new Set();
  for(const line of text.trim().split('\n')){
    if(!line.trim()||line.startsWith('WK')||line.startsWith(','))continue;
    const cols=parseCSVLine(line);if(cols.length<13)continue;
    const fecha=(cols[1]||'').trim(),store=(cols[4]||'').trim();
    const ranking=parseInt(cols[3],10)||0;
    const day=(cols[2]||'').trim();
    const sales=pN(cols[6]),buys=pN(cols[7]),cashBuys=pN(cols[8]),exchBuys=pN(cols[9]);
    const refunds=pN(cols[10]),members=pN(cols[11]),vc=pN(cols[12]);
    if(!fecha||!store||vc===0)continue;
    const iso=ddmmyyyy(fecha);if(!iso)continue;
    if(!data[iso])data[iso]={};
    data[iso][store]={vc,sales,buys,cashBuys,exchBuys,members,refunds,ranking,day};
    stores.add(store);days.add(iso);rows++;
  }
  return{data,rows,days:days.size,stores:stores.size};
}

// Daily paste: rank, store, company, netSales, buys, cashBuys, exchBuys, refunds, members
function parseDayPaste(text){
  const map={};let count=0;
  for(const line of text.trim().split('\n')){
    if(!line.trim())continue;const cols=line.split('\t');if(cols.length<5)continue;
    const store=(cols[1]||'').trim();if(!store)continue;
    const ranking=parseInt(cols[0],10)||0;
    const sales=pN(cols[3]),buys=pN(cols[4]);
    const cashBuys=pN(cols[5]??0),exchBuys=pN(cols[6]??0);
    const refunds=pN(cols[7]??0),members=pN(cols[8]??0);
    map[store]={vc:sales+buys,sales,buys,cashBuys,exchBuys,members,refunds,ranking,day:''};count++;
  }
  return{map,count};
}

