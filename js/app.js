/* App UI — Arribos & Salidas (JSONP)
   - ARRIBOS: A,C,D,B,F,I,G (+ Micros desde E) -> Matrícula, Vuelo, Origen, ETA, POS/CINTA, Estado de vuelo, ETA TAMS
   - SALIDAS: J,L,M,K,N,O,P,V,Q,R,S -> Matrícula, Vuelo, Destino, ETD, Apertura, Cierre, POS/PUERTA, Estado de vuelo, COMBU, BINGO, Informe de DELAY
*/

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

/* ===========================
   ARRIBOS
   =========================== */
function buildHeadArribos(table){
  table.querySelector("thead").innerHTML = `
    <tr>
      <th>Matrícula</th>
      <th>Vuelo</th>
      <th>Origen</th>
      <th>ETA</th>
      <th>POS/CINTA</th>
      <th>Estado de vuelo</th>
      <th>ETA TAMS</th>
    </tr>`;
}
function badgeEstadoArribo(v){
  const t = String(v||'').trim().toUpperCase();
  let cls = '';
  let icon = '';
  if (t === 'ATERRIZADO') { cls = 'aterrizado'; icon = '🛬'; }
  else if (t === 'EN VUELO') { cls = 'en-vuelo'; }
  else if (t === 'EN TIERRA') { cls = 'en-tierra'; icon = '✈️<span class="ground">▬</span>'; }
  else if (t === 'DESPEGADO') { cls = 'despegado'; icon = '🛫'; }
  return `<span class="badge ${cls}">${icon} ${v||''}</span>`;
}
function rowHtmlArribo(r){
  const micros = String(r['Micros']||'').toUpperCase().includes('MICRO');
  return `<tr>
    <td><strong>${r['Matrícula']||''}</strong></td>
    <td class="${micros ? 'micro-cell' : ''}">${r['Vuelo']||''}</td>
    <td>${r['Origen']||''}</td>
    <td>${r['ETA']||''}</td>
    <td>${r['POS/CINTA']||''}</td>
    <td>${badgeEstadoArribo(r['Estado de vuelo'])}</td>
    <td>${r['ETA TAMS']||''}</td>
  </tr>`;
}

/* ===========================
   SALIDAS
   =========================== */
function buildHeadSalidas(table){
  table.querySelector("thead").innerHTML = `
    <tr>
      <th>Matrícula</th>
      <th>Vuelo</th>
      <th>Destino</th>
      <th>ETD</th>
      <th>Apertura</th>
      <th>Cierre</th>
      <th>POS/PUERTA</th>
      <th>Estado de vuelo</th>
      <th>COMBU</th>
      <th>BINGO</th>
      <th>Informe de DELAY</th>
    </tr>`;
}
function badgeEstadoSalida(v){
  const t = String(v||'').trim().toUpperCase();
  let cls = '';
  let icon = '';
  if (t === 'EN VUELO') { cls = 'en-vuelo'; }
  else if (t === 'EN TIERRA') { cls = 'en-tierra'; icon = '✈️<span class="ground">▬</span>'; }
  else if (t === 'ATERRIZADO') { cls = 'aterrizado'; icon = '🛬'; }
  else if (t === 'EN VUELO') { cls = 'despegado'; icon = '🛫'; }
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
  if (t === 'ONTIME' || t === 'DELAY PENDIENTE') cls = 'delay-warn';
  else if (t === 'DELAY CARGADO') cls = 'delay-ok';
  return `<span class="badge ${cls}">${v||''}</span>`;
}
function rowHtmlSalida(r){
  // No hay "Micros" para Salidas (viene de E en Arribos)
  return `<tr>
    <td><strong>${r['Matrícula']||''}</strong></td>
    <td>${r['Vuelo']||''}</td>
    <td>${r['Destino']||''}</td>
    <td>${r['ETD']||''}</td>
    <td>${r['Apertura']||''}</td>
    <td>${r['Cierre']||''}</td>
    <td>${r['POS/PUERTA']||''}</td>
    <td>${badgeEstadoSalida(r['Estado de vuelo'])}</td>
    <td>${badgeOkNoOk(r['COMBU'])}</td>
    <td>${badgeOkNoOk(r['BINGO'])}</td>
    <td>${badgeDelay(r['Informe de DELAY'])}</td>
  </tr>`;
}

