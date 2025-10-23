import IconCloudSimple from './icon-cloud-simple.js';

document.addEventListener('DOMContentLoaded', function() {

    const heroVisualContent = document.querySelector('.hero-visual-content');
    if (heroVisualContent) {
        const cloudContainer = document.createElement('div');
        cloudContainer.className = 'icon-cloud-container';
        heroVisualContent.appendChild(cloudContainer);

        const icons = [
            { image: '/Recurso 172.png', width: '80px', height: '28px' },
            { image: '/Recurso 187.png', width: '90px', height: '32px' },
            { image: '/Recurso 149.png', width: '100px', height: '22px' },
            { image: '/Recurso 151.png', width: '110px', height: '24px' },
            { image: '/image copy copy.png', width: '95px', height: '30px' },
            { image: '/Recurso 184.png', width: '110px', height: '24px' },
            { image: '/Asset 77.png', width: '105px', height: '26px' },
            { image: '/Asset 78.png', width: '85px', height: '30px' },
            { image: '/Asset 79.png', width: '90px', height: '28px' },
            { image: '/Asset 80.png', width: '100px', height: '26px' },
            { image: '/Asset 81.png', width: '110px', height: '24px' },
            { image: '/Asset 82.png', width: '100px', height: '24px' },
            { image: '/Asset 83.png', width: '90px', height: '26px' },
            { image: '/Asset 85.png', width: '105px', height: '28px' },
            { image: '/Asset 86.png', width: '95px', height: '30px' }
        ];

        const iconCloud = new IconCloudSimple(cloudContainer, icons, {
            radius: 160,
            speed: 1
        });
    }

    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-menu a');

    if (navToggle) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
            }
        });
    });

    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    const header = document.querySelector('.header');
    const scrollToTopBtn = document.getElementById('scrollToTop');
    let lastScroll = 0;

    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        const heroSection = document.querySelector('.hero');
        const heroHeight = heroSection ? heroSection.offsetHeight : 800;

        if (currentScroll > heroHeight) {
            scrollToTopBtn.classList.add('visible');
        } else {
            scrollToTopBtn.classList.remove('visible');
        }

        lastScroll = currentScroll;
    });

    scrollToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    const formulario = document.getElementById('formularioContacto');
    if (formulario) {
        formulario.addEventListener('submit', function(e) {
            e.preventDefault();

            const nombre = document.getElementById('nombre').value;
            const correo = document.getElementById('correo').value;
            const telefono = document.getElementById('telefono').value;
            const mensaje = document.getElementById('mensaje').value;

            console.log('Formulario enviado:', {
                nombre,
                correo,
                telefono,
                mensaje
            });

            alert('Gracias por contactarnos. Nos pondremos en contacto contigo pronto.');

            formulario.reset();
        });
    }

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    const animateElements = document.querySelectorAll('.sector-card, .producto-card, .marca-item, .valor-item');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    function cargarProductosDesdeGoogleSheets() {
        console.log('Función preparada para integración con Google Sheets');
    }

    window.actualizarProductos = function(productos) {
        const container = document.getElementById('productosContainer');
        if (!container) return;

        container.innerHTML = '';

        productos.forEach(producto => {
            const card = document.createElement('div');
            card.className = 'producto-card';

            card.innerHTML = `
                <div class="producto-image">
                    <img src="${producto.imagen || 'assets/img/placeholder.jpg'}" alt="${producto.nombre}">
                </div>
                <h3 class="producto-title">${producto.nombre}</h3>
                <p class="producto-description">${producto.descripcion}</p>
                <a href="${producto.fichaTecnica || '#'}" class="producto-link">Ver ficha técnica</a>
            `;

            container.appendChild(card);
        });
    };

    console.log('Script inicializado correctamente');
});
