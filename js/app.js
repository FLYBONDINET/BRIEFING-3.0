/* App UI — Arribos & Salidas (JSONP) */

const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const tblArribos   = $("#tblArribos");
const tblSalidas   = $("#tblSalidas");
const tblHistorial = $("#tblHistorial");

const btnRefresh   = $("#btnRefresh");
const searchInput  = $("#searchInput");

const tabs         = $$(".tab");
const cardArribos  = $("#cardArribos");
const cardSalidas  = $("#cardSalidas");
const cardHistorial= $("#cardHistorial");

let CURRENT_DATA = [];

/* ===== ARRIBOS ===== */
function prepareTableArribos(table){
  table.innerHTML =
    '<colgroup>'
  + '<col><col><col><col><col>'
  + '</colgroup><thead></thead><tbody></tbody>';
}
function buildHeadArribos(table){
  table.querySelector("thead").innerHTML = `
    <tr>
      <th>Matrícula</th>
      <th>Vuelo</th>
      <th>POS/CINTA</th>
      <th class="estado-vuelo">Estado de vuelo</th>
      <th>ETA TAMS</th>
    </tr>`;
}
function badgeEstadoArribo(v){
  const t = String(v||'').trim().toUpperCase();
  let cls = '', icon = '';
  if (t === 'ATERRIZADO')       { cls = 'aterrizado'; icon = '🛬'; }
  else if (t === 'EN VUELO')    { cls = 'en-vuelo';   icon = '🛫'; }
  else if (t === 'EN TIERRA')   { cls = 'en-tierra';  icon = '✈️<span class="ground">▬</span>'; }
  return `<span class="badge ${cls}">${icon} ${v||''}</span>`;
}
function vueloCellArribo(r){
  const vu  = r['Vuelo']  || '';
  const org = r['Origen'] || '';
  const eta = r['ETA']    || '';

  const raw = String((r['Puntualidad'] ?? r['Y'] ?? '')).trim();
  const t = raw.toUpperCase();
  let cls = '';
  if (t === 'EN HORARIO') cls = 'ontime';
  else if (t.startsWith('DEMORADO')) cls = 'delayed';
  else if (t === 'ADELANTADO' || t.startsWith('ADELANTADO')) cls = 'early';

  const punctHtml = raw ? `<div class="vuelo-punct ${cls}">${raw}</div>` : '';

  return `
    <div class="vuelo-top">${vu} ${org}</div>
    <div class="vuelo-eta">${eta}</div>
    ${punctHtml}
  `;
}
function rowHtmlArribo(r){
  const micros = String(r['Micros']||'').toUpperCase().includes('MICRO');
  return `<tr>
    <td><strong>${r['Matrícula']||''}</strong></td>
    <td class="flight-cell ${micros ? 'micro-cell' : ''}">${vueloCellArribo(r)}</td>
    <td>${r['POS/CINTA']||''}</td>
    <td class="estado-vuelo">${badgeEstadoArribo(r['Estado de vuelo'])}</td>
    <td>${r['ETA TAMS']||''}</td>
  </tr>`;
}

/* ===== SALIDAS ===== */
function prepareTableSalidas(table){
  table.innerHTML =
    '<colgroup>'
  + '<col><col><col><col><col><col><col><col><col>'
  + '</colgroup><thead></thead><tbody></tbody>';
}
function buildHeadSalidas(table){
  table.querySelector("thead").innerHTML = `
    <tr>
      <th>Matrícula</th>
      <th>Vuelo</th>
      <th>Apertura</th>
      <th>Cierre</th>
      <th>POS/PUERTA</th>
      <th class="estado-vuelo">Estado de vuelo</th>
      <th class="combu">COMBU</th>
      <th class="bingo">BINGO</th>
      <th class="delay">Informe de DELAY</th>
    </tr>`;
}
function badgeEstadoSalida(v){
  const t = String(v||'').trim().toUpperCase();
  let cls = '', icon = '';
  if (t === 'EN VUELO')      { cls = 'en-vuelo';   icon = '🛫'; }
  else if (t === 'EN TIERRA'){ cls = 'en-tierra';  icon = '✈️<span class="ground">▬</span>'; }
  else if (t === 'ATERRIZADO'){cls = 'aterrizado'; icon = '🛬'; }
  return `<span class="badge ${cls}">${icon} ${v||''}</span>`;
}
function badgeOkNoOk(v){
  const t = String(v||'').trim().toUpperCase();
  let cls = '';
  if (t === 'OK') cls = 'ok';
  else if (t === 'NO OK') cls = 'no-ok';
  return `<span class="badge ${cls}">${v||''}</span>`;
}
function badgeDelay(v){
  const t = String(v||'').trim().toUpperCase();
  let cls = '';
  if (t.includes('ON TIME') || t.includes('PENDIENTE')) cls = 'delay-warn';
  else if (t.includes('CARGADO')) cls = 'delay-ok';
  return `<span class="badge ${cls}">${v||''}</span>`;
}

