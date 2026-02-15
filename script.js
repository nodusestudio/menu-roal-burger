// ========== PANTALLA DE ENTRADA Y SPLASH SCREEN ==========

// Variables globales
let preEntryScreen = null;
let splashScreen = null;
let introVideo = null;
let skipButton = null;
let enterButton = null;

// Inicializar cuando la página carga
document.addEventListener('DOMContentLoaded', function() {
    preEntryScreen = document.getElementById('pre-entry');
    splashScreen = document.getElementById('splash-screen');
    introVideo = document.getElementById('intro-video');
    skipButton = document.getElementById('skip-btn');
    enterButton = document.getElementById('enter-btn');
    
    // Event listener para el botón de entrar
    if (enterButton) {
        enterButton.addEventListener('click', startVideoExperience);
    }
    
    // Event listener para cuando el video termine
    if (introVideo) {
        introVideo.addEventListener('ended', function() {
            console.log('🎬 Video terminado - cerrando splash screen automáticamente');
            closeSplashScreen();
        });
        introVideo.addEventListener('error', function(error) {
            console.log('⚠️ Error en el video:', error);
            closeSplashScreen();
        });
    }
    
    // Event listener para el botón de saltar
    if (skipButton) {
        skipButton.addEventListener('click', closeSplashScreen);
    }
});

// Función para iniciar la experiencia de video
function startVideoExperience() {
    if (preEntryScreen && splashScreen && introVideo) {
        // Ocultar pantalla de entrada
        preEntryScreen.classList.add('fade-out');
        
        setTimeout(() => {
            preEntryScreen.style.display = 'none';
            
            // Mostrar splash screen
            splashScreen.style.display = 'flex';
            
            // Usar promesa para asegurar reproducción con sonido
            introVideo.play().then(() => {
                console.log('🔊 Video iniciado CON SONIDO - Interacción del usuario capturada');
                
                // Mostrar botón de saltar después de 2 segundos
                setTimeout(() => {
                    if (skipButton && !splashScreen.classList.contains('fade-out')) {
                        skipButton.classList.add('show');
                    }
                }, 2000);
                
            }).catch(error => {
                console.log('⚠️ Error al reproducir video con sonido:', error);
                console.log('🔇 Intentando reproducir sin sonido como respaldo...');
                
                // Respaldo: reproducir sin sonido si hay error
                introVideo.muted = true;
                introVideo.play().then(() => {
                    console.log('🔇 Video reproduciendo sin sonido (respaldo)');
                    
                    setTimeout(() => {
                        if (skipButton && !splashScreen.classList.contains('fade-out')) {
                            skipButton.classList.add('show');
                        }
                    }, 2000);
                    
                }).catch(() => {
                    console.log('❌ Error total de reproducción - cerrando splash');
                    closeSplashScreen();
                });
            });
            
        }, 600);
    }
}

// Función para cerrar el splash screen
function closeSplashScreen() {
    if (splashScreen && !splashScreen.classList.contains('fade-out')) {
        console.log('🚪 Cerrando splash screen - revelando menú principal');
        splashScreen.classList.add('fade-out');
        
        // Remover completamente el splash screen después de la animación
        setTimeout(() => {
            if (splashScreen) {
                splashScreen.style.display = 'none';
                splashScreen.remove();
            }
            if (preEntryScreen) {
                preEntryScreen.style.display = 'none';
                preEntryScreen.remove();
            }
            
            // MOSTRAR EL MENÚ PRINCIPAL SOLO AHORA
            const mainMenu = document.getElementById('main-menu');
            if (mainMenu) {
                mainMenu.style.visibility = 'visible';
                console.log('✅ Menú de ROAL BURGER ahora visible');
            }
        }, 500);
        
        // Pausar el video para liberar recursos
        if (introVideo) {
            introVideo.pause();
            introVideo.currentTime = 0; // Resetear al inicio
        }
    }
}

// ========== FIN PANTALLA DE ENTRADA ==========

// ========== FUNCIONES DE TRACKING ==========

// Función principal para rastrear clics en botones
function trackButtonClick(buttonId, buttonName) {
    // Log para verificación
    console.log(`🎯 CLICK TRACKED: ${buttonName} (ID: ${buttonId}) - Timestamp: ${new Date().toISOString()}`);
    
    // Google Analytics 4 - ACTIVO
    if (typeof gtag === 'function') {
        gtag('event', 'click', {
            event_category: 'engagement',
            event_label: buttonName,
            button_id: buttonId
        });
    }
    
    // Microsoft Clarity tracking - ACTIVO
    if (window.clarity) {
        window.clarity("set", "button_interaction", buttonName);
        window.clarity("set", "button_id", buttonId);
    }
}

