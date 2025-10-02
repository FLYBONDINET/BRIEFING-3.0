
/* compat-chrome.js — parches de compatibilidad específicos para Chrome
   - Modo dev sin caché (?dev=1)
   - Parser robusto de horas HH:MM
   - fetch sin caché por defecto (opcional)
   - Helpers para detectar mixed content y JSONP bloqueado
*/
(function(){
  const params = new URLSearchParams(location.search);
  const devMode = params.has('dev');

  // Parser robusto de "HH:MM" para hoy en zona local
  window.parseHoraHoy = function(hhmm){
    if (typeof hhmm !== 'string') return null;
    const m = hhmm.trim().match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    let h = +m[1], mi = +m[2];
    if (h>23 || mi>59) return null;
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, mi, 0, 0);
  };

  // Helper: compara hora HH:MM contra Date.now() => -1 pasado, 0 igual minuto, 1 futuro
  window.compareHHMMWithNow = function(hhmm){
    const d = window.parseHoraHoy(hhmm);
    if (!d) return null;
    const now = new Date();
    const a = Math.floor(d.getTime()/60000), b = Math.floor(now.getTime()/60000);
    return a < b ? -1 : (a > b ? 1 : 0);
  };

  // fetch sin caché por defecto (solo misma-origen)
  const _fetch = window.fetch;
  window.fetch = function(input, init){
    try {
      const url = (typeof input === 'string') ? new URL(input, location.href) :
                  (input && input.url ? new URL(input.url, location.href) : null);
      if (url && url.origin === location.origin) {
        init = Object.assign({cache:'no-store'}, init||{});
        // cache-bust
        url.searchParams.set('_', Date.now().toString());
        input = url.toString();
      }
    } catch(e){ /* noop */ }
    return _fetch.call(this, input, init);
  };

  // En modo dev, desregistrar SW y bustear scripts/estilos
  if (devMode) {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()));
    }
    const bust = (el, attr) => {
      try{
        const u = new URL(el.getAttribute(attr), location.href);
        u.searchParams.set('_', Date.now().toString());
        el.setAttribute(attr, u.toString());
      }catch(e){}
    };
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('script[src],link[rel="stylesheet"][href]').forEach(el=>{
        const attr = el.tagName === 'SCRIPT' ? 'src' : 'href';
        bust(el, attr);
      });
      console.info('[compat] dev mode activo: sin SW y sin caché');
    });
  }

  // Detector de mixed content en scripts JSONP inyectados dinámicamente
  const origAppend = Element.prototype.appendChild;
  Element.prototype.appendChild = function(child){
    try{
      if (child && child.tagName === 'SCRIPT' && child.src) {
        const u = new URL(child.src, location.href);
        if (location.protocol === 'https:' && u.protocol === 'http:') {
          console.error('[compat] Mixed Content: estás intentando cargar', u.href, 'sobre HTTPS. Usá HTTPS o un proxy.');
        }
        // bust opcional
        const p = new URL(child.src, location.href);
        p.searchParams.set('_', Date.now().toString());
        child.src = p.toString();
      }
    }catch(e){ /* noop */ }
    return origAppend.call(this, child);
  };

  // Trap de errores para dar pistas
  window.addEventListener('error', (ev)=>{
    if (/mime|Unexpected token|JSONP|blocked/i.test(String(ev.message||''))) {
      console.warn('[compat] Revisá el endpoint JSONP/CORS/MIME. Error:', ev.message);
    }
  });
})();
