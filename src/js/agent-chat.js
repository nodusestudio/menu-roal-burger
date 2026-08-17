// Widget de chat del agente de IA (toma pedidos) en el menú público.
// Se carga después de script-v2.js y firebase-config.js — reutiliza getPublicFirebaseFunctions()
// ya definida ahí (mismo patrón que sendWhatsAppOtp/verifyWhatsAppOtp).
(function () {
    'use strict';

    const SESSION_STORAGE_KEY = 'roalburger-agent-session-v1';
    const WELCOME_MESSAGE = '¡Hola! 👋 Soy el asistente virtual de ROAL BURGER. Puedo ayudarte a armar tu pedido del menú regular por acá mismo. ¿Qué se te antoja hoy?';

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

    function buildWidgetMarkup() {
        const wrap = document.createElement('div');
        wrap.id = 'agentChatWidget';
        wrap.innerHTML = `
            <button type="button" id="agentChatFab" class="agent-chat-fab" aria-label="Chat con el asistente">
                <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true"><path d="M12 2C6.48 2 2 5.94 2 10.8c0 2.66 1.36 5.03 3.5 6.63V22l3.98-2.18c.81.18 1.66.28 2.52.28 5.52 0 10-3.94 10-8.8S17.52 2 12 2z"/></svg>
            </button>
            <div id="agentChatPanel" class="agent-chat-panel liquid-glass" hidden>
                <div class="agent-chat-header">
                    <span class="agent-chat-title">Asistente ROAL BURGER</span>
                    <button type="button" id="agentChatCloseBtn" class="agent-chat-close" aria-label="Cerrar chat">&#215;</button>
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

    function appendMessage(container, role, text) {
        const bubble = document.createElement('div');
        bubble.className = 'agent-chat-bubble ' + (role === 'user' ? 'agent-chat-bubble-user' : 'agent-chat-bubble-assistant');
        bubble.textContent = text;
        container.appendChild(bubble);
        container.scrollTop = container.scrollHeight;
    }

    function initAgentChat() {
        if (document.getElementById('agentChatWidget')) return;

        const wrap = buildWidgetMarkup();
        const fab = wrap.querySelector('#agentChatFab');
        const panel = wrap.querySelector('#agentChatPanel');
        const closeBtn = wrap.querySelector('#agentChatCloseBtn');
        const messagesEl = wrap.querySelector('#agentChatMessages');
        const typingEl = wrap.querySelector('#agentChatTyping');
        const input = wrap.querySelector('#agentChatInput');
        const sendBtn = wrap.querySelector('#agentChatSendBtn');
        const locationBtn = wrap.querySelector('#agentChatLocationBtn');

        const sessionId = getOrCreateSessionId();
        let opened = false;
        let sending = false;
        let pendingLocation = null;

        function openPanel() {
            panel.hidden = false;
            fab.setAttribute('aria-expanded', 'true');
            if (!opened) {
                opened = true;
                appendMessage(messagesEl, 'assistant', WELCOME_MESSAGE);
            }
            input.focus();
        }

        function closePanel() {
            panel.hidden = true;
            fab.setAttribute('aria-expanded', 'false');
        }

        fab.addEventListener('click', () => {
            if (panel.hidden) openPanel(); else closePanel();
        });
        closeBtn.addEventListener('click', closePanel);

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
                const result = await callable(payload);
                appendMessage(messagesEl, 'assistant', result.data && result.data.reply ? result.data.reply : 'No pude procesar tu mensaje, intenta de nuevo.');
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
