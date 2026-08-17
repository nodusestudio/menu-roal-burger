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
        if (profile && profile.customerName) {
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
                    messages.forEach((m) => appendMessage(messagesEl, m.role, m.text));
                    return;
                }
            } catch (_err) {
                // Si falla la carga del historial, seguimos con el saludo normal.
            }
            appendMessage(messagesEl, 'assistant', buildWelcomeMessage(customerProfile));
        }

        function openPanel() {
            panel.hidden = false;
            banner.hidden = true;
            document.body.style.overflow = 'hidden';
            loadHistoryIfNeeded();
            input.focus();
        }

        function closePanel() {
            panel.hidden = true;
            banner.hidden = false;
            document.body.style.overflow = '';
        }

        banner.addEventListener('click', openPanel);
        backBtn.addEventListener('click', closePanel);

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
