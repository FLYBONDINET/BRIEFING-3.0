/* App UI — Arribos & Salidas (JSONP)
   - ARRIBOS: muestra columnas A,C,D,B,F,I,G en este orden:
     Matrícula, Vuelo, Origen, ETA, POS/CINTA, Estado de vuelo, ETA TAMS
   - SALIDAS: muestra columnas J,L,M,K,N,O,P,V,Q,R,S en este orden:
     Matrícula, Vuelo, Destino, ETD, Apertura, Cierre, POS/PUERTA, Estado de vuelo, COMBU, BINGO, Informe de DELAY
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
   ARRIBOS — encabezado/filas
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
  // Para Arribos también respetamos colores:
  // ATERRIZADO => verde, EN VUELO => cian, A CONFIRMAR => sin color
  const t = String(v||'').trim().toUpperCase();
  let cls = '';
  if (t === 'ATERRIZADO') cls = 'aterrizado';
  else if (t === 'EN VUELO') cls = 'en-vuelo';
  // A CONFIRMAR => sin clase
  return `<span class="badge ${cls}">${v||''}</span>`;
}
function rowHtmlArribo(r){
  return `<tr>
    <td><strong>${r['Matrícula']||''}</strong></td>
    <td>${r['Vuelo']||''}</td>
    <td>${r['Origen']||''}</td>
    <td>${r['ETA']||''}</td>
    <td>${r['POS/CINTA']||''}</td>
    <td>${badgeEstadoArribo(r['Estado de vuelo'])}</td>
    <td>${r['ETA TAMS']||''}</td>
  </tr>`;
}

/* ===========================
   SALIDAS — encabezado/filas
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
// badges de Salidas según tus reglas
function badgeEstadoSalida(v){
  const t = String(v||'').trim().toUpperCase();
  let cls = '';
  if (t === 'EN VUELO') cls = 'en-vuelo';
  // A CONFIRMAR => sin clase/color
  return `<span class="badge ${cls}">${v||''}</span>`;
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
   RENDER + BUSCADOR
   =========================== */
function renderAll(data){
  const arr = data.filter(d => (d['Tipo']||'').toLowerCase() === 'arribo');
  const sal = data.filter(d => (d['Tipo']||'').toLowerCase() === 'salida');

  // ARRIBOS
  buildHeadArribos(tblArribos);
  tblArribos.querySelector("tbody").innerHTML = arr.map(rowHtmlArribo).join("");

  // SALIDAS
  buildHeadSalidas(tblSalidas);
  tblSalidas.querySelector("tbody").innerHTML = sal.map(rowHtmlSalida).join("");

  // HISTORIAL (usá el que prefieras; acá muestro todo con formato de Salidas)
  buildHeadSalidas(tblHistorial);
  tblHistorial.querySelector("tbody").innerHTML = data.map(rowHtmlSalida).join("");
}

// Recibe datos del JSONP del Apps Script
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
    tblHistorial.querySelector("tbody").innerHTML = filtered.map(rowHtmlSalida).join("");
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
