# Rework visual de 4WKS Analyzer con la paleta de KPI Metrics

> **Alcance de este documento: SOLO colores y tipografía.** No se tocan tamaños,
> espaciados, radios, anchos ni disposición (grid/flex/layout). Todo lo que hoy
> mide en px, todo lo que es `display`/`grid-template`/`gap`, se queda exactamente
> igual. Esto es una re-tinta + re-fuente, no un rediseño de estructura.

## Decisión tomada: eliminar el modo oscuro

4WKS Analyzer hoy es oscuro por defecto con un toggle a claro (`[data-theme="light"]`).
KPI Metrics **no tiene modo oscuro** — es una única paleta clara. Se decidió que
4WKS pase a **solo-claro**, con la misma paleta que KPI Metrics, para que ambas
herramientas se vean como parte de la misma familia visual.

Esto significa:
- El bloque `[data-theme="light"]{...}` (líneas 12-19 de `styles.css`) se convierte
  en el único `:root` (los valores de "dark" se sustituyen directamente).
- El interruptor de tema (`.theme-wrap` / `.theme-switch`, sidebar) deja de tener
  utilidad funcional. **Retirar el control en sí (HTML/JS) es un cambio de
  funcionalidad, no de color — queda fuera del alcance de este documento.**
  Nota para cuando se aborde: la lógica vive en `js/main.js` / donde se lea
  `data-theme` de `localStorage`; lo mínimo mientras no se retire el botón es que,
  al no existir ya paleta oscura, el toggle simplemente no tenga a dónde alternar
  (se puede ocultar con CSS como parche temporal, pero decidir su retirada real es
  tarea aparte).

## 1. Paleta de KPI Metrics (fuente de verdad)

Todos los valores siguientes están definidos en
[`css/styles.css:5-30`](../../KPIMetrics-Stores/css/styles.css) del repo
`KPIMetrics-Stores`.

| Token KPI Metrics | Valor | Uso |
|---|---|---|
| `--color-primary` | `#E4002B` | Rojo CeX — acento de marca, botones primarios, activos |
| `--color-primary-hover` / `--cex-red-dark` | `#B3001F` | Hover/pressed del rojo, degradados |
| `--color-primary-light` | `#fdecef` | Fondo suave del acento (tags, fila activa) |
| `--sidebar-bg` | `#1e293b` | Barra lateral (slate oscuro) |
| `--cex-ink` | `#16181d` | Tiles de icono negro |
| `--color-text` | `#1e293b` | Texto principal |
| `--color-text-light` | `#64748b` | Texto secundario/muted |
| `--color-text-lighter` | `#94a3b8` | Texto terciario/disabled |
| `--color-border` | `#e2e8f0` | Bordes |
| `--color-border-light` | `#f1f5f9` | Bordes sutiles / divisores |
| `--color-bg` | `#f1f5f9` | Fondo de chips/hovers/superficie secundaria (**no** el fondo de página) |
| `--color-surface` | `#ffffff` | Fondo de cards/paneles |
| Fondo de página (`body`) | `#ffffff` | Blanco puro, no `--color-bg` |
| `--color-success` | `#22c55e` | Estado positivo (badges/pills) |
| `--color-danger` | `#ef4444` | Estado negativo (badges/pills) |
| `--color-warning` | `#f59e0b` | Estado de aviso |
| Verde de tendencia (`rank-move.up`) | `#16a34a` | Flechas/movimiento positivo (más oscuro que success) |
| Rojo de tendencia (`rank-move.down`) | `#dc2626` | Flechas/movimiento negativo (más oscuro que danger) |
| Azul informativo (recurrente, sin token propio) | `#2563eb` | "Nuevo", serie B/alterna, iconos info, resaltados |
| Ámbar de tag "fix" (recurrente) | bg `#fef3c7` / texto `#b45309` | Par bg+texto ya usado para badges ámbar |
| `--radius` | `10px` | *(ya coincide con 4WKS, no requiere cambio)* |
| Fuente | `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` | Fuente del sistema, sin webfont |

## 2. Mapeo variable a variable en `styles.css` de 4WKS

El `:root` de 4WKS ya está muy bien tokenizado — casi todo el rework se reduce a
sustituir estos ~13 valores. Sustituye el bloque `:root{...}` (líneas 2-11) por
estos valores y **borra** el bloque `[data-theme="light"]{...}` (líneas 12-19)
al completo.

