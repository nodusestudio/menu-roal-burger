// Recibe la lista del content script y la manda a FODEXA (desde aquí no hay bloqueo CORS).
importScripts('config.js');
chrome.runtime.onMessage.addListener((msg, _s, responder) => {
  if (!msg || msg.tipo !== 'chats') return;
  fetch(self.WA_ROAL.url, { method: 'POST', headers: { 'content-type': 'application/json', 'x-wa-token': self.WA_ROAL.token }, body: JSON.stringify({ chats: msg.chats }) })
    .then((r) => r.json().then((j) => responder({ ok: r.ok && j.ok, estado: r.status })))
    .catch(() => responder({ ok: false, estado: 0 }));
  return true;
});
