// Función para abrir enlaces
function openLink(platform) {
    const links = {
        menu: 'https://tu-menu-digital.com', // Reemplaza con tu enlace de menú
        whatsapp: 'https://wa.me/573001234567?text=Hola%20ROAL%20BURGER,%20quiero%20hacer%20un%20pedido', // Reemplaza con tu número
        instagram: 'https://instagram.com/roalburger', // Reemplaza con tu Instagram
        tiktok: 'https://tiktok.com/@roalburger', // Reemplaza con tu TikTok
        facebook: 'https://facebook.com/roalburger' // Reemplaza con tu Facebook
    };

    if (links[platform]) {
        window.open(links[platform], '_blank');
    }
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
