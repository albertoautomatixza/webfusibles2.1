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
      ".sector-card, .catalogo-slider, .marca-item, .valor-item"
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

  const parseGoogleSheetResponse = (raw) => {
    if (!raw) return [];

    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return [];

    try {
      const json = JSON.parse(raw.slice(start, end + 1));
      const rows = json?.table?.rows ?? [];

      const normalize = (value) =>
        typeof value === "string" ? value.trim() : value ? String(value).trim() : "";

      return rows
        .map((row) => row?.c ?? [])
        .map((cells) => ({
          nombre: normalize(cells[0]?.v) || normalize(cells[0]?.f),
          descripcion: normalize(cells[1]?.v) || normalize(cells[1]?.f),
          categoria: normalize(cells[2]?.v) || normalize(cells[2]?.f),
          imagen: normalize(cells[3]?.v) || normalize(cells[3]?.f),
          cta: normalize(cells[4]?.v) || normalize(cells[4]?.f),
          enlace: normalize(cells[5]?.v) || normalize(cells[5]?.f),
          ctaSecundaria: normalize(cells[6]?.v) || normalize(cells[6]?.f),
          enlaceSecundario: normalize(cells[7]?.v) || normalize(cells[7]?.f),
          alt: normalize(cells[8]?.v) || normalize(cells[8]?.f)
        }))
        .filter((item) => item.nombre || item.descripcion || item.imagen)
        .filter((item) => {
          const candidate = (item.nombre || "").toLowerCase();
          return candidate !== "nombre" && candidate !== "producto" && candidate !== "título" && candidate !== "titulo";
        });
    } catch (error) {
      console.warn("No se pudo interpretar la respuesta de Google Sheets", error);
      return [];
    }
  };

  const initDynamicCatalog = () => {
    const section = document.querySelector("[data-google-sheet]");
    if (!section) return;

    const slider = section.querySelector(".catalogo-slider");
    const stage = section.querySelector("#catalogoStage");
    const dots = section.querySelector("#catalogoDots");
    const prevBtn = section.querySelector("[data-slider-prev]");
    const nextBtn = section.querySelector("[data-slider-next]");

    if (!slider || !stage || !dots || !prevBtn || !nextBtn) return;

    const state = {
      items: [],
      current: 0,
      autoplay: null
    };

    const AUTOPLAY_INTERVAL = 8000;

    const fallbackProducts = [
      {
        nombre: "Torretas S125D",
        descripcion:
          "Balizas LED de alta intensidad para monitoreo visual en líneas de producción industriales.",
        categoria: "Señalización",
        imagen: "https://placehold.co/960x640/11243d/ffffff?text=Torretas+S125D",
        cta: "Solicitar cotización",
        enlace: "#contacto",
        ctaSecundaria: "Ver ficha técnica",
        enlaceSecundario: "#contacto",
        alt: "Balizas para señalización industrial"
      },
      {
        nombre: "Gabinetes NEMA",
        descripcion:
          "Gabinetes para tableros de control con sellado IP66 listos para automatización y maniobra.",
        categoria: "Distribución",
        imagen: "https://placehold.co/960x640/183a5c/ffffff?text=Gabinetes+Industriales",
        cta: "Agenda una llamada",
        enlace: "#contacto",
        ctaSecundaria: "Descargar catálogo",
        enlaceSecundario: "#contacto",
        alt: "Gabinete metálico para tablero eléctrico"
      },
      {
        nombre: "Sensores de proximidad",
        descripcion:
          "Detectores inductivos y capacitivos para automatización de procesos con certificaciones internacionales.",
        categoria: "Automatización",
        imagen: "https://placehold.co/960x640/1f4d7a/ffffff?text=Sensores+Industriales",
        cta: "Hablar con un asesor",
        enlace: "#contacto",
        ctaSecundaria: "Solicitar demo",
        enlaceSecundario: "#contacto",
        alt: "Sensores industriales montados en riel"
      }
    ];

    const setLoading = (value) => {
      if (value) {
        slider.setAttribute("data-loading", "true");
      } else {
        slider.removeAttribute("data-loading");
      }
    };

    const stopAutoplay = () => {
      if (state.autoplay) {
        clearInterval(state.autoplay);
        state.autoplay = null;
      }
    };

    const startAutoplay = () => {
      stopAutoplay();
      if (state.items.length <= 1) return;
      state.autoplay = setInterval(() => goTo(state.current + 1), AUTOPLAY_INTERVAL);
    };

    const updateDots = () => {
      const total = state.items.length;
      const dotButtons = dots.querySelectorAll(".catalogo-dot");
      dotButtons.forEach((dot, index) => {
        const isActive = index === state.current;
        dot.classList.toggle("is-active", isActive);
        dot.setAttribute("aria-selected", String(isActive));
        dot.setAttribute("tabindex", isActive ? "0" : "-1");
        dot.setAttribute(
          "aria-label",
          `${dot.dataset.nombre || "Producto"} (${index + 1} de ${total})`
        );
      });

      if (state.items.length <= 1) {
        prevBtn.setAttribute("disabled", "true");
        nextBtn.setAttribute("disabled", "true");
      } else {
        prevBtn.removeAttribute("disabled");
        nextBtn.removeAttribute("disabled");
      }
    };

    const goTo = (index, manual = false) => {
      if (!state.items.length) return;

      const total = state.items.length;
      const target = ((index % total) + total) % total;

      state.items.forEach((slide, idx) => {
        const active = idx === target;
        slide.classList.toggle("is-active", active);
        slide.setAttribute("aria-hidden", active ? "false" : "true");
        slide.setAttribute("tabindex", active ? "0" : "-1");
      });

      state.current = target;
      updateDots();

      if (manual) {
        startAutoplay();
      }
    };

    const createSlide = (producto) => {
      const nombre = producto.nombre || "Producto destacado";
      const slide = document.createElement("article");
      slide.className = "catalogo-slide";
      slide.setAttribute("role", "tabpanel");
      slide.setAttribute("aria-hidden", "true");

      const media = document.createElement("div");
      media.className = "catalogo-media";

      const img = document.createElement("img");
      img.src = producto.imagen || createSVGPlaceholder(900, 560, nombre);
      img.alt = producto.alt || producto.descripcion || nombre;
      img.loading = "lazy";
      img.width = 900;
      img.height = 560;
      img.decoding = "async";

      media.appendChild(img);
      slide.appendChild(media);

      const info = document.createElement("div");
      info.className = "catalogo-info";

      const pill = document.createElement("span");
      pill.className = "catalogo-pill";
      pill.textContent = producto.categoria || "Catálogo en línea";
      info.appendChild(pill);

      const title = document.createElement("h3");
      title.className = "catalogo-title";
      title.textContent = nombre;
      info.appendChild(title);

      const desc = document.createElement("p");
      desc.className = "catalogo-description";
      desc.textContent =
        producto.descripcion ||
        "Ofrecemos sensores, protecciones y tableros certificados con disponibilidad inmediata y soporte especializado para tus proyectos.";
      info.appendChild(desc);

      const ctaGroup = document.createElement("div");
      ctaGroup.className = "catalogo-cta-group";

      const primaryCta = document.createElement("a");
      primaryCta.className = "catalogo-cta catalogo-cta--primary";
      primaryCta.href = producto.enlace || "#contacto";
      primaryCta.textContent = producto.cta || "Solicitar cotización";
      primaryCta.rel = "noopener";
      ctaGroup.appendChild(primaryCta);

      const secondaryText = producto.ctaSecundaria || "Hablar con un asesor";
      const secondaryLink = producto.enlaceSecundario || "#contacto";
      if (secondaryText) {
        const secondaryCta = document.createElement("a");
        secondaryCta.className = "catalogo-cta catalogo-cta--secondary";
        secondaryCta.href = secondaryLink;
        secondaryCta.textContent = secondaryText;
        secondaryCta.rel = "noopener";
        ctaGroup.appendChild(secondaryCta);
      }

      info.appendChild(ctaGroup);
      slide.appendChild(info);

      return slide;
    };

    const renderProductos = (productos) => {
      stage.innerHTML = "";
      dots.innerHTML = "";

      if (!productos.length) {
        state.items = [];
        stopAutoplay();
        updateDots();
        return;
      }

      productos.forEach((producto, index) => {
        const slide = createSlide(producto);
        slide.dataset.index = String(index);
        stage.appendChild(slide);

        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "catalogo-dot";
        dot.dataset.nombre = producto.nombre || "Producto";
        dot.setAttribute("role", "tab");
        dot.addEventListener("click", () => goTo(index, true));
        dots.appendChild(dot);
      });

      state.items = Array.from(stage.children);
      goTo(0);
      startAutoplay();
    };

    const handleProductos = (productos) => {
      setLoading(false);
      if (!productos.length) {
        console.info("Se usará el catálogo de respaldo");
        renderProductos(fallbackProducts);
        return;
      }
      renderProductos(productos);
    };

    const cargarDesdeHoja = async () => {
      const sheetUrl = section.dataset.googleSheet?.trim();
      if (!sheetUrl) {
        handleProductos(fallbackProducts);
        return;
      }

      setLoading(true);

      try {
        const response = await fetch(sheetUrl, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Estado ${response.status}`);
        }
        const text = await response.text();
        const productos = parseGoogleSheetResponse(text);
        handleProductos(productos);
      } catch (error) {
        console.warn("No fue posible cargar el catálogo desde Google Sheets", error);
        handleProductos([]);
      }
    };

    const exposeUpdater = () => {
      window.actualizarProductos = (productos = []) => {
        if (!Array.isArray(productos)) return;
        setLoading(false);
        renderProductos(productos);
      };
    };

    prevBtn.addEventListener("click", () => goTo(state.current - 1, true));
    nextBtn.addEventListener("click", () => goTo(state.current + 1, true));

    slider.addEventListener("mouseenter", stopAutoplay);
    slider.addEventListener("mouseleave", startAutoplay);

    exposeUpdater();
    cargarDesdeHoja();
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
      '<stop offset="0%" stop-color="#d9e7fb" stop-opacity="0"></stop>' +
      '<stop offset="35%" stop-color="#1f6edc" stop-opacity="0.95"></stop>' +
      '<stop offset="65%" stop-color="#1f6edc" stop-opacity="0.85"></stop>' +
      '<stop offset="100%" stop-color="#d9e7fb" stop-opacity="0"></stop>' +
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
      createConnection(center, node, node.dataset.beamCurve || "auto", index)
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

        const length = connection.pathGlow.getTotalLength();
        const segment = Math.min(Math.max(length * 0.32, 48), 140);
        const travel = Math.min(Math.max(length - segment * 0.5, segment * 0.75), length);
        const duration = Math.min(Math.max(length / 70, 3.2), 6.2);

        connection.pathGlow.style.setProperty("--beam-total", length.toFixed(2));
        connection.pathGlow.style.setProperty("--beam-segment", segment.toFixed(2));
        connection.pathGlow.style.setProperty("--beam-offset-end", `-${travel.toFixed(2)}`);
        connection.pathGlow.style.setProperty("--beam-duration", `${duration.toFixed(2)}s`);
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
    initDynamicCatalog();
    initBeamConnections();
    console.log("Sitio inicializado sin dependencias de binarios.");
  });
})();