| Variable 4WKS | Valor actual (dark) | → Nuevo valor (paleta KPI) | Origen del valor |
|---|---|---|---|
| `--bg` | `#0f0f11` | `#ffffff` | Fondo de página de KPI Metrics (`body`) |
| `--sidebar` | `#131316` | `#1e293b` | `--sidebar-bg` |
| `--surface` | `#1a1a1f` | `#ffffff` | `--color-surface` |
| `--surface2` | `#222228` | `#f1f5f9` | `--color-bg` (chips/hover) |
| `--border` | `#2a2a32` | `#e2e8f0` | `--color-border` |
| `--text` | `#e8e8ec` | `#1e293b` | `--color-text` |
| `--muted` | `#64646e` | `#64748b` | `--color-text-light` |
| `--accent` | `#e8784a` | `#E4002B` | `--color-primary` |
| `--accent-dim` | `#3d2115` | `#fdecef` | `--color-primary-light` |
| `--accent-rgb` | `232,120,74` | `228,0,43` | RGB de `#E4002B` (usado en `js/semanal.js:145`, tinte de fila `rgba(var(--accent-rgb),…)`) |
| `--green` | `#4caf85` | `#16a34a` | Verde de tendencia de KPI (`rank-move.up`) — ver nota abajo |
| `--red` | `#e05c5c` | `#dc2626` | Rojo de tendencia de KPI (`rank-move.down`) — ver nota abajo |
| `--blue` | `#5b8dee` | `#2563eb` | Azul informativo recurrente de KPI |
| `--sat-bg` | `rgba(138,99,210,.12)` | *(ver nota "Fin de semana" abajo)* | Sin equivalente directo en KPI |
| `--sun-bg` | `rgba(91,141,238,.1)` | *(ver nota "Fin de semana" abajo)* | Sin equivalente directo en KPI |
| `--shadow` | `rgba(0,0,0,.4)` | `rgba(0,0,0,.08)` | Alpha de `--shadow-md` de KPI |
| `--font` | `'Sora',sans-serif` | `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` | Fuente de sistema de KPI |
| `--mono` | `'DM Mono',monospace` | *(ver nota "Fuente mono" abajo)* | KPI no tiene una fuente mono sistemática |

Recomendación adicional (no existe en 4WKS hoy, pero replica el comportamiento de
KPI): añadir un `--accent-hover: #B3001F` y usarlo en `.btn-primary:hover` en vez
del `opacity:.85` actual — es el mismo patrón que `--color-primary-hover` en KPI
(`css/styles.css:1791`).

**Nota — por qué `--green`/`--red` no son `--color-success`/`--color-danger`:**
KPI Metrics en realidad usa **dos tonos** de verde y de rojo según el contexto:
un verde/rojo "estado" más vivo (`#22c55e` / `#ef4444`, para pills y badges de
estado) y un verde/rojo "tendencia" más oscuro (`#16a34a` / `#dc2626`, para
flechas de movimiento en rankings). El uso de `--green`/`--red` en 4WKS
(`.trend.up/.down`, `.chg.up/.down`, flechas, barras de distribución) se parece
mucho más al caso "tendencia" que al caso "estado", así que esa es la
recomendación por defecto. Si al verlo en pantalla se prefiere el verde/rojo más
vivo (`#22c55e`/`#ef4444`), es un cambio de una sola línea.

## 3. Colores sueltos (no son variables) que hay que retocar a mano

Estos valores están escritos como literales `rgba(...)` o hex directamente en
`styles.css`, normalmente porque son una versión con alpha de `--green`/`--red`/
`--blue`. Al cambiar esas tres variables, estos literales quedan **desincronizados**
y hay que actualizarlos a mano (buscar y sustituir el triplete RGB):

| Línea(s) | Selector | Valor actual | Nuevo valor (RGB de arriba) |
|---|---|---|---|
| 79, 101, 190, 206, 212, 464 | `.badge.loaded`, `.drop-zone.has-file`, `.pill`, `.trend.up`, `.rank-badge.top3`, `.kpi-delta.green` | `rgba(76,175,133,·)` | `rgba(22,163,74,·)` *(RGB de `#16a34a`)* |
| 207, 465 | `.trend.down`, `.kpi-delta.red` | `rgba(224,92,92,·)` | `rgba(220,38,38,·)` *(RGB de `#dc2626`)* |
| 209, 213, 283 | `.trend.new`, `.rank-badge.top10`, `.wks-result-tag` | `rgba(91,141,238,·)` | `rgba(37,99,235,·)` *(RGB de `#2563eb`)* |
| 211 | `.rank-badge.top1` | bg `rgba(255,215,0,.2)` / color `#b8860b` (dorado, sin equivalente en KPI) | bg `#fef3c7` / color `#b45309` *(el par ámbar que ya usa KPI para su tag "fix", `css/styles.css:355-358`)* |
| 447 | `.chart-svg .bar.sat` | `#8a63d2` (morado) | Sin equivalente directo. Opciones: reusar el morado que ya existe en KPI para la barra de cobertura Ecom (`#8b5cf6`, `css/styles.css:830`), o neutralizar a un gris de la propia paleta. Decisión de gusto, no hay una respuesta "correcta" desde KPI. |
| 448, 451-456, 460-461, 470-471, 474-475 | `.bar.sun`, `.bar-b`, `.mean-b`, `.kpi-val-b`, `.dot-b`, `.tt-dot-b` | usan `var(--blue)` | Sin cambio de código — heredan automáticamente el nuevo `--blue` |

