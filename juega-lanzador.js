/* Lanzador de Block ROAL dentro del menú.
 * ¿Por qué un iframe sobre el menú en vez de ir a /juega? Los navegadores solo dejan sonar el audio después de un toque del usuario EN LA MISMA PÁGINA.
 * Si el toque en «Juega» cambia de página, el sonido queda bloqueado hasta otro toque. Abriendo el juego como capa de esta misma página, ese toque sí
 * cuenta (iframe del mismo sitio con allow="autoplay") y la entrada al barrio suena desde el primer instante.
 * Si el navegador igual lo bloquea, el juego muestra su botón «Toca pa' entrar» (juega.js lo detecta solo). Sin JavaScript, el enlace /juega sigue funcionando. */
(function () {
    'use strict';
    const enlace = document.getElementById('drawerJuegaBtn');
    if (!enlace) return;
    let capa = null;

    function cerrar(desdeHistorial) {
        if (!capa) return;
        capa.remove(); capa = null;
        document.documentElement.style.overflow = '';
        if (!desdeHistorial && history.state && history.state.blockroal) history.back();
    }
    function abrir() {
        if (capa) return;
        const cerrarCajon = document.getElementById('sectionsDrawerClose');
        if (cerrarCajon) cerrarCajon.click();
        capa = document.createElement('div');
        capa.id = 'juegoCapa';
        capa.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:#0e0e10';
        const marco = document.createElement('iframe');
        marco.src = '/juega';
        marco.title = 'Block ROAL';
        marco.setAttribute('allow', 'autoplay; fullscreen; vibrate');
        marco.style.cssText = 'border:0;width:100%;height:100%;display:block;background:#0e0e10';
        capa.appendChild(marco);
        document.body.appendChild(capa);
        document.documentElement.style.overflow = 'hidden';
        try { history.pushState({ blockroal: 1 }, ''); } catch (_) { /* sin historial */ }
    }

    enlace.addEventListener('click', (e) => {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        abrir();
    });
    // El juego avisa cuando el jugador toca «Menú» / «Ir al menú».
    window.addEventListener('message', (e) => {
        if (e.origin === window.location.origin && e.data && e.data.tipo === 'blockroal-cerrar') cerrar(false);
    });
    // El botón «atrás» del celular cierra el juego en vez de salirse del menú.
    window.addEventListener('popstate', () => cerrar(true));
})();
