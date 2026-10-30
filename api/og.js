// Imagen de vista previa (WhatsApp, Facebook, X) de la página principal. Los rastreadores no ejecutan
// JavaScript, así que el cambio por fecha tiene que decidirse aquí, en el servidor: hasta el cierre del
// festival Sabe a Quindío (8 de noviembre de 2026, 23:59 hora Colombia) se muestra la Burger Trifásica;
// después vuelve sola a la portada de siempre. Se pide como /og-compartir.jpg (ver rewrites en vercel.json).
const FESTIVAL_HASTA = Date.parse('2026-11-08T23:59:59-05:00');
const ORIGEN = 'https://roalburger.com';

module.exports = async (req, res) => {
    const festival = Date.now() <= FESTIVAL_HASTA;
    const ruta = festival ? '/og-trifasica.jpg' : '/portada.png?v=20260601';
    // Caché corta en el borde para que el cambio del 9 de noviembre se note pronto.
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=600');
    try {
        const r = await fetch(`${ORIGEN}${ruta}`);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        res.setHeader('Content-Type', r.headers.get('content-type') || (festival ? 'image/jpeg' : 'image/png'));
        res.status(200).send(Buffer.from(await r.arrayBuffer()));
    } catch (_) {
        res.redirect(302, `${ORIGEN}${ruta}`);
    }
};