**Nota — franjas de fin de semana (`--sat-bg` / `--sun-bg`):** KPI Metrics no
distingue sábados/domingos en ninguna tabla, así que no hay un valor de
referencia que copiar. Dos opciones razonables, a elegir por gusto:
1. **Neutralizar**: un solo tinte gris para ambos días, p. ej.
   `rgba(30,41,59,.04)` (a partir de `--color-text`), perdiendo la distinción
   sábado/domingo.
2. **Reusar el azul info**: `--sun-bg: rgba(37,99,235,.06)` y para sábado un
   tinte del rojo de marca muy diluido, `rgba(228,0,43,.05)` — mantiene dos tonos
   distinguibles sin inventar un color que no esté en la paleta KPI.

## 4. Fuente (tipografía)

KPI Metrics no usa una fuente web (Google Fonts): usa la pila de fuentes del
sistema operativo. 4WKS hoy carga **Sora** y **DM Mono** desde Google Fonts
(`index.html:7-8`). Para replicar el aspecto de KPI Metrics:

1. **`--font`** → `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
   (la pila exacta de `css/styles.css:41` de KPI Metrics).
2. **Quitar el `<link>` a Google Fonts** en `index.html:7-8` — ya no hace falta
   descargar Sora/DM Mono. *(Esto es un cambio en `index.html`, no en
   `styles.css`, pero va de la mano del cambio de fuente y no tiene sentido
   dejarlo cargando un webfont que ya no se usa.)*
3. **`--mono`** — aquí hay una decisión real, con dos caminos:
   - **Opción A (fiel a KPI, recomendada):** KPI Metrics no tiene una fuente
     mono sistemática — de hecho en toda la app solo aparece una vez
     (`.covd-src.store`, `css/styles.css:1006`, para códigos de tienda). Para
     alinear números en columnas (que es para lo que 4WKS usa `--mono` en
     decenas de sitios: `.rank-num`, `.stat-val`, `.wk-label`, celdas de tabla…),
     KPI Metrics usa **`font-variant-numeric: tabular-nums`** sobre la misma
     fuente del sistema (ver `.app-loading-pct`, `css/styles.css:948`), no una
     familia tipográfica distinta. Replicar esto de verdad significa: `--mono`
     pasa a ser el mismo valor que `--font`, y se añade `font-variant-numeric:
     tabular-nums` a las reglas que hoy usan `var(--mono)` para alinear cifras.
     Es fiel al resultado visual de KPI, pero toca más líneas (todas las reglas
     que hoy declaran `font-family:var(--mono)`).
   - **Opción B (conservadora, un solo valor):** dejar `--mono` como una pila
     mono neutra del sistema, `'Courier New', ui-monospace, monospace` (la
     misma pila que usa KPI en su único caso), sin tocar cada regla
     individualmente. Menos fiel al "todo es una sola fuente" de KPI, pero es
     un cambio de una línea.

   Dado que el encargo es "solo colores y fuentes" y no pide tocar decenas de
   reglas, mi recomendación práctica es empezar por la **Opción B** ahora
   (cambio mínimo) y valorar la Opción A como un pase de pulido aparte si al
   verlo en pantalla los números en mono neutro siguen sin casar con el resto.

## 5. Checklist de aplicación

- [ ] Sustituir el `:root{...}` de `styles.css` (líneas 2-11) por la tabla de la
      sección 2.
- [ ] Borrar el bloque `[data-theme="light"]{...}` (líneas 12-19).
- [ ] Actualizar los 6 grupos de literales `rgba(...)`/hex de la sección 3.
- [ ] Decidir y aplicar la opción de `.bar.sat` (morado) y de `--sat-bg`/`--sun-bg`.
- [ ] Cambiar `--font` y decidir Opción A/B para `--mono`.
- [ ] Quitar el `<link>` de Google Fonts en `index.html` (si se retira el webfont).
- [ ] Revisar visualmente el toggle de tema en la sidebar (queda inerte hasta que
      se decida su retirada, fuera de alcance de este documento).
