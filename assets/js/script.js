(() => {
  "use strict";

  const PLACEHOLDER_BACKGROUND = "#E5EFF8";
  const PLACEHOLDER_FOREGROUND = "#214464";

  const createSVGPlaceholder = (width, height, label) => {
    const fontSize = Math.max(12, Math.floor(Math.min(width, height) / 5));
    const radius = Math.floor(Math.min(width, height) * 0.06);
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <rect fill="${PLACEHOLDER_BACKGROUND}" width="${width}" height="${height}" rx="${radius}" ry="${radius}" />
        <text x="50%" y="50%" fill="${PLACEHOLDER_FOREGROUND}" font-family="Arial, sans-serif" font-size="${fontSize}" dominant-baseline="middle" text-anchor="middle">${label}</text>
      </svg>
    `;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  };

  class IconCloudSimple {
    constructor(container, icons, options = {}) {
      this.container = container;
      this.icons = icons;
      this.radius = options.radius ?? 150;
      this.speed = options.speed ?? 1;
      this.items = [];
      this.angleX = 0;
      this.angleY = 0;
      this.targetAngleX = 0;
      this.targetAngleY = 0;
      this.animationFrame = null;
      this.init();
    }

    init() {
      this.container.style.position = "relative";
      this.container.style.width = `${this.radius * 2.5}px`;
      this.container.style.height = `${this.radius * 2.5}px`;
      this.container.style.perspective = "1000px";
      this.container.style.margin = "0 auto";
      this.createItems();
      this.setupMouseTracking();
      this.animate();
    }

    createItems() {
      const total = this.icons.length;
      this.icons.forEach((icon, index) => {
        const phi = Math.acos(-1 + (2 * index) / total);
        const theta = Math.sqrt(total * Math.PI) * phi;
        const item = document.createElement("div");
        item.className = "icon-cloud-item";

        const img = document.createElement("img");
        img.src = icon.src;
        img.alt = icon.alt;
        img.width = icon.width;
        img.height = icon.height;
        img.loading = "lazy";
        img.decoding = "async";

        item.appendChild(img);
        this.container.appendChild(item);
        this.items.push({ element: item, phi, theta, x: 0, y: 0, z: 0 });
      });
    }

    setupMouseTracking() {
      this.container.addEventListener("mousemove", (event) => {
        const rect = this.container.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        this.targetAngleY = ((event.clientX - centerX) / rect.width) * Math.PI * 0.3;
        this.targetAngleX = ((event.clientY - centerY) / rect.height) * Math.PI * 0.3;
      });

      this.container.addEventListener("mouseleave", () => {
        this.targetAngleX = 0;
        this.targetAngleY = 0;
      });
    }

    updatePositions() {
      this.angleX += (this.targetAngleX - this.angleX) * 0.05;
      this.angleY += (this.targetAngleY - this.angleY) * 0.05;
      this.angleY += 0.005 * this.speed;

      const sinX = Math.sin(this.angleX);
      const cosX = Math.cos(this.angleX);
      const sinY = Math.sin(this.angleY);
      const cosY = Math.cos(this.angleY);

      this.items.forEach((item) => {
        const sinPhi = Math.sin(item.phi);
        const cosPhi = Math.cos(item.phi);
        const sinTheta = Math.sin(item.theta + this.angleY);
        const cosTheta = Math.cos(item.theta + this.angleY);

        item.x = this.radius * sinPhi * cosTheta;
        item.y = this.radius * (cosPhi * cosX - sinPhi * sinTheta * sinX);
        item.z = this.radius * (cosPhi * sinX + sinPhi * sinTheta * cosX);

        const scale = (item.z + this.radius) / (2 * this.radius) + 0.5;
        const opacity = 0.5 + (item.z + this.radius) / (2 * this.radius);

        item.element.style.transform = `translate3d(${item.x}px, ${item.y}px, ${item.z}px) scale(${scale})`;
        item.element.style.opacity = opacity.toFixed(2);
        item.element.style.zIndex = `${Math.round(item.z)}`;
      });
    }

    animate() {
      this.updatePositions();
      this.animationFrame = requestAnimationFrame(() => this.animate());
    }
  }

  const createIconCloud = () => {
    const heroVisual = document.querySelector(".hero-visual-content");
    if (!heroVisual) return;

    const cloud = document.createElement("div");
    cloud.className = "icon-cloud-container";
    heroVisual.appendChild(cloud);

    const icons = [
      { alt: "Eaton", width: 120, height: 42 },
      { alt: "Bussmann", width: 120, height: 42 },
      { alt: "Siemens", width: 120, height: 42 },
      { alt: "Weidmüller", width: 130, height: 44 },
      { alt: "HELUKABEL", width: 120, height: 42 },
      { alt: "Legrand", width: 130, height: 44 },
      { alt: "Kyoritsu", width: 130, height: 44 },
      { alt: "Gold Electric", width: 120, height: 42 },
      { alt: "Bauser", width: 120, height: 42 },
      { alt: "Wiska", width: 130, height: 44 },
      { alt: "Wain Electric", width: 130, height: 44 },
      { alt: "Taiwan Meters Plant", width: 120, height: 42 },
      { alt: "Marca eléctrica", width: 120, height: 42 },
      { alt: "Marca de control", width: 120, height: 42 },
      { alt: "Instrumentación", width: 120, height: 42 }
    ].map((icon) => ({
      ...icon,
      src: createSVGPlaceholder(icon.width, icon.height, icon.alt)
    }));

    new IconCloudSimple(cloud, icons, { radius: 160, speed: 1 });
  };

  const initNavigation = () => {
    const navToggle = document.querySelector(".nav-toggle");
    const navMenu = document.querySelector(".nav-menu");

    if (!navToggle || !navMenu) return;

    navToggle.addEventListener("click", () => {
      const expanded = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!expanded));
      navMenu.classList.toggle("active");
    });

    navMenu.querySelectorAll("a[href^='#']").forEach((link) => {
      link.addEventListener("click", (event) => {
        const targetSelector = link.getAttribute("href");
        if (!targetSelector || targetSelector === "#") return;

        const target = document.querySelector(targetSelector);
        if (!target) return;

        event.preventDefault();
        navMenu.classList.remove("active");
        navToggle.setAttribute("aria-expanded", "false");

        const header = document.querySelector(".header");
        const headerHeight = header ? header.offsetHeight : 0;
        const top = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
        window.scrollTo({ top, behavior: "smooth" });
      });
    });
  };

  const initScrollEffects = () => {
    const header = document.querySelector(".header");
    const scrollBtn = document.getElementById("scrollToTop");

    const handleScroll = () => {
      const current = window.pageYOffset;
      if (header) {
        header.classList.toggle("scrolled", current > 50);
      }
      if (scrollBtn) {
        scrollBtn.classList.toggle("visible", current > (window.innerHeight || 800));
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    if (scrollBtn) {
      scrollBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  };

  const initContactForm = () => {
    const form = document.getElementById("formularioContacto");
    if (!form) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const payload = Object.fromEntries(data.entries());
      console.log("Formulario enviado:", payload);
      alert("Gracias por contactarnos. Nos pondremos en contacto contigo pronto.");
      form.reset();
    });
  };

  const initRevealObserver = () => {
    const elements = document.querySelectorAll(
      ".sector-card, .producto-card, .marca-item, .valor-item"
    );

    if (!elements.length || !("IntersectionObserver" in window)) return;

    elements.forEach((element) => {
      element.style.opacity = "0";
      element.style.transform = "translateY(30px)";
      element.style.transition = "opacity .6s ease, transform .6s ease";
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );

    elements.forEach((element) => observer.observe(element));
  };

  const initProductUpdater = () => {
    window.actualizarProductos = (productos = []) => {
      const container = document.getElementById("productosContainer");
      if (!container) return;

      container.innerHTML = "";

      productos.forEach((producto) => {
        const card = document.createElement("article");
        card.className = "producto-card";

        const imageWrap = document.createElement("div");
        imageWrap.className = "producto-image";

        const img = document.createElement("img");
        const nombre = producto.nombre || "Producto";
        img.src = producto.imagen || createSVGPlaceholder(320, 200, nombre);
        img.alt = producto.alt || producto.descripcion || nombre;
        img.loading = "lazy";
        img.width = 320;
        img.height = 200;

        imageWrap.appendChild(img);
        card.appendChild(imageWrap);

        const title = document.createElement("h3");
        title.className = "producto-title";
        title.textContent = nombre;
        card.appendChild(title);

        const desc = document.createElement("p");
        desc.className = "producto-description";
        desc.textContent =
          producto.descripcion || "Consulta a nuestro equipo para más información.";
        card.appendChild(desc);

        const link = document.createElement("a");
        link.className = "producto-link";
        link.href = producto.fichaTecnica || "#contacto";
        link.textContent = "Solicitar ficha técnica";
        card.appendChild(link);

        container.appendChild(card);
      });
    };
  };

  const initBeamConnections = () => {
    const container = document.querySelector(".caracteristicas-conexion");
    if (!container) return;

    const layout = container.querySelector(".beam-layout");
    const overlay = container.querySelector(".beam-overlay");
    const center = container.querySelector("[data-beam-center]");

    if (!layout || !overlay || !center) return;

    const svgNS = "http://www.w3.org/2000/svg";
    overlay.innerHTML = "";

    const defs = document.createElementNS(svgNS, "defs");
    defs.innerHTML =
      '<linearGradient id="beam-gradient" x1="0%" y1="0%" x2="100%" y2="0%">' +
      '<stop offset="0%" stop-color="#9cc9ff" stop-opacity="0.2"></stop>' +
      '<stop offset="50%" stop-color="#197acf" stop-opacity="1"></stop>' +
      '<stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.6"></stop>' +
      '</linearGradient>';
    overlay.appendChild(defs);

    const baseGroup = document.createElementNS(svgNS, "g");
    const glowGroup = document.createElementNS(svgNS, "g");
    overlay.append(baseGroup, glowGroup);

    const connections = [];
    const createConnection = (from, to, curve, delay) => {
      const pathBase = document.createElementNS(svgNS, "path");
      pathBase.setAttribute("class", "beam-path-base");

      const pathGlow = document.createElementNS(svgNS, "path");
      pathGlow.setAttribute("class", "beam-path-glow");
      pathGlow.style.setProperty("--beam-delay", `${delay * 0.65}s`);

      baseGroup.appendChild(pathBase);
      glowGroup.appendChild(pathGlow);
      connections.push({ from, to, curve, pathBase, pathGlow });
    };

    const leftNodes = [...container.querySelectorAll('[data-beam-target="core"]')];
    const rightNodes = [...container.querySelectorAll('[data-beam-source="core"]')];

    leftNodes.forEach((node, index) =>
      createConnection(node, center, node.dataset.beamCurve || "auto", index)
    );
    rightNodes.forEach((node, index) =>
      createConnection(center, node, node.dataset.beamCurve || "auto", leftNodes.length + index)
    );

    const computePath = (fromRect, toRect, curve) => {
      const containerRect = container.getBoundingClientRect();
      const x1 = fromRect.left + fromRect.width / 2 - containerRect.left;
      const y1 = fromRect.top + fromRect.height / 2 - containerRect.top;
      const x2 = toRect.left + toRect.width / 2 - containerRect.left;
      const y2 = toRect.top + toRect.height / 2 - containerRect.top;

      const deltaX = x2 - x1;
      const deltaY = y2 - y1;
      const distance = Math.hypot(deltaX, deltaY);

      let direction = 0;
      if (curve === "up") direction = -1;
      else if (curve === "down") direction = 1;
      else if (curve === "mid") direction = 0;
      else direction = deltaY >= 0 ? 1 : -1;

      let offset = Math.min(Math.abs(deltaX) * 0.28 + distance * 0.08, 160);
      if (direction === 0) {
        const fallback = deltaY === 0 ? (deltaX > 0 ? -1 : 1) : Math.sign(deltaY);
        offset = fallback * Math.min(Math.abs(deltaX) * 0.18 + 48, 120);
      } else {
        offset *= direction;
      }

      const cp1x = x1 + deltaX * 0.35;
      const cp1y = y1 + offset;
      const cp2x = x2 - deltaX * 0.35;
      const cp2y = y2 + offset * 0.7;
      return `M${x1},${y1} C${cp1x},${cp1y} ${cp2x},${cp2y} ${x2},${y2}`;
    };

    const updatePaths = () => {
      const containerRect = container.getBoundingClientRect();
      overlay.setAttribute("viewBox", `0 0 ${containerRect.width} ${containerRect.height}`);
      overlay.setAttribute("width", containerRect.width);
      overlay.setAttribute("height", containerRect.height);

      connections.forEach((connection) => {
        const fromRect = connection.from.getBoundingClientRect();
        const toRect = connection.to.getBoundingClientRect();
        const d = computePath(fromRect, toRect, connection.curve);
        connection.pathBase.setAttribute("d", d);
        connection.pathGlow.setAttribute("d", d);
      });
    };

    updatePaths();

    if ("ResizeObserver" in window) {
      const resizeObserver = new ResizeObserver(() => requestAnimationFrame(updatePaths));
      resizeObserver.observe(container);
    }

    window.addEventListener("resize", updatePaths);
  };

  document.addEventListener("DOMContentLoaded", () => {
    createIconCloud();
    initNavigation();
    initScrollEffects();
    initContactForm();
    initRevealObserver();
    initProductUpdater();
    initBeamConnections();
    console.log("Sitio inicializado sin dependencias de binarios.");
  });
})();
