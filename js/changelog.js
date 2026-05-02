// ══════════════════════════════════════════════════════
//  CHANGELOG
//  Se actualiza a cada cierre de sesión con novedades y fixes.
// ══════════════════════════════════════════════════════
const APP_VERSION='α 0.17';

const CHANGELOG=[
  {
    version:'v0.17', date:'02 may 2026',
    items:[
      {type:'new', text:'Simulador rápido amplía el ranking con 5 columnas de proyección — Net Sales, Buys, Exch., Refunds y Members (4WKS base + facturación de hoy), todas ordenables como V+C proy. y Hoy'},
      {type:'new', text:'Cabecera congelada en «Histórico días», «Histórico semanas», «Día a día», «Semana a semana» y «Simulador rápido» — al hacer scroll de la tabla los filtros, totales y títulos de columna permanecen visibles'},
      {type:'fix', text:'Columna HITOS de Histórico días ya no queda truncada — el panel se ensancha a 1400px y el campo se adapta al espacio disponible'},
      {type:'fix', text:'Simulador rápido se ensancha a 1320px para acomodar las nuevas columnas sin estrechar el resto'},
    ]
  },
  {
    version:'v0.16', date:'27 abr 2026',
    items:[
      {type:'new', text:'Checkbox «Sustituir día completo» en Incorporar día cerrado — al marcarlo borra todas las tiendas previas del día y las reemplaza por las nuevas en lugar de fusionar; pide confirmación mostrando contadores antiguo vs nuevo'},
      {type:'new', text:'Tooltip ⓘ junto a Incorporar día cerrado — popover con instrucciones, captura de ejemplo del portal CEX y botón «Copiar bookmarklet» que copia al portapapeles un script para pegarlo como marcador del navegador y automatizar la selección de la tabla del día'},
      {type:'new', text:'«Últimas incorporaciones» muestra ahora 6 días en vez de 3, con +20% de ancho (de 150px a 180px)'},
      {type:'new', text:'Modo 4WKS gana 40px de ancho a costa de la columna Incorporar día cerrado (260→220px), con el datepicker adaptado para no desbordar'},
      {type:'fix', text:'Tag del rango 4 semanas ahora muestra «WK más antigua – WK más reciente» en orden cronológico (antes invertido)'},
      {type:'fix', text:'Tooltip ⓘ se cierra al hacer click fuera (antes solo se cerraba pulsando de nuevo el icono)'},
    ]
  },
  {
    version:'v0.15', date:'27 abr 2026',
    items:[
      {type:'new', text:'Inspector flotante a la derecha — drawer deslizable que abre el botón «+ nuevo preset» en «Actualización 4WKS» con los controles de rango personalizado y selección de tiendas en un mismo sitio'},
      {type:'new', text:'Presets unificados (rango + tiendas) — un único preset agrupa ambos filtros y al aplicarlo se setean a la vez; los presets antiguos solo de rango o solo de tiendas se migran automáticamente al nuevo modelo'},
      {type:'new', text:'Dropdown custom para Desde/Hasta — cerrado muestra solo «WK01» para no enturbiar el diseño, abierto despliega el label completo con fechas «WK01 · Sáb DD/MM/AAAA → Vie DD/MM/AAAA»'},
      {type:'new', text:'Panel «Actualización 4WKS» reorganizado — header más bajo gracias a sacar los filtros al inspector; el grid vuelve a 3 columnas con Modo+presets ocupando el espacio principal, Incorporar día cerrado fija a 260px y Últimas incorporaciones compacta a 150px'},
    ]
  },
  {
    version:'v0.14', date:'27 abr 2026',
    items:[
      {type:'new', text:'Filtro de subconjuntos de tiendas en «Actualización 4WKS» — checkboxes por tienda, atajos «Todas»/«Ninguna», y selecciones guardables con nombre (p. ej. «Centros comerciales») para alternar de un click'},
      {type:'new', text:'Modo «Personalizada» con rango libre — antes 4 semanas fijas, ahora start + end independientes admitiendo cualquier tamaño (4, 13, 26… semanas) para clasificaciones por cuarter o anuales'},
      {type:'new', text:'Presets de rango — cualquier rango personalizado se guarda con nombre y aparece como pill bajo los modos estándar; el preset activo se resalta'},
      {type:'new', text:'Opción «Hasta la última» — ata el fin del rango a la semana más reciente disponible (rango «vivo»), de forma que se extiende solo al cargar nuevas semanas; los presets vivos se marcan con ↻'},
      {type:'new', text:'Navegación ◀▶ junto al badge de rango en «Actualización 4WKS» — desplaza la ventana actual una semana atrás/adelante manteniendo el tamaño'},
    ]
  },
  {
    version:'v0.13', date:'27 abr 2026',
    items:[
      {type:'new', text:'Nuevo módulo «Día a día» — tabla completa de un día con todas las tiendas, todas las métricas y distancia a tu tienda; navegación con flechas entre días con datos'},
      {type:'new', text:'Nuevo módulo «Patrón semanal» — heatmap por día de la semana CEX (sáb→vie) con barra superior de medias, ordenable por columna, opción de colorear semanas por recencia y un color propio por cada métrica'},
      {type:'new', text:'Home rediseñado en 4 secciones (4 semanas · Global · Tienda · Análisis) con tarjetas verticales más compactas al 80% del ancho'},
      {type:'new', text:'Sidebar reorganizada con separadores entre secciones e iconos reasignados a cada módulo (refresh, rayo, sol, lista numerada, línea, barras, lupa, heatmap)'},
      {type:'new', text:'Renombres: «Día completo» → «Día a día», «Ranking semanal» → «Semana a semana», «Diario de tienda» → «Histórico días», «Resumen semanal» → «Histórico semanas»'},
      {type:'new', text:'Topbar del Home compacta — días registrados y rango de fechas al lado del botón Novedades; eliminado el banner de bienvenida y el KPI card grande'},
      {type:'new', text:'V+C es ahora la primera columna métrica en «Histórico días» e «Histórico semanas» para mantener coherencia entre vistas'},
      {type:'fix', text:'Columna # de «Día a día» ya no muestra el ranking del CSV — ahora muestra la posición secuencial 1…N en el orden actual y solo se invierte al alternar asc/desc'},
    ]
  },
  {
    version:'v0.12', date:'26 abr 2026',
    items:[
      {type:'new', text:'Comparar misma tienda consigo misma en días distintos en «Análisis por rango» — segundo filtro de día independiente (Día A / Día B); si los días difieren, el gráfico empareja por semana (par apretado, semanas separadas con margen)'},
      {type:'new', text:'Tira «Base 4WKS» en el Simulador rápido — modo, semanas WK y rango de fechas siempre visibles bajo el título'},
      {type:'fix', text:'Columna # del ranking de Actualización 4WKS — ahora siempre muestra el rango 4WKS por V+C aunque ordenes por otra columna; antes era inconsistente con la columna Δ'},
      {type:'fix', text:'Nombre del mes movido al primer gráfico del Análisis por rango (antes solo aparecía bajo el último y se perdía al hacer scroll)'},
    ]
  },
  {
    version:'v0.11', date:'21 abr 2026',
    items:[
      {type:'new', text:'Módulo «Resumen semanal» — histórico de una tienda semana a semana con ranking semanal, V+C, totales y 4WKS rodante'},
      {type:'new', text:'Coloreado gradual del Resumen semanal por fecha, rank, V+C o 4WKS para detectar patrones al reordenar'},
      {type:'new', text:'Columna Δ en Actualización 4WKS — subida/bajada de puestos respecto al 4WKS previo, ordenable por mayores escaladas o caídas'},
      {type:'new', text:'Comparación de dos tiendas en «Análisis por rango» — barras dobles, KPIs con delta % y tooltip lado a lado'},
      {type:'new', text:'Toggle Día / Semana en «Análisis por rango» — agregación semanal con WKxx en el eje X y ranking semanal por V+C'},
      {type:'new', text:'Panel de Actualización 4WKS rediseñado en 3 columnas (modo 4WKS · incorporar día · últimas incorporaciones) con chips de stats testimoniales'},
      {type:'new', text:'Fecha autopropuesta al incorporar día — el selector se adelanta al siguiente día tras el último registrado'},
      {type:'new', text:'Home rediseñado — barra superior con Novedades y versión discreta, tarjeta de Resumen semanal añadida a los módulos'},
      {type:'new', text:'Ancho máximo responsivo — layout pensado para monitores verticales de tienda y pantallas horizontales'},
      {type:'new', text:'Cabeceras sticky en la tabla del ranking 4WKS al hacer scroll dentro del módulo'},
      {type:'new', text:'Changelog extraído a módulo JS — se actualiza sesión a sesión con novedades y fixes'},
      {type:'fix', text:'Primer click en cualquier columna ordenable ahora ordena de mayor a menor (antes invertido en Actualización 4WKS y Ranking semanal)'},
      {type:'fix', text:'Badge «Sin incorporar» reemplazado por indicadores más limpios y dot con pulso cuando procede'},
    ]
  },
  {
    version:'v0.10', date:'17 abr 2026',
    items:[
      {type:'new', text:'Módulo «Análisis por rango» — gráfica de barras de cualquier métrica para cualquier rango de fechas'},
      {type:'new', text:'Presets de rango personalizables (p. ej. «Navidad 2025»), guardar/aplicar/eliminar'},
      {type:'new', text:'Agregado «Todas las tiendas» para comparar totales del rango'},
      {type:'new', text:'KPIs del rango: total, media/día, mejor y peor día, desviación típica'},
      {type:'new', text:'Calendario propio en los selectores de fecha — siempre empieza en lunes y muestra DD/MM/AAAA'},
      {type:'new', text:'Etiquetas por barra con número de día y letra del día de la semana, separadores de mes y semana (lunes)'},
      {type:'new', text:'Selección múltiple de métricas — se apilan varias gráficas con ejes perfectamente alineados'},
      {type:'new', text:'Selectores de tienda con búsqueda por texto · flechas y Enter para navegar, Esc cancela'},
      {type:'new', text:'Valor sobre cada barra en formato compacto de miles (ej. 7.4K)'},
      {type:'new', text:'Número de día y letra del día de la semana ahora visibles en todas las gráficas apiladas, no solo en la inferior'},
    ]
  },
  {
    version:'v0.9', date:'11 abr 2026',
    items:[
      {type:'new', text:'Persistencia automática — los datos se guardan en el navegador, sin necesidad de cargar backup'},
      {type:'new', text:'Diario de tienda ordenable por cualquier columna (fecha desc. por defecto)'},
      {type:'new', text:'Filtro por día de la semana en el diario de tienda'},
      {type:'new', text:'Changelog accesible desde el botón «Novedades»'},
      {type:'fix', text:'Los días incorporados manualmente ahora muestran su día de la semana'},
      {type:'fix', text:'Flechas de navegación semanal corregidas'},
      {type:'fix', text:'KPIs del resumen del diario distribuidos uniformemente'},
    ]
  },
  {
    version:'v0.8', date:'Versión inicial',
    items:[
      {type:'new', text:'Actualización de 4WKS con registro diario CSV e incorporación manual de días'},
      {type:'new', text:'Diario de tienda con rodante 7 días y campo de hitos'},
      {type:'new', text:'Ranking semanal ordenable por columna'},
      {type:'new', text:'Simulador rápido con proyección de posición'},
      {type:'new', text:'Modo claro / oscuro'},
      {type:'new', text:'Backup y restauración manual (JSON)'},
    ]
  },
];

function renderChangelog(){
  const body=document.querySelector('.changelog-body');
  if(!body)return;
  body.innerHTML=CHANGELOG.map(v=>`
    <div class="cl-version">
      <span class="cl-tag">${v.version}</span><span class="cl-date">${v.date}</span>
      <ul class="cl-list">
        ${v.items.map(i=>`<li${i.type==='fix'?' class="fix"':''}><span class="cl-type ${i.type}">${i.type}</span>${i.text}</li>`).join('')}
      </ul>
    </div>
  `).join('');
  const vEl=document.getElementById('homeAppVersion');
  if(vEl)vEl.textContent=APP_VERSION;
}