// ✅ Aquí agregamos la tercera línea con puntualidad (col Z via "PuntualidadSalida")
function vueloCellSalida(r){
  const vu   = r['Vuelo']   || '';
  const dest = r['Destino'] || '';
  const etd  = r['ETD']     || '';

  const raw = String((r['PuntualidadSalida'] ?? r['Z'] ?? '')).trim();
  const t = raw.toUpperCase();
  let cls = '';
  if (t === 'EN HORARIO') cls = 'ontime';
  else if (t.startsWith('DEMORADO')) cls = 'delayed';
  else if (t === 'ADELANTADO' || t.startsWith('ADELANTADO')) cls = 'early';

  const punctHtml = raw ? `<div class="vuelo-punct ${cls}">${raw}</div>` : '';

  return `
    <div class="vuelo-top">${vu} ${dest}</div>
    <div class="vuelo-eta">${etd}</div>
    ${punctHtml}
  `;
}

function rowHtmlSalida(r){
  return `<tr>
    <td><strong>${r['Matrícula']||''}</strong></td>
    <td class="flight-cell">${vueloCellSalida(r)}</td>
    <td>${r['Apertura']||''}</td>
    <td>${r['Cierre']||''}</td>
    <td>${r['POS/PUERTA']||''}</td>
    <td class="estado-vuelo">${badgeEstadoSalida(r['Estado de vuelo'])}</td>
    <td class="combu">${badgeOkNoOk(r['COMBU'])}</td>
    <td class="bingo">${badgeOkNoOk(r['BINGO'])}</td>
    <td class="delay">${badgeDelay(r['Informe de DELAY'])}</td>
  </tr>`;
}

/* ===== Render & Search ===== */
function renderAll(data){
  const arr = data.filter(d => (d['Tipo']||'').toLowerCase() === 'arribo');
  const sal = data.filter(d => (d['Tipo']||'').toLowerCase() === 'salida');

  prepareTableArribos(tblArribos);
  buildHeadArribos(tblArribos);
  tblArribos.querySelector("tbody").innerHTML = arr.map(rowHtmlArribo).join("");

  prepareTableSalidas(tblSalidas);
  buildHeadSalidas(tblSalidas);
  tblSalidas.querySelector("tbody").innerHTML = sal.map(rowHtmlSalida).join("");

  // Historial con layout actual
  tblHistorial.querySelector("thead").innerHTML = tblSalidas.querySelector("thead").innerHTML;
  tblHistorial.querySelector("tbody").innerHTML = data.map(r =>
    (r['Tipo']||'').toLowerCase() === 'salida' ? rowHtmlSalida(r) : rowHtmlArribo(r)
  ).join("");
}

// JSONP hook
window.__loadFromJSONP = (rows)=>{
  CURRENT_DATA = Array.isArray(rows) ? rows : [];
  renderAll(CURRENT_DATA);
};

// UI
btnRefresh?.addEventListener("click", ()=> renderAll(CURRENT_DATA));

if (searchInput){
  searchInput.addEventListener("input", () => {
    const q = searchInput.value.trim().toLowerCase();
    const filtered = CURRENT_DATA.filter(r =>
      String(r['Vuelo']||'').toLowerCase().includes(q) ||
      String(r['Matrícula']||'').toLowerCase().includes(q) ||
      String(r['Origen']||'').toLowerCase().includes(q) ||
      String(r['Destino']||'').toLowerCase().includes(q)
    );
    tblHistorial.querySelector("tbody").innerHTML = filtered.map(r =>
      (r['Tipo']||'').toLowerCase() === 'salida' ? rowHtmlSalida(r) : rowHtmlArribo(r)
    ).join("");
  });
}

tabs.forEach(t => t.addEventListener("click", () => {
  tabs.forEach(x=>x.classList.remove("active"));
  t.classList.add("active");
  const tab = t.dataset.tab;
  cardArribos.style.display   = tab==="arribos"   ? "" : "none";
  cardSalidas.style.display   = tab==="salidas"   ? "" : "none";
  cardHistorial.style.display = tab==="historial" ? "" : "none";
}));

if (Array.isArray(window.__GAS_ROWS__) && window.__GAS_ROWS__.length) {
  window.__loadFromJSONP(window.__GAS_ROWS__);
}