// Función específica para rastrear interés por productos
function trackProductInterest(productName, buttonId) {
    // Log detallado para productos
    console.log(`🍔 INTERÉS EN PRODUCTO: ${productName} (Botón: ${buttonId}) - Timestamp: ${new Date().toISOString()}`);
    
    // Google Analytics 4 - Evento de interés en producto - ACTIVO
    if (typeof gtag === 'function') {
        gtag('event', 'interes_producto', {
            event_category: 'ecommerce',
            event_label: productName,
            item_name: productName,
            button_location: buttonId,
            action: 'whatsapp_interest'
        });
        
        // También como evento de select_item para ecommerce
        gtag('event', 'select_item', {
            item_list_name: 'Lo Mas Pedido',
            items: [{
                item_name: productName,
                item_category: 'Producto Principal'
            }]
        });
    }
    
    // Microsoft Clarity tracking para productos - ACTIVO
    if (window.clarity) {
        window.clarity("set", "producto_interes", productName);
        window.clarity("set", "button_clicked", buttonId);
    }
    
    // Llamar también al tracking general
    trackButtonClick(buttonId, `Interés en ${productName}`);
}

// Función para rastrear apertura del modal del menú
function trackMenuModal() {
    console.log('🍔 MENÚ MODAL ABIERTO - Timestamp: ' + new Date().toISOString());
    
    // Google Analytics 4 - ACTIVO
    if (typeof gtag === 'function') {
        gtag('event', 'view_item_list', {
            event_category: 'engagement',
            event_label: 'Menu Digital',
            item_list_name: 'Menu ROAL BURGER'
        });
    }
    
    // Microsoft Clarity tracking del menú - ACTIVO
    if (window.clarity) {
        window.clarity("set", "menu_modal", "opened");
        window.clarity("set", "user_action", "view_menu");
    }
}

// ========== FUNCIONES ORIGINALES ACTUALIZADAS ==========

// Función para abrir enlaces
function openLink(platform) {
    // Reproducir sonido de clic
    playClickSound();
    
    // Si es el menú, abrir modal en lugar de enlace externo
    if (platform === 'menu') {
        openMenuModal();
        trackMenuModal(); // Tracking del modal
        return;
    }
    
    const links = {
        whatsapp: 'https://wa.me/573144689509?text=Hola%20ROAL%20BURGER!%20Quisiera%20realizar%20un%20pedido%20por%20favor',
        instagram: 'https://www.instagram.com/roalburgerarmenia?igsh=cWE2eGRyNnlxaXgy&utm_source=qr',
        tiktok: 'https://www.tiktok.com/@roalburger',
        facebook: 'https://www.facebook.com/share/17ukpFaQz3/?mibextid=wwXIfr'
    };

    if (links[platform]) {
        window.open(links[platform], '_blank');
    }
}

// Función para abrir la modal del menú
function openMenuModal() {
    const modal = document.getElementById('menuModal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevenir scroll del body
}

// Función para cerrar la modal del menú
function closeMenuModal() {
    const modal = document.getElementById('menuModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // Restaurar scroll del body
}

// Cerrar modal al hacer clic fuera del contenido
window.onclick = function(event) {
    const modal = document.getElementById('menuModal');
    if (event.target === modal) {
        closeMenuModal();
    }
}

// Cerrar modal con la tecla ESC
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeMenuModal();
    }
});

// Función para reproducir sonido de clic
function playClickSound() {
    // Crear contexto de audio
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // Crear oscilador para el sonido
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Conectar oscilador al gain y al destino
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Configurar sonido (frecuencia alta y breve)
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.type = 'sine';
    
    // Configurar volumen (muy bajo para ser sutil)
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    // Reproducir sonido muy breve
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

// Animación de entrada para los botones
document.addEventListener('DOMContentLoaded', function() {
    const buttons = document.querySelectorAll('.link-button');
    const infoCard = document.querySelector('.info-card');
    
    // Animación de la tarjeta de información
    setTimeout(() => {
        infoCard.style.opacity = '0';
        infoCard.style.transform = 'translateY(20px)';
        infoCard.style.transition = 'all 0.6s ease';
        
        setTimeout(() => {
            infoCard.style.opacity = '1';
            infoCard.style.transform = 'translateY(0)';
        }, 100);
    }, 200);
    
    // Animación de los botones
    buttons.forEach((button, index) => {
        button.style.opacity = '0';
        button.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            button.style.transition = 'all 0.6s ease';
            button.style.opacity = '1';
            button.style.transform = 'translateY(0)';
        }, 300 + (index * 100));
    });
});

// Efecto de partículas al hacer hover (opcional)
document.querySelectorAll('.link-button').forEach(button => {
    button.addEventListener('mouseenter', function() {
        this.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    });
    
    button.addEventListener('mouseleave', function() {
        this.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    });
});

// Añadir efecto de ripple al hacer clic
document.querySelectorAll('.link-button').forEach(button => {
    button.addEventListener('click', function(e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');
        
        this.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
});

// CSS para el efecto ripple
const style = document.createElement('style');
style.textContent = `
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: ripple-animation 0.6s ease-out;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
