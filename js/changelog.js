// ══════════════════════════════════════════════════════
//  CHANGELOG
//  Se actualiza a cada cierre de sesión con novedades y fixes.
// ══════════════════════════════════════════════════════
const APP_VERSION='α 0.11';

const CHANGELOG=[
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
