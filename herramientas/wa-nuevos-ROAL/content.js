// Lee la lista de chats de WhatsApp Web y reporta SOLO los de números sin guardar (el título del chat es un teléfono).
// No abre chats, no marca como leído, no escribe ni envía nada: solo lee texto que ya está en pantalla.
(() => {
  const ES_TELEFONO = /^\+?\d[\d\s().-]{8,}$/;
  const ES_HORA = /^(\d{1,2}:\d{2}(\s?[ap]\.?\s?m\.?)?|ayer|hoy|lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo|\d{1,2}\/\d{1,2}\/\d{2,4})$/i;
  const ultimoEnviado = new Map(); // tel -> huella del último reporte (solo se manda lo que cambió)
  let ultimaLatido = 0;

  function leerFila(fila) {
    const lineas = String(fila.innerText || '').split('\n').map((s) => s.trim()).filter(Boolean);
    if (!lineas.length) return null;
    const titulo = (fila.querySelector('span[title]') || {}).title || lineas[0];
    if (!ES_TELEFONO.test(String(titulo).trim())) return null; // contacto guardado o grupo: no interesa
    const resto = lineas.slice(1).filter((l) => !ES_HORA.test(l) && !/^\d{1,3}$/.test(l) && !/^(mensajes? no le[ií]dos?|no le[ií]do)$/i.test(l));
    const texto = (resto.sort((a, b) => b.length - a.length)[0] || '').replace(/^T[úu]:\s*/i, '');
    const mio = !!fila.querySelector('[data-icon^="msg-"]'); // palomitas/reloj junto al último mensaje = lo envió el local
    return { tel: String(titulo).replace(/\D/g, ''), nombre: '', texto, mio };
  }

  function escanear() {
    const panel = document.querySelector('#pane-side');
    if (!panel) return;
    const filas = panel.querySelectorAll('[role="row"], [role="listitem"]');
    const chats = [];
    filas.forEach((f) => { const c = leerFila(f); if (c) chats.push(c); });
    const ahora = Date.now();
    const cambios = chats.filter((c) => { const h = `${c.texto}|${c.mio}`; if (ultimoEnviado.get(c.tel) === h) return false; ultimoEnviado.set(c.tel, h); return true; });
    // Cada 10 min se reenvía todo (latido): si el servidor perdió algo o se reinició la página, se recupera.
    const latido = ahora - ultimaLatido > 600000;
    if (latido) ultimaLatido = ahora;
    const enviar = latido ? chats : cambios;
    if (!enviar.length) return;
    chrome.runtime.sendMessage({ tipo: 'chats', chats: enviar }, (r) => {
      if (chrome.runtime.lastError || !r || !r.ok) enviar.forEach((c) => ultimoEnviado.delete(c.tel)); // falló: se reintenta en el próximo ciclo
    });
  }

  setInterval(escanear, 15000);
  setTimeout(escanear, 5000);
})();
