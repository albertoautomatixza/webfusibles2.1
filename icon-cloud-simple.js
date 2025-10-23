class IconCloudSimple {
    constructor(container, icons, options = {}) {
        this.container = container;
        this.icons = icons;
        this.radius = options.radius || 150;
        this.speed = options.speed || 1;
        this.autoRotate = options.autoRotate !== false;

        this.items = [];
        this.angleX = 0;
        this.angleY = 0;
        this.targetAngleX = 0;
        this.targetAngleY = 0;

        this.init();
    }

    init() {
        this.container.style.position = 'relative';
        this.container.style.width = `${this.radius * 2.5}px`;
        this.container.style.height = `${this.radius * 2.5}px`;
        this.container.style.perspective = '1000px';
        this.container.style.margin = '0 auto';

        this.createItems();
        this.setupMouseTracking();
        this.animate();
    }

    createItems() {
        const total = this.icons.length;

        this.icons.forEach((icon, i) => {
            const phi = Math.acos(-1 + (2 * i) / total);
            const theta = Math.sqrt(total * Math.PI) * phi;

            const item = document.createElement('div');
            item.style.position = 'absolute';
            item.style.left = '50%';
            item.style.top = '50%';
            item.style.transform = 'translate(-50%, -50%)';
            item.style.transition = 'all 0.3s ease';

            const img = document.createElement('img');
            img.src = icon.image;
            img.style.width = icon.width || '80px';
            img.style.height = icon.height || 'auto';
            img.style.objectFit = 'contain';
            img.style.filter = 'none';
            img.style.transition = 'all 0.3s ease';

            item.appendChild(img);
            this.container.appendChild(item);

            item.addEventListener('mouseenter', () => {
                img.style.transform = 'scale(1.2)';
            });

            item.addEventListener('mouseleave', () => {
                img.style.transform = 'scale(1)';
            });

            this.items.push({
                element: item,
                phi: phi,
                theta: theta,
                x: 0,
                y: 0,
                z: 0
            });
        });
    }

    setupMouseTracking() {
        this.container.addEventListener('mousemove', (e) => {
            const rect = this.container.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            this.targetAngleY = ((e.clientX - centerX) / rect.width) * Math.PI * 0.3;
            this.targetAngleX = ((e.clientY - centerY) / rect.height) * Math.PI * 0.3;
        });

        this.container.addEventListener('mouseleave', () => {
            this.targetAngleX = 0;
            this.targetAngleY = 0;
        });
    }

    updatePositions() {
        this.angleX += (this.targetAngleX - this.angleX) * 0.05;
        this.angleY += (this.targetAngleY - this.angleY) * 0.05;

        this.angleY += 0.005 * this.speed;
        this.angleX += 0.002 * this.speed;

        this.items.forEach((item) => {
            const x = this.radius * Math.sin(item.phi) * Math.cos(item.theta);
            const y = this.radius * Math.cos(item.phi);
            const z = this.radius * Math.sin(item.phi) * Math.sin(item.theta);

            const cosX = Math.cos(this.angleX);
            const sinX = Math.sin(this.angleX);
            const cosY = Math.cos(this.angleY);
            const sinY = Math.sin(this.angleY);

            const y1 = y * cosX - z * sinX;
            const z1 = z * cosX + y * sinX;
            const x1 = x * cosY - z1 * sinY;
            const z2 = z1 * cosY + x * sinY;

            const scale = (this.radius + z2) / (this.radius * 2);
            const opacity = (z2 + this.radius) / (this.radius * 2);

            item.element.style.transform = `
                translate(-50%, -50%)
                translate3d(${x1}px, ${y1}px, 0)
                scale(${scale})
            `;
            item.element.style.opacity = opacity * 0.7 + 0.3;
            item.element.style.zIndex = Math.floor(z2);
        });
    }

    animate() {
        this.updatePositions();
        requestAnimationFrame(() => this.animate());
    }
}

export default IconCloudSimple;
