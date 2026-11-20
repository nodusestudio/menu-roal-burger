// Aviso INMEDIATO de pagos Bancolombia: Gmail avisa por Pub/Sub (users.watch) apenas llega el correo,
// en vez de esperar al Apps Script que revisa cada minuto. Sin dependencias: solo fetch contra la API REST de Gmail.
// El token de acceso (refresh token) vive en servidor_privado/gmail_banco, colección sin reglas = cerrada a clientes.

const TOPIC = 'projects/roal-burger-menu/topics/gmail-banco';
const DOC = ['servidor_privado', 'gmail_banco'];
const ALCANCE = 'https://www.googleapis.com/auth/gmail.readonly';

function refDoc(db) { return db.collection(DOC[0]).doc(DOC[1]); }

async function tokenAcceso(db, clientId, clientSecret) {
    const s = await refDoc(db).get();
    const refresh = s.data()?.refreshToken;
    if (!refresh) throw new Error('gmail-sin-autorizar');
    const r = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refresh, grant_type: 'refresh_token' })
    });
    const j = await r.json();
    if (!j.access_token) throw new Error('gmail-token: ' + (j.error || r.status));
    return j.access_token;
}

async function gmail(token, ruta, opciones = {}) {
    const r = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/' + ruta, {
        ...opciones, headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' }
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error('gmail ' + r.status + ' ' + (j.error?.message || '')); e.status = r.status; throw e; }
    return j;
}

/** Pide a Gmail que publique en Pub/Sub cada correo nuevo del INBOX. Dura ~7 días: se renueva a diario. */
async function activarWatch(db, token) {
    const w = await gmail(token, 'watch', { method: 'POST', body: JSON.stringify({ topicName: TOPIC, labelIds: ['INBOX'], labelFilterBehavior: 'INCLUDE' }) });
    const datos = { watchVence: Number(w.expiration) || 0, watchEn: Date.now() };
    // Solo se fija el punto de partida la primera vez; en renovaciones se conserva el último procesado.
    const s = await refDoc(db).get();
    if (!s.data()?.historyId) datos.historyId = String(w.historyId);
    await refDoc(db).set(datos, { merge: true });
    return w;
}

function decodificar(b64) { return Buffer.from(String(b64 || '').replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'); }

function aTexto(html) {
    return String(html || '').replace(/<(style|script)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#36;/g, '$').replace(/\s+/g, ' ').trim();
}

/** Saca el texto del mensaje (text/plain si hay, si no HTML limpio). */
function textoDeMensaje(m) {
    const planos = [], htmls = [];
    (function recorrer(p) {
        if (!p) return;
        if (p.mimeType === 'text/plain' && p.body?.data) planos.push(decodificar(p.body.data));
        else if (p.mimeType === 'text/html' && p.body?.data) htmls.push(decodificar(p.body.data));
        (p.parts || []).forEach(recorrer);
    })(m.payload);
    return planos.length ? planos.join(' ') : aTexto(htmls.join(' '));
}

/**
 * Procesa los correos nuevos desde el último historyId guardado. `procesar` recibe { mensajeId, remitente, texto, correoMs }.
 * Devuelve cuántos correos de Bancolombia revisó.
 */
async function procesarNuevos(db, token, procesar, remitenteOk) {
    const estado = (await refDoc(db).get()).data() || {};
    if (!estado.historyId) return 0;
    let pagina, ids = new Set(), ultimo = estado.historyId;
    try {
        do {
            const q = `history?startHistoryId=${estado.historyId}&historyTypes=messageAdded&labelId=INBOX` + (pagina ? `&pageToken=${pagina}` : '');
            const h = await gmail(token, q);
            for (const x of h.history || []) for (const a of x.messagesAdded || []) ids.add(a.message.id);
            if (h.historyId) ultimo = h.historyId;
            pagina = h.nextPageToken;
        } while (pagina);
    } catch (e) {
        if (e.status === 404) { // historyId demasiado viejo: se reinicia desde ahora (los pagos viejos los cubre el Apps Script)
            const p = await gmail(token, 'profile');
            await refDoc(db).set({ historyId: String(p.historyId) }, { merge: true });
            return 0;
        }
        throw e;
    }
    let revisados = 0;
    for (const id of ids) {
        const m = await gmail(token, `messages/${id}?format=full`);
        const de = (m.payload?.headers || []).find((x) => /^from$/i.test(x.name))?.value || '';
        if (!remitenteOk.test(de)) continue;
        revisados++;
        await procesar({ mensajeId: id, remitente: de, texto: textoDeMensaje(m), correoMs: Number(m.internalDate) || 0 });
    }
    await refDoc(db).set({ historyId: String(ultimo), ultimoPushMs: Date.now() }, { merge: true });
    return revisados;
}

module.exports = { TOPIC, ALCANCE, refDoc, tokenAcceso, gmail, activarWatch, procesarNuevos, textoDeMensaje, aTexto };
