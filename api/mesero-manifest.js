// Manifiesto de la app del MESERO. El del admin (admin.webmanifest) arranca siempre en /fodexa, y al guardar el enlace de un mesero
// en la pantalla de inicio la app instalada se abría ahí, sin el ?mesero=<token>, y pedía correo y contraseña de administrador.
// Este manifiesto lleva el token del mesero dentro de start_url (y de id, para que cada mesero sea su propia app). Se pide como
// /mesero.webmanifest?t=<token> (ver rewrites en vercel.json) y admin.js lo enlaza solo cuando la página se abre con ?mesero=.
const TOKEN_OK = /^[A-Za-z0-9_-]{8,80}$/;

module.exports = (req, res) => {
    const t = String((req.query && req.query.t) || '');
    res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300');
    if (!TOKEN_OK.test(t)) {
        res.status(400).send(JSON.stringify({ error: 'token no valido' }));
        return;
    }
    const inicio = `/fodexa?mesero=${encodeURIComponent(t)}`;
    res.status(200).send(JSON.stringify({
        name: 'FODEXA Mesero',
        short_name: 'Mesero',
        description: 'Toma de pedidos para meseros.',
        id: inicio,
        start_url: inicio,
        scope: '/fodexa',
        display: 'standalone',
        background_color: '#14172a',
        theme_color: '#14172a',
        icons: [{ src: '/isotipo-fodexa.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }]
    }));
};
