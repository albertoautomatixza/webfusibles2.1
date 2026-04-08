import { loadCatalogContent, syncGoogleSheets } from './catalog-loader.js';

(() => {
  "use strict";

  window.syncGoogleSheets = syncGoogleSheets;

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
      { alt: "Eaton", width: 120, height: 42, src: "/logos/eaton.svg" },
      { alt: "Arno Canali", width: 120, height: 42, src: "/logos/arnocanali.svg" },
      { alt: "Klein Tools", width: 120, height: 42, src: "/logos/klein-tools.svg" },
      { alt: "Weidmüller", width: 130, height: 44, src: "/logos/weidmmuller.svg" },
      { alt: "HELUKABEL", width: 120, height: 42, src: "/logos/hellu_logo_web.svg" },
      { alt: "Legrand", width: 130, height: 44, src: "/logos/legrand.svg" },
      { alt: "Kyoritsu", width: 130, height: 44, src: "/logos/kyoritsu.svg" },
      { alt: "REER", width: 120, height: 42, src: "/logos/reer.svg" },
      { alt: "Sirena", width: 120, height: 42, src: "/logos/sirena.svg" },
      { alt: "Wiska", width: 130, height: 44, src: "/logos/wiska.svg" },
      { alt: "Wain Electric", width: 130, height: 44, src: "/logos/wain.svg" },
      { alt: "Taiwan Meters Plant", width: 120, height: 42, src: "/logos/taiguan.svg" },
      { alt: "Cooper", width: 120, height: 42, src: "/logos/cooper.svg" },
      { alt: "CNTD", width: 120, height: 42, src: "/logos/cntd.svg" },
      { alt: "Megger", width: 120, height: 42, src: "/logos/megger.svg" }
    ];

    new IconCloudSimple(cloud, icons, { radius: 160, speed: 1 });
  };

  const initThemeToggle = () => {
    const toggle = document.querySelector(".theme-toggle");
    if (!toggle) return;

    const STORAGE_KEY = "fp-theme";
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
    const root = document.documentElement;
    const themeMeta = document.querySelector('meta[name="theme-color"]');

    const applyTheme = (theme) => {
      const resolved = theme === "dark" ? "dark" : "light";
      root.setAttribute("data-theme", resolved);
      root.style.colorScheme = resolved;
      toggle.classList.toggle("is-dark", resolved === "dark");
      toggle.setAttribute("aria-pressed", String(resolved === "dark"));
      toggle.setAttribute("aria-label", resolved === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
      if (themeMeta) {
        themeMeta.setAttribute("content", resolved === "dark" ? "#0f1f39" : "#197ACF");
      }
    };

    const getStoredTheme = () => {
      try {
        return localStorage.getItem(STORAGE_KEY);
      } catch (error) {
        return null;
      }
    };

    const storeTheme = (theme) => {
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch (error) {
        /* ignore */
      }
    };

    const storedTheme = getStoredTheme();
    const initialTheme = storedTheme || (prefersDark.matches ? "dark" : "light");
    applyTheme(initialTheme);

    const setTheme = (theme) => {
      applyTheme(theme);
      storeTheme(theme);
    };

    const handlePrefersChange = (event) => {
      if (!getStoredTheme()) {
        applyTheme(event.matches ? "dark" : "light");
      }
    };

    if (typeof prefersDark.addEventListener === "function") {
      prefersDark.addEventListener("change", handlePrefersChange);
    } else if (typeof prefersDark.addListener === "function") {
      prefersDark.addListener(handlePrefersChange);
    }

    const animateTransition = (nextTheme) => {
      if (typeof document.startViewTransition !== "function") {
        setTheme(nextTheme);
        return;
      }

      const rect = toggle.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const maxRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      try {
        document
          .startViewTransition(() => {
            setTheme(nextTheme);
          })
          .ready.then(() => {
            root.animate(
              {
                clipPath: [
                  `circle(0px at ${x}px ${y}px)`,
                  `circle(${maxRadius}px at ${x}px ${y}px)`
                ]
              },
              {
                duration: 420,
                easing: "ease-in-out",
                pseudoElement: "::view-transition-new(root)"
              }
            );
          })
          .catch(() => {});
      } catch (error) {
        setTheme(nextTheme);
      }
    };

    toggle.addEventListener("click", () => {
      const nextTheme = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      animateTransition(nextTheme);
    });
  };

  const initNavigation = () => {
    const navToggle = document.querySelector(".nav-toggle");
    const navMenu = document.querySelector(".nav-menu");

    if (!navToggle || !navMenu) return;

    navToggle.addEventListener("click", () => {
      const expanded = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!expanded));
      navMenu.classList.toggle("active");
      navToggle.setAttribute("aria-label", expanded ? "Abrir menú" : "Cerrar menú");
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
        navToggle.setAttribute("aria-label", "Abrir menú");

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
      const nombre = data.get("nombre") || "";
      const correo = data.get("correo") || "";
      const telefono = data.get("telefono") || "";
      const mensaje = data.get("mensaje") || "";

      const subject = `Contacto de ${nombre}`;
      const body = `Nombre: ${nombre}\nCorreo: ${correo}\nTeléfono: ${telefono}\n\nMensaje:\n${mensaje}`;

      const mailtoLink = `mailto:contacto@fusiblesproteccion.com.mx?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      window.location.href = mailtoLink;

      setTimeout(() => {
        alert("Tu cliente de correo se ha abierto. Por favor, envía el mensaje desde ahí.");
        form.reset();
      }, 500);
    });
  };

  const initRevealObserver = () => {
    const elements = document.querySelectorAll(
      ".sector-card, .catalogo-slider, .marca-item, .valor-item, .banner-slider"
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



  const initBeamConnections = () => {
    const wrapper = document.querySelector("[data-hub-spoke]");
    if (!wrapper) return;

    const svg = wrapper.querySelector(".hub-spoke-lines");
    const hub = wrapper.querySelector("[data-hub]");
    const spokes = [...wrapper.querySelectorAll("[data-spoke]")];

    if (!svg || !hub || !spokes.length) return;

    const svgNS = "http://www.w3.org/2000/svg";
    svg.innerHTML = "";

    const defs = document.createElementNS(svgNS, "defs");
    svg.appendChild(defs);

    const beams = [];
    const hubCircle = hub.querySelector(".hub-icon-circle") || hub;

    spokes.forEach((spoke, i) => {
      const spokeCircle = spoke.querySelector(".spoke-icon-circle") || spoke;
      const uid = "beam-grad-" + i;

      const grad = document.createElementNS(svgNS, "linearGradient");
      grad.setAttribute("id", uid);
      grad.setAttribute("gradientUnits", "userSpaceOnUse");
      grad.innerHTML =
        '<stop offset="0%" stop-color="#197ACF" stop-opacity="0"/>' +
        '<stop offset="30%" stop-color="#197ACF" stop-opacity="1"/>' +
        '<stop offset="65%" stop-color="#4db8ff" stop-opacity="1"/>' +
        '<stop offset="100%" stop-color="#4db8ff" stop-opacity="0"/>';
      defs.appendChild(grad);

      const basePath = document.createElementNS(svgNS, "path");
      basePath.setAttribute("class", "hub-spoke-line-base");

      const beamPath = document.createElementNS(svgNS, "path");
      beamPath.setAttribute("class", "hub-spoke-line-beam");
      beamPath.setAttribute("stroke", `url(#${uid})`);

      svg.appendChild(basePath);
      svg.appendChild(beamPath);

      beams.push({ spokeCircle, basePath, beamPath, grad, delay: i * 1.2, duration: 4 });
    });

    const getCenter = (el) => {
      const wr = wrapper.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      return {
        x: r.left + r.width / 2 - wr.left,
        y: r.top + r.height / 2 - wr.top,
      };
    };

    const buildCurvePath = (sx, sy, ex, ey) => {
      const isLeft = sx < ex;
      const curvature = 0.4;
      const dx = ex - sx;
      const dy = ey - sy;
      const cx1 = sx + dx * curvature;
      const cy1 = sy;
      const cx2 = ex - dx * curvature;
      const cy2 = ey;
      return `M ${sx},${sy} C ${cx1},${cy1} ${cx2},${cy2} ${ex},${ey}`;
    };

    const update = () => {
      const wr = wrapper.getBoundingClientRect();
      svg.setAttribute("viewBox", `0 0 ${wr.width} ${wr.height}`);

      const hc = getCenter(hubCircle);

      beams.forEach(({ spokeCircle, basePath, beamPath }) => {
        const sc = getCenter(spokeCircle);
        const d = buildCurvePath(sc.x, sc.y, hc.x, hc.y);
        basePath.setAttribute("d", d);
        beamPath.setAttribute("d", d);
      });
    };

    let animFrame;
    const startTime = performance.now();

    const animateBeams = (now) => {
      const elapsed = (now - startTime) / 1000;

      beams.forEach(({ beamPath, grad, delay, duration }) => {
        const t = ((elapsed - delay) % duration) / duration;
        const progress = t < 0 ? 0 : t;

        const pathLen = beamPath.getTotalLength ? beamPath.getTotalLength() : 400;
        const beamLen = pathLen * 0.35;
        const beamCenter = progress * (pathLen + beamLen) - beamLen * 0.5;

        const p1 = beamCenter - beamLen / 2;
        const p2 = beamCenter + beamLen / 2;

        grad.setAttribute("gradientUnits", "userSpaceOnUse");

        const startPt = beamPath.getPointAtLength ? beamPath.getPointAtLength(Math.max(0, Math.min(p1, pathLen))) : { x: 0, y: 0 };
        const endPt = beamPath.getPointAtLength ? beamPath.getPointAtLength(Math.max(0, Math.min(p2, pathLen))) : { x: 100, y: 0 };

        grad.setAttribute("x1", startPt.x);
        grad.setAttribute("y1", startPt.y);
        grad.setAttribute("x2", endPt.x);
        grad.setAttribute("y2", endPt.y);
      });

      animFrame = requestAnimationFrame(animateBeams);
    };

    update();
    animFrame = requestAnimationFrame(animateBeams);

    if ("ResizeObserver" in window) {
      new ResizeObserver(() => requestAnimationFrame(update)).observe(wrapper);
    }
    window.addEventListener("resize", update);
  };

  const initCatalogTabs = () => {
    const tabs = document.querySelectorAll(".catalogo-tab");
    if (!tabs.length) return;

    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => {
          t.classList.remove("is-active");
          t.setAttribute("aria-selected", "false");
        });

        tab.classList.add("is-active");
        tab.setAttribute("aria-selected", "true");

        const category = tab.dataset.category;
        console.log("Categoría seleccionada:", category);

        if (typeof window.filterCatalogByCategory === "function") {
          window.filterCatalogByCategory(category);
        }
      });
    });
  };

  document.addEventListener("DOMContentLoaded", async () => {
    initThemeToggle();
    createIconCloud();
    initNavigation();
    initScrollEffects();
    initContactForm();
    initRevealObserver();
    initBeamConnections();
    await loadCatalogContent();
    initCatalogTabs();
    initCookieConsent();
    console.log("Sitio inicializado sin dependencias de binarios.");
  });

  const initCookieConsent = () => {
    const cookieConsent = document.getElementById('cookieConsent');
    const acceptBtn = document.getElementById('cookieAccept');
    const declineBtn = document.getElementById('cookieDecline');

    if (!cookieConsent || !acceptBtn || !declineBtn) return;

    const cookieChoice = localStorage.getItem('cookieConsent');

    if (!cookieChoice) {
      setTimeout(() => {
        cookieConsent.classList.add('show');
      }, 1000);
    }

    acceptBtn.addEventListener('click', () => {
      localStorage.setItem('cookieConsent', 'accepted');
      cookieConsent.classList.remove('show');
      console.log('Cookies aceptadas');
    });

    declineBtn.addEventListener('click', () => {
      localStorage.setItem('cookieConsent', 'declined');
      cookieConsent.classList.remove('show');
      console.log('Cookies rechazadas');
    });
  };
})();