/* ===========================
   Render & Search
   =========================== */
function renderAll(data){
  const arr = data.filter(d => (d['Tipo']||'').toLowerCase() === 'arribo');
  const sal = data.filter(d => (d['Tipo']||'').toLowerCase() === 'salida');

  buildHeadArribos(tblArribos);
  tblArribos.querySelector("tbody").innerHTML = arr.map(rowHtmlArribo).join("");

  buildHeadSalidas(tblSalidas);
  tblSalidas.querySelector("tbody").innerHTML = sal.map(rowHtmlSalida).join("");

  // Historial: muestro todo con la estructura de Salidas salvo el campo “Vuelo” que, si trae Micros, lo pinto
  tblHistorial.querySelector("thead").innerHTML = tblSalidas.querySelector("thead").innerHTML;
  tblHistorial.querySelector("tbody").innerHTML = data.map(r => {
    const micros = String(r['Micros']||'').toUpperCase().includes('MICRO');
    const vueloCell = `<td class="${micros ? 'micro-cell' : ''}">${r['Vuelo']||''}</td>`;
    if ((r['Tipo']||'').toLowerCase() === 'salida') {
      return `<tr>
        <td><strong>${r['Matrícula']||''}</strong></td>
        ${vueloCell}
        <td>${r['Destino']||''}</td>
        <td>${r['ETD']||''}</td>
        <td>${r['Apertura']||''}</td>
        <td>${r['Cierre']||''}</td>
        <td>${r['POS/PUERTA']||''}</td>
        <td>${badgeEstadoSalida(r['Estado de vuelo'])}</td>
        <td>${badgeOkNoOk(r['COMBU'])}</td>
        <td>${badgeOkNoOk(r['BINGO'])}</td>
        <td>${badgeDelay(r['Informe de DELAY'])}</td>
      </tr>`;
    } else {
      return `<tr>
        <td><strong>${r['Matrícula']||''}</strong></td>
        ${vueloCell}
        <td>${r['Origen']||''}</td>
        <td>${r['ETA']||''}</td>
        <td>${r['POS/CINTA']||''}</td>
        <td>${badgeEstadoArribo(r['Estado de vuelo'])}</td>
        <td>${r['ETA TAMS']||''}</td>
      </tr>`;
    }
  }).join("");
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
    tblHistorial.querySelector("tbody").innerHTML = filtered.map(r => {
      const micros = String(r['Micros']||'').toUpperCase().includes('MICRO');
      const vueloCell = `<td class="${micros ? 'micro-cell' : ''}">${r['Vuelo']||''}</td>`;
      if ((r['Tipo']||'').toLowerCase() === 'salida') {
        return `<tr>
          <td><strong>${r['Matrícula']||''}</strong></td>
          ${vueloCell}
          <td>${r['Destino']||''}</td>
          <td>${r['ETD']||''}</td>
          <td>${r['Apertura']||''}</td>
          <td>${r['Cierre']||''}</td>
          <td>${r['POS/PUERTA']||''}</td>
          <td>${badgeEstadoSalida(r['Estado de vuelo'])}</td>
          <td>${badgeOkNoOk(r['COMBU'])}</td>
          <td>${badgeOkNoOk(r['BINGO'])}</td>
          <td>${badgeDelay(r['Informe de DELAY'])}</td>
        </tr>`;
      } else {
        return `<tr>
          <td><strong>${r['Matrícula']||''}</strong></td>
          ${vueloCell}
          <td>${r['Origen']||''}</td>
          <td>${r['ETA']||''}</td>
          <td>${r['POS/CINTA']||''}</td>
          <td>${badgeEstadoArribo(r['Estado de vuelo'])}</td>
          <td>${r['ETA TAMS']||''}</td>
        </tr>`;
      }
    }).join("");
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

// Bootstrap por si JSONP llegó antes (Chrome móvil)
if (Array.isArray(window.__GAS_ROWS__) && window.__GAS_ROWS__.length) {
  window.__loadFromJSONP(window.__GAS_ROWS__);
}
