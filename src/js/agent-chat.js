// Widget de chat del agente de IA (toma pedidos) en el menú público.
// Se carga después de script-v2.js y firebase-config.js — reutiliza getPublicFirebaseFunctions()
// ya definida ahí (mismo patrón que sendWhatsAppOtp/verifyWhatsAppOtp).
//
// Diseño: banner pequeño fijo abajo que abre un chat a pantalla completa (como WhatsApp). La
// conversación se guarda en el servidor por sessionId — al reabrir el chat se recarga el
// historial. Si el cliente ya tiene perfil guardado (roalburger-customer-profile-v1), se lo
// mandamos al agente para que lo reconozca y pueda ofrecerle repetir su último pedido.
(function () {
    'use strict';

    const SESSION_STORAGE_KEY = 'roalburger-agent-session-v1';
    const CUSTOMER_PROFILE_STORAGE_KEY = 'roalburger-customer-profile-v1';

    function getOrCreateSessionId() {
        try {
            let id = window.localStorage.getItem(SESSION_STORAGE_KEY);
            if (!id) {
                id = 'sess_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 10);
                window.localStorage.setItem(SESSION_STORAGE_KEY, id);
            }
            return id;
        } catch (_e) {
            return 'sess_' + Date.now().toString(36);
        }
    }

    function getStoredCustomerProfile() {
        try {
            const raw = window.localStorage.getItem(CUSTOMER_PROFILE_STORAGE_KEY);
            if (!raw) return null;
            const p = JSON.parse(raw);
            const customerName = String(p.customerName || '').trim();
            const customerPhone = String(p.customerPhone || '').trim();
            if (!customerName && !customerPhone) return null;
            return {
                customerName,
                customerPhone,
                address: String(p.address || '').trim(),
                lastOrderId: String(p.lastOrderId || '').trim(),
                totalOrders: Number(p.totalOrders || 0)
            };
        } catch (_e) {
            return null;
        }
    }

    function buildWelcomeMessage(profile) {
        // "Pedimos lo de siempre" solo tiene sentido si el perfil guardado ya completó al
        // menos un pedido real — si no, es un cliente nuevo aunque haya guardado su nombre.
        if (profile && profile.customerName && Number(profile.totalOrders) > 0) {
            const firstName = profile.customerName.split(/\s+/)[0];
            return `¡Hola de nuevo, ${firstName}! 👋 ¿Pedimos lo de siempre o se te antoja algo distinto hoy?`;
        }
        return '¡Hola! 👋 Soy el asistente virtual de ROAL BURGER. Puedo ayudarte a armar tu pedido del menú regular por acá mismo. ¿Qué se te antoja hoy?';
    }

    function buildWidgetMarkup() {
        const wrap = document.createElement('div');
        wrap.id = 'agentChatWidget';
        wrap.innerHTML = `
            <button type="button" id="agentChatBanner" class="agent-chat-banner" aria-label="Abrir chat con el asistente">
                <span class="agent-chat-banner-icon">💬</span>
                <span class="agent-chat-banner-text">Habla con nuestro asistente</span>
            </button>
            <div id="agentChatPanel" class="agent-chat-panel" hidden>
                <div class="agent-chat-header">
                    <span class="agent-chat-title">Asistente ROAL BURGER</span>
                    <button type="button" id="agentChatBackBtn" class="agent-chat-back" aria-label="Cerrar chat">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
                        <span class="agent-chat-back-label">Cerrar</span>
                    </button>
                </div>
                <div id="agentChatMessages" class="agent-chat-messages"></div>
                <div id="agentChatTyping" class="agent-chat-typing" hidden>Escribiendo…</div>
                <div class="agent-chat-input-row">
                    <button type="button" id="agentChatLocationBtn" class="agent-chat-icon-btn" title="Compartir mi ubicación" aria-label="Compartir mi ubicación">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>
                    </button>
                    <textarea id="agentChatInput" class="agent-chat-input" placeholder="Escribe tu pedido..." rows="1"></textarea>
                    <button type="button" id="agentChatSendBtn" class="agent-chat-send-btn" aria-label="Enviar">
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(wrap);
        return wrap;
    }

    function escapeHtml(str) {
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // *negrita* estilo WhatsApp (asterisco simple, no ** de markdown normal) -- el prompt del
    // agente ya usa esta misma convención para que las dos vías de salida (WhatsApp y este
    // widget) se vean igual sin que el bot tenga que saber en cuál está. Escapa primero para que
    // nada de lo que escriba el cliente o el bot pueda inyectar HTML.
    function renderInlineMarkup(text) {
        const escaped = escapeHtml(text).replace(/\*([^\n*]+)\*/g, '<strong>$1</strong>');
        return escaped.replace(/\n/g, '<br>');
    }

    function appendMessage(container, role, text, images) {
        const bubble = document.createElement('div');
        bubble.className = 'agent-chat-bubble ' + (role === 'user' ? 'agent-chat-bubble-user' : 'agent-chat-bubble-assistant');
        if (text) {
            const textEl = document.createElement('div');
            textEl.innerHTML = renderInlineMarkup(text);
            bubble.appendChild(textEl);
        }
        if (Array.isArray(images)) {
            images.forEach((url) => {
                if (!url) return;
                const img = document.createElement('img');
                img.src = url;
                img.alt = '';
                img.loading = 'lazy';
                img.className = 'agent-chat-bubble-image';
                bubble.appendChild(img);
            });
        }
        container.appendChild(bubble);
        container.scrollTop = container.scrollHeight;
    }

    function initAgentChat() {
        if (document.getElementById('agentChatWidget')) return;

        const wrap = buildWidgetMarkup();
        const banner = wrap.querySelector('#agentChatBanner');
        const panel = wrap.querySelector('#agentChatPanel');
        const backBtn = wrap.querySelector('#agentChatBackBtn');
        const messagesEl = wrap.querySelector('#agentChatMessages');
        const typingEl = wrap.querySelector('#agentChatTyping');
        const input = wrap.querySelector('#agentChatInput');
        const sendBtn = wrap.querySelector('#agentChatSendBtn');
        const locationBtn = wrap.querySelector('#agentChatLocationBtn');

        const sessionId = getOrCreateSessionId();
        const customerProfile = getStoredCustomerProfile();
        let historyLoaded = false;
        let sending = false;
        let pendingLocation = null;
        // Cuántos mensajes del historial del servidor ya están pintados — se usa para el
        // polling (ver startPolling) y así solo agregar los mensajes nuevos, sin re-renderizar
        // todo el hilo cada vez.
        let renderedMessageCount = 0;
        let pollTimer = null;

        async function loadHistoryIfNeeded() {
            if (historyLoaded) return;
            historyLoaded = true;
            try {
                const fn = typeof getPublicFirebaseFunctions === 'function' ? getPublicFirebaseFunctions() : null;
                if (!fn) throw new Error('no-functions');
                const callable = fn.httpsCallable('agentChatHistory');
                const result = await callable({ sessionId });
                const messages = (result.data && Array.isArray(result.data.messages)) ? result.data.messages : [];
                if (messages.length) {
                    messages.forEach((m) => appendMessage(messagesEl, m.role, m.text, m.images));
                    renderedMessageCount = messages.length;
                    return;
                }
            } catch (_err) {
                // Si falla la carga del historial, seguimos con el saludo normal.
            }
            appendMessage(messagesEl, 'assistant', buildWelcomeMessage(customerProfile));
        }

        // Un admin puede tomar el control de la conversación desde FODEXA (Chat Roal) y
        // responder directo — este chat no tiene sesión en vivo (Firestore) del lado del
        // cliente, así que mientras el panel está abierto se revisa el historial cada 5s para
        // que esas respuestas aparezcan sin que el cliente tenga que reabrir el chat.
        async function pollForNewMessages() {
            // Si sendMessage ya está en vuelo, va a pintar la respuesta él mismo apenas
            // resuelva -- sin este freno, un turno lento (el agente puede tardar varios
            // segundos con tool use) deja que este poll de 5s llegue primero, pinte el mismo
            // par de mensajes desde el historial del servidor, y después sendMessage los
            // vuelva a pintar encima: la respuesta aparece duplicada.
            if (sending) return;
            try {
                const fn = typeof getPublicFirebaseFunctions === 'function' ? getPublicFirebaseFunctions() : null;
                if (!fn) return;
                const callable = fn.httpsCallable('agentChatHistory');
                const result = await callable({ sessionId });
                const messages = (result.data && Array.isArray(result.data.messages)) ? result.data.messages : [];
                if (messages.length > renderedMessageCount) {
                    messages.slice(renderedMessageCount).forEach((m) => appendMessage(messagesEl, m.role, m.text, m.images));
                    renderedMessageCount = messages.length;
                }
            } catch (_err) {
                // Silencioso — se reintenta en el siguiente ciclo.
            }
        }

        function startPolling() {
            if (pollTimer) return;
            pollTimer = window.setInterval(pollForNewMessages, 5000);
        }

        function stopPolling() {
            if (!pollTimer) return;
            window.clearInterval(pollTimer);
            pollTimer = null;
        }

        // En escritorio (>=900px) el chat es un panel lateral y el menú sigue visible y
        // usable al lado — solo bloqueamos el scroll de fondo en celular, donde el chat tapa
        // toda la pantalla.
        const isDesktopLayout = () => window.matchMedia('(min-width: 900px)').matches;

        function openPanel() {
            panel.hidden = false;
            banner.hidden = true;
            if (!isDesktopLayout()) document.body.style.overflow = 'hidden';
            loadHistoryIfNeeded();
            // Si el cliente cierra el chat y lo vuelve a abrir más tarde, loadHistoryIfNeeded ya
            // no hace nada (historyLoaded quedó en true) -- sin este poll inmediato, una
            // respuesta del admin mandada mientras el panel estaba cerrado solo aparecía hasta
            // el próximo tick de 5s (o nunca, si el cliente vuelve a cerrar antes de que pase).
            pollForNewMessages();
            startPolling();
            input.focus();
        }

        function closePanel() {
            panel.hidden = true;
            banner.hidden = false;
            document.body.style.overflow = '';
            stopPolling();
        }

        banner.addEventListener('click', openPanel);
        backBtn.addEventListener('click', closePanel);

        // Los navegadores frenan los setInterval de pestañas en segundo plano (pueden pasar
        // minutos entre ticks reales en vez de los 5s configurados) -- sin esto, un cliente que
        // cambia de pestaña y vuelve no ve la respuesta del admin hasta mucho después de lo que
        // parece razonable, aunque el poll técnicamente siga corriendo.
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && !panel.hidden) pollForNewMessages();
        });

        async function sendMessage(text) {
            if (sending || !text.trim()) return;
            sending = true;
            sendBtn.disabled = true;
            appendMessage(messagesEl, 'user', text);
            input.value = '';
            typingEl.hidden = false;

            try {
                const fn = typeof getPublicFirebaseFunctions === 'function' ? getPublicFirebaseFunctions() : null;
                if (!fn) throw new Error('no-functions');
                const callable = fn.httpsCallable('agentChatWeb');
                const payload = { sessionId, message: text };
                if (pendingLocation) {
                    payload.location = pendingLocation;
                    pendingLocation = null;
                }
                if (customerProfile) payload.customerProfile = customerProfile;
                const result = await callable(payload);
                renderedMessageCount += 1; // el mensaje del cliente que se acaba de guardar
                const reply = result.data && result.data.reply;
                const images = (result.data && result.data.images) || [];
                if (reply || images.length) {
                    appendMessage(messagesEl, 'assistant', reply, images);
                    renderedMessageCount += 1;
                }
                // Si reply viene vacío (null) es porque un admin tomó el control de la
                // conversación desde Chat Roal — no es un error, el polling va a traer su
                // respuesta cuando la escriba.
            } catch (_err) {
                appendMessage(messagesEl, 'assistant', 'Tuvimos un problema para responderte. Escríbenos por WhatsApp o usa el menú normal mientras tanto.');
            } finally {
                typingEl.hidden = true;
                sending = false;
                sendBtn.disabled = false;
            }
        }

        sendBtn.addEventListener('click', () => sendMessage(input.value));
        input.addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter' && !ev.shiftKey) {
                ev.preventDefault();
                sendMessage(input.value);
            }
        });

        locationBtn.addEventListener('click', () => {
            if (!('geolocation' in navigator)) {
                appendMessage(messagesEl, 'assistant', 'Tu navegador no permite compartir ubicación. Escribe tu dirección de texto y seguimos.');
                return;
            }
            locationBtn.disabled = true;
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    pendingLocation = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
                    locationBtn.disabled = false;
                    sendMessage('Compartí mi ubicación para el domicilio.');
                },
                () => {
                    locationBtn.disabled = false;
                    appendMessage(messagesEl, 'assistant', 'No pude acceder a tu ubicación. Escribe tu dirección de texto y seguimos.');
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAgentChat);
    } else {
        initAgentChat();
    }
})();
