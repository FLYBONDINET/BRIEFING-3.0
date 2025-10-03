/* App UI — Arribos & Salidas (JSONP) — PUSH (col AB) con color y refresh automático */

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

/* ===== Helpers JSONP (fallback) ===== */
(function ensureJsonp(){
  if (typeof window.jsonpRequest === 'function') return;
  window.jsonpRequest = function({ url, callbackName, id, timeoutMs = 12000, onError }){
    try{
      if (id) {
        const prev = document.getElementById(id);
        if (prev) prev.remove();
      }
      const u = new URL(url, location.href);
      if (callbackName) u.searchParams.set('callback', callbackName);
      u.searchParams.set('_ts', Date.now());
      const s = document.createElement('script');
      if (id) s.id = id;
      s.async = true;
      s.src = u.toString();

      let done = false;
      const to = setTimeout(()=>{ if (!done){ done = true; s.remove(); onError?.(new Error('Timeout'));}}, timeoutMs);
      s.onerror = ()=>{ if (!done){ done = true; clearTimeout(to); s.remove(); onError?.(new Error('NetworkError'));}};
      document.body.appendChild(s);
    }catch(e){
      onError?.(e);
    }
  };
})();

/* ===== Utils ===== */
function normalizeStr(v){ return String(v||'').trim(); }
function upper(v){ return normalizeStr(v).toUpperCase(); }
function classifyPush(val){
  const n = Number(val);
  if (isNaN(n)) return 'ok';       // vacío => verde
  return (n <= 0) ? 'ok' : 'warn'; // ok=verde, warn=amarillo
}

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
  const t = upper(v);
  let cls = '', icon = '';
  if (t === 'ATERRIZADO')       { cls = 'aterrizado'; icon = '🛬'; }
  else if (t === 'EN VUELO')    { cls = 'en-vuelo';   icon = '🛫'; }
  else if (t === 'EN TIERRA')   { cls = 'en-tierra';  icon = '✈️<span class="ground">▬</span>'; }
  return `<span class="badge ${cls}">${icon} ${normalizeStr(v)}</span>`;
}
function vueloCellArribo(r){
  const vu  = r['Vuelo']  || '';
  const org = r['Origen'] || '';
  const eta = r['ETA']    || '';

  const raw = normalizeStr(r['Puntualidad'] ?? r['Y'] ?? '');
  const t = upper(raw);
  let cls = '';
  if (t === 'EN HORARIO') cls = 'ontime';
  else if (t.startsWith('DEMORADO')) cls = 'delayed';
  else if (t.startsWith('ADELANTADO')) cls = 'early';

  const punctHtml = raw ? `<div class="vuelo-punct ${cls}">${raw}</div>` : '';

  return `
    <div class="vuelo-top">${vu} ${org}</div>
    <div class="vuelo-eta">${eta}</div>
    ${punctHtml}
  `;
}
function rowHtmlArribo(r){
  const micros = upper(r['Micros']||'').includes('MICRO');
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
  + '<col><col><col><col><col><col><col><col><col><col>'
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
      <th class="delaymins">PUSH</th>
    </tr>`;
}
function badgeEstadoSalida(v){
  const t = upper(v);
  let cls = '', icon = '';
  if (t === 'EN VUELO')      { cls = 'en-vuelo';   icon = '🛫'; }
  else if (t === 'EN TIERRA'){ cls = 'en-tierra';  icon = '✈️<span class="ground">▬</span>'; }
  else if (t === 'ATERRIZADO'){cls = 'aterrizado'; icon = '🛬'; }
  return `<span class="badge ${cls}">${icon} ${normalizeStr(v)}</span>`;
}
function badgeOkNoOk(v){
  const t = upper(v);
  let cls = '';
  if (t === 'OK') cls = 'ok';
  else if (t === 'NO OK') cls = 'no-ok';
  return `<span class="badge ${cls}">${normalizeStr(v)}</span>`;
}
function badgeDelay(v){
  const t = upper(v);
  let cls = '';
  if (t.includes('ON TIME') || t.includes('PENDIENTE')) cls = 'delay-warn';
  else if (t.includes('CARGADO')) cls = 'delay-ok';
  return `<span class="badge ${cls}">${normalizeStr(v)}</span>`;
}
function vueloCellSalida(r){
  const vu   = r['Vuelo']   || '';
  const dest = r['Destino'] || '';
  const etd  = r['ETD']     || '';

  const raw = normalizeStr(r['PuntualidadSalida'] ?? r['Z'] ?? '');
  const t = upper(raw);
  let cls = '';
  if (t === 'EN HORARIO') cls = 'ontime';
  else if (t.startsWith('DEMORADO')) cls = 'delayed';
  else if (t.startsWith('ADELANTADO')) cls = 'early';

  const punctHtml = raw ? `<div class="vuelo-punct ${cls}">${raw}</div>` : '';

  return `
    <div class="vuelo-top">${vu} ${dest}</div>
    <div class="vuelo-eta">${etd}</div>
    ${punctHtml}
  `;
}

/* ==== Celda PUSH (col AB) ==== */
function cellDelayMinutes(r){
  const initial = normalizeStr(r['AB'] ?? r['DesvioMin'] ?? '0');
  const vuelo   = normalizeStr(r['Vuelo'] || '');
  const etd     = normalizeStr(r['ETD']   || '');
  const id = `${vuelo}__${etd}`.replace(/\s+/g,'_');
  const cls = classifyPush(initial) === 'ok' ? 'delaymins-ok' : 'delaymins-warn';

  return `
  <div class="delaymins-cell" data-id="${id}">
    <input type="tel" pattern="-?[0-9]*"
           class="delaymins-input ${cls}"
           value="${initial}" placeholder="PUSH..."
           data-vuelo="${vuelo}" data-etd="${etd}"
           oninput="liveColorPush(this)">
    <button class="delaymins-save" onclick="saveDelayMinutes(this)">Guardar</button>
  </div>
`;

/* Color en vivo al tipear */
window.liveColorPush = function(input){
  const v = input.value.trim();
  const state = classifyPush(v);
  input.classList.toggle('delaymins-ok',   state === 'ok');
  input.classList.toggle('delaymins-warn', state === 'warn');
};

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
    <td class="delaymins">${cellDelayMinutes(r)}</td>
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

  // Historial usa head de Salidas (incluye PUSH)
  tblHistorial.querySelector("thead").innerHTML = tblSalidas.querySelector("thead").innerHTML;
  tblHistorial.querySelector("tbody").innerHTML = data.map(r =>
    (r['Tipo']||'').toLowerCase() === 'salida' ? rowHtmlSalida(r) : rowHtmlArribo(r)
  ).join("");
}

// JSONP hook que llama index.html
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

// Render inmediato si JSONP llegó antes que app.js
if (Array.isArray(window.__GAS_ROWS__) && window.__GAS_ROWS__.length) {
  window.__loadFromJSONP(window.__GAS_ROWS__);
}

/* ===== Helpers de refresh ===== */
function reloadData() {
  if (typeof window.requestGAS === 'function') {
    window.requestGAS();
  } else if (typeof window.jsonpRequest === 'function' && window.GAS_URL) {
    window.jsonpRequest({
      url: window.GAS_URL,
      callbackName: 'handleGASData',
      id: 'jsonp-gas-data-refresh',
      timeoutMs: 12000,
      onError: (err)=> console.error('[GAS refresh] error:', err?.message)
    });
  }
}

/* ===== Guardar PUSH (AB) via GAS JSONP ===== */
window.saveDelayMinutes = function(btn){
  const input = btn?.closest('.delaymins-cell')?.querySelector('.delaymins-input');
  if (!input) return;

  let val = input.value.trim();
  if (val === '') val = '0';
  if (!/^-?\d{1,3}$/.test(val)) { alert('Ingresá un entero entre -999 y 999'); return; }
  const minutos = parseInt(val, 10);
  const vuelo = (input.getAttribute('data-vuelo') || '').trim();
  const etd   = (input.getAttribute('data-etd')   || '').trim();

  const baseUrl = (typeof window.GAS_URL === 'string' && window.GAS_URL) ? window.GAS_URL : '';
  if (!baseUrl) { alert('GAS_URL no definida en index.html'); return; }

  // bloquear UI
  btn.disabled = true; input.disabled = true;

  // callback único para este request (evita colisiones)
  const cbName = 'handleSaveDelay_' + Math.random().toString(36).slice(2);
  window[cbName] = function(res){
    try { delete window[cbName]; } catch(_) {}

    // desbloquear
    btn.disabled = false; input.disabled = false;

    if (!res || !res.ok) {
      console.error('[GAS setDelay] respuesta:', res);
      alert('No se pudo guardar el PUSH (AB)' + (res && res.error ? ` (${res.error})` : ''));
      // intentamos refrescar por si en GAS sí se guardó
      reloadData();
      return;
    }

    // actualizar cache local para feedback inmediato
    const i = CURRENT_DATA.findIndex(r =>
      String((r['Vuelo']||'')).trim() === vuelo &&
      String((r['ETD']||'')).trim()   === etd
    );
    if (i >= 0) CURRENT_DATA[i]['AB'] = String(minutos);
    renderAll(CURRENT_DATA);

    // recolorear input
    const state = classifyPush(minutos);
    input.classList.toggle('delaymins-ok',   state === 'ok');
    input.classList.toggle('delaymins-warn', state === 'warn');

    // ✅ refrescar desde la hoja (quedamos 100% en sync)
    reloadData();
  };

  const url = `${baseUrl}?action=setDelay&vuelo=${encodeURIComponent(vuelo)}&etd=${encodeURIComponent(etd)}&minutes=${encodeURIComponent(minutos)}`;

  // JSONP robusto
  window.jsonpRequest({
    url,
    callbackName: cbName,
    id: `jsonp-save-delay-${encodeURIComponent(vuelo)}-${encodeURIComponent(etd)}-${Date.now()}`,
    timeoutMs: 12000,
    onError: (err)=>{
      btn.disabled = false; input.disabled = false;
      console.error('[GAS setDelay] error:', err?.message);
      alert('No se pudo contactar al servicio.');
      // refresh por si igualmente se guardó en GAS
      reloadData();
    }
  });
};
