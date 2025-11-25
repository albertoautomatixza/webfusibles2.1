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

  let bannerGraphicId = 0;
  const createBannerIllustration = ({
    badge,
    title,
    subtitle,
    highlights = [],
    accent = "#25D366",
    accentSecondary = "#1A83FF",
    background = ["#0F1F39", "#1B3353"]
  }) => {
    bannerGraphicId += 1;
    const gradientId = `bannerGradient${bannerGraphicId}`;
    const accentId = `accentGradient${bannerGraphicId}`;
    const highlightElements = highlights
      .slice(0, 4)
      .map((text, index) => {
        const y = 250 + index * 38;
        return `<tspan x="640" y="${y}" font-size="26" fill="#E5EFF8">• ${text}</tspan>`;
      })
      .join("");

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="420" viewBox="0 0 1200 420">
        <defs>
          <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${background[0]}" />
            <stop offset="100%" stop-color="${background[1]}" />
          </linearGradient>
          <linearGradient id="${accentId}" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="${accent}" />
            <stop offset="100%" stop-color="${accentSecondary}" />
          </linearGradient>
          <filter id="shadow${bannerGraphicId}" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="rgba(10,19,36,0.45)" />
          </filter>
        </defs>
        <rect width="1200" height="420" fill="url(#${gradientId})" rx="28" />
        <path d="M948 70C1046 70 1110 110 1156 164C1189 202 1188 270 1152 308C1096 368 964 362 880 336C796 310 716 318 676 348C650 368 604 366 574 350C518 320 514 252 556 204C632 118 732 70 948 70Z" fill="rgba(255,255,255,0.05)" />
        <g filter="url(#shadow${bannerGraphicId})">
          <path d="M918 90C1030 90 1108 152 1110 230C1112 308 1034 360 922 360C810 360 732 298 730 220C728 142 806 90 918 90Z" fill="rgba(17,40,70,0.75)" />
        </g>
        <path d="M874 140C952 104 1036 132 1082 182C1128 232 1124 310 1046 346C968 382 884 354 838 304C792 254 796 176 874 140Z" fill="rgba(28,63,110,0.75)" />
        <circle cx="864" cy="224" r="72" fill="url(#${accentId})" opacity="0.85" />
        <rect x="640" y="110" width="220" height="46" rx="23" fill="rgba(229,239,248,0.1)" stroke="${accent}" stroke-width="2" />
        <text x="750" y="140" font-family="'Segoe UI', Arial, sans-serif" font-size="22" text-anchor="middle" fill="#E5EFF8">${badge}</text>
        <text x="640" y="196" font-family="'Segoe UI', Arial, sans-serif" font-size="52" font-weight="600" fill="#FFFFFF">${title}</text>
        <text x="640" y="232" font-family="'Segoe UI', Arial, sans-serif" font-size="26" fill="#D3E4F8">${subtitle}</text>
        <text font-family="'Segoe UI', Arial, sans-serif" font-size="26">${highlightElements}</text>
        <rect x="140" y="118" width="320" height="184" rx="24" fill="rgba(12,30,54,0.4)" stroke="rgba(229,239,248,0.22)" stroke-width="2" />
        <path d="M188 160C188 148 198 138 210 138H390C402 138 412 148 412 160V260C412 272 402 282 390 282H210C198 282 188 272 188 260V160Z" fill="#111D35" />
        <rect x="216" y="174" width="168" height="16" rx="8" fill="${accent}" opacity="0.85" />
        <rect x="216" y="206" width="144" height="14" rx="7" fill="#E5EFF8" opacity="0.75" />
        <rect x="216" y="234" width="112" height="12" rx="6" fill="#98B7D7" opacity="0.65" />
        <rect x="344" y="174" width="48" height="72" rx="12" fill="rgba(20,44,80,0.8)" />
        <rect x="352" y="186" width="32" height="48" rx="10" fill="rgba(229,239,248,0.9)" />
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
      { alt: "HELUKABEL", width: 120, height: 42, src: "/logos/hellukabel.svg" },
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

  const parseBannerSheetResponse = (raw) => {
    if (!raw) return [];

    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return [];

    try {
      const json = JSON.parse(raw.slice(start, end + 1));
      const rows = json?.table?.rows ?? [];
      const cols = json?.table?.cols ?? [];

      const normalize = (value) =>
        typeof value === "string" ? value.trim() : value ? String(value).trim() : "";

      if (!rows.length) return [];

      const headerMap = new Map();

      cols.forEach((col, index) => {
        const label = normalize(col?.label);
        if (label) headerMap.set(label.toLowerCase(), index);
      });

      const rawRows = rows.map((row) => row?.c ?? []);
      const firstRowValues = rawRows[0]?.map((cell) => normalize(cell?.v ?? cell?.f)) ?? [];
      const headerKeywords = ["imagen", "image", "banner", "url imagen", "url"];
      const hasHeaderRow = firstRowValues.some((value) => headerKeywords.includes(value.toLowerCase()));

      if (hasHeaderRow) {
        firstRowValues.forEach((value, index) => {
          const key = value.toLowerCase();
          if (key) headerMap.set(key, index);
        });
      }

      const findIndex = (keys, fallback) => {
        for (const key of keys) {
          const normalized = key.toLowerCase();
          if (headerMap.has(normalized)) return headerMap.get(normalized);
        }
        return fallback;
      };

      const indexes = {
        title: findIndex(["titulo", "título", "title"], hasHeaderRow ? 0 : 0),
        description: findIndex(["descripcion", "descripción", "description", "texto"], hasHeaderRow ? 1 : 1),
        image: findIndex(["imagen", "image", "banner", "url imagen"], hasHeaderRow ? 2 : 2),
        link: findIndex(["enlace", "link", "destino", "cta"], hasHeaderRow ? 3 : 3),
        cta: findIndex(["boton", "cta", "texto cta"], hasHeaderRow ? 4 : 4),
        alt: findIndex(["alt", "texto alt", "descripcion alt"], hasHeaderRow ? 5 : 5)
      };

      const dataRows = hasHeaderRow ? rawRows.slice(1) : rawRows;

      const getCellValue = (cells, index) => {
        if (index < 0 || index >= cells.length) return "";
        const cell = cells[index];
        return normalize(cell?.v ?? cell?.f ?? "");
      };

      const uniqueIndex = (index, fallback) => {
        if (index === indexes.image && fallback !== indexes.image) return fallback;
        return index;
      };

      indexes.link = uniqueIndex(indexes.link, 3);
      indexes.cta = uniqueIndex(indexes.cta, 4);

      return dataRows
        .map((cells) => {
          const image = getCellValue(cells, indexes.image);
          if (!image) return null;

          const title = getCellValue(cells, indexes.title);
          const description = getCellValue(cells, indexes.description);
          const link = getCellValue(cells, indexes.link);
          const cta = getCellValue(cells, indexes.cta);
          const alt = getCellValue(cells, indexes.alt) || title || description || "Banner promocional";

          return {
            title,
            description,
            image,
            link,
            cta,
            alt
          };
        })
        .filter((item) => item && item.image)
        .slice(0, 5);
    } catch (error) {
      console.warn("No se pudo interpretar la hoja de banners", error);
      return [];
    }
  };

  const initBannerCarousel = () => {
    const section = document.querySelector("[data-banner-sheet]");
    if (!section) return;

    const slider = section.querySelector(".banner-slider");
    const stage = section.querySelector("#bannerStage");
    const dots = section.querySelector("#bannerDots");
    const prevBtn = section.querySelector("[data-banner-prev]");
    const nextBtn = section.querySelector("[data-banner-next]");

    if (!slider || !stage || !dots || !prevBtn || !nextBtn) return;

    const AUTOPLAY_INTERVAL = 7000;
    const state = { items: [], current: 0, autoplay: null };

    const fallbackBanners = [
      {
        title: "Soldadura certificada",
        description: "Componentes listos para aplicaciones electrónicas y de manufactura.",
        image: createBannerIllustration({
          badge: "Kombitec",
          title: "Soldadura certificada",
          subtitle: "Componentes estaño y plomo",
          highlights: ["Variedad de calibres", "Presentaciones para OEM", "Entrega nacional"],
          accent: "#25D366",
          accentSecondary: "#1A83FF",
          background: ["#0B1528", "#1D2F4C"]
        }),
        link: "https://wa.me/524491964606",
        alt: "Carrete de soldadura certificada",
        placeholder: true
      },
      {
        title: "Serie QEL y QELS",
        description: "Torretas LED resistentes para ambientes industriales.",
        image: createBannerIllustration({
          badge: "Qlight",
          title: "Serie QEL y QELS",
          subtitle: "Voltajes disponibles 24 VDC y 120 VAC",
          highlights: ["Montaje con brazo articulado", "Material policarbonato de alta resistencia", "Soporte de montaje incluido"],
          accent: "#1A83FF",
          accentSecondary: "#6DD4FF",
          background: ["#0E2141", "#10345F"]
        }),
        link: "#catalogo",
        alt: "Torretas industriales serie QEL y QELS",
        placeholder: true
      },
      {
        title: "Proyectos llave en mano",
        description: "Diseñamos soluciones integrales de automatización.",
        image: createBannerIllustration({
          badge: "Fusibles Protección",
          title: "Proyectos llave en mano",
          subtitle: "Suministro, integración y soporte",
          highlights: ["Tableros certificados", "Ingeniería personalizada", "Instalación y capacitación"],
          accent: "#214464",
          accentSecondary: "#3CA7FF",
          background: ["#0D1D33", "#163258"]
        }),
        link: "#contacto",
        alt: "Equipo revisando tablero eléctrico",
        placeholder: true
      }
    ];

    const setLoading = (value) => {
      slider.classList.toggle("is-loading", Boolean(value));
    };

    const createSlide = (banner) => {
      const slide = document.createElement("article");
      slide.className = "banner-slide";
      if (banner.placeholder) {
        slide.dataset.placeholder = "true";
      }

      const wrapper = document.createElement(banner.link ? "a" : "div");
      wrapper.className = "banner-media";

      if (banner.link) {
        wrapper.href = banner.link;
        if (/^https?:/i.test(banner.link)) {
          wrapper.target = "_blank";
          wrapper.rel = "noopener";
        }
      }

      const img = document.createElement("img");
      img.src = banner.image;
      img.alt = banner.alt || banner.title || banner.description || "Banner promocional";
      img.loading = "lazy";
      img.decoding = "async";

      wrapper.appendChild(img);
      slide.appendChild(wrapper);

      return slide;
    };

    const updateDots = () => {
      const dotElements = dots.querySelectorAll(".catalogo-dot");
      dotElements.forEach((dot, index) => {
        dot.classList.toggle("is-active", index === state.current);
      });
    };

    const setActive = (index) => {
      state.items.forEach((item, itemIndex) => {
        item.classList.toggle("is-active", itemIndex === index);
      });
      state.current = index;
      updateDots();
    };

    const goTo = (index, manual = false) => {
      if (!state.items.length) return;

      const total = state.items.length;
      const nextIndex = ((index % total) + total) % total;

      if (nextIndex === state.current) {
        if (manual) {
          stopAutoplay();
          startAutoplay();
        }
        return;
      }

      setActive(nextIndex);

      if (manual) {
        stopAutoplay();
        startAutoplay();
      }
    };

    const stopAutoplay = () => {
      if (state.autoplay) {
        window.clearInterval(state.autoplay);
        state.autoplay = null;
      }
    };

    const startAutoplay = () => {
      if (state.autoplay || state.items.length <= 1) return;
      state.autoplay = window.setInterval(() => {
        goTo(state.current + 1);
      }, AUTOPLAY_INTERVAL);
    };

    const renderBanners = (banners) => {
      stopAutoplay();
      state.current = 0;
      stage.innerHTML = "";
      dots.innerHTML = "";

      const items = banners.slice(0, 5);
      if (!items.length) {
        state.items = [];
        updateDots();
        return;
      }

      items.forEach((banner, index) => {
        const slide = createSlide(banner);
        slide.dataset.index = String(index);
        stage.appendChild(slide);

        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "catalogo-dot";
        dot.setAttribute("role", "tab");

        const label = banner.title || banner.description || banner.alt;
        dot.setAttribute("aria-label", label ? `Ver banner ${label}` : `Ver banner ${index + 1}`);
        dot.addEventListener("click", () => goTo(index, true));
        dots.appendChild(dot);
      });

      state.items = Array.from(stage.children);
      setActive(0);
      startAutoplay();
    };

    const handleBanners = (banners) => {
      setLoading(false);
      if (!banners.length) {
        renderBanners(fallbackBanners);
        return;
      }
      renderBanners(banners);
    };

    const cargarDesdeHoja = async () => {
      const sheetUrl = section.dataset.bannerSheet?.trim();
      if (!sheetUrl) {
        handleBanners(fallbackBanners);
        return;
      }

      setLoading(true);

      try {
        const response = await fetch(sheetUrl, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Estado ${response.status}`);
        }
        const text = await response.text();
        const banners = parseBannerSheetResponse(text);
        handleBanners(banners);
      } catch (error) {
        console.warn("No fue posible cargar los banners desde Google Sheets", error);
        handleBanners([]);
      }
    };

    window.actualizarBanners = (banners = []) => {
      if (!Array.isArray(banners)) return;
      setLoading(false);
      renderBanners(banners);
    };

    prevBtn.addEventListener("click", () => goTo(state.current - 1, true));
    nextBtn.addEventListener("click", () => goTo(state.current + 1, true));

    slider.addEventListener("mouseenter", stopAutoplay);
    slider.addEventListener("mouseleave", startAutoplay);

    cargarDesdeHoja();
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
      autoplay: null,
      allProducts: [],
      currentCategory: "componentes"
    };

    const CTA_WHATSAPP = "https://wa.me/524491964606";
    const CTA_PHONE = "tel:+524491964606";
    const AUTOPLAY_INTERVAL = 8000;

    const fallbackProducts = [
      {
        nombre: "Torretas S125D",
        descripcion:
          "Balizas LED de alta intensidad para monitoreo visual en líneas de producción industriales.",
        categoria: "señalizacion",
        imagen: "https://placehold.co/960x640/11243d/ffffff?text=Torretas+S125D",
        cta: "Solicitar cotización",
        enlace: "https://wa.me/524491964606",
        ctaSecundaria: "Ver ficha técnica",
        enlaceSecundario: "#contacto",
        alt: "Balizas para señalización industrial"
      },
      {
        nombre: "Gabinetes NEMA",
        descripcion:
          "Gabinetes para tableros de control con sellado IP66 listos para automatización y maniobra.",
        categoria: "componentes",
        imagen: "https://placehold.co/960x640/183a5c/ffffff?text=Gabinetes+Industriales",
        cta: "Agenda una llamada",
        enlace: "tel:+524491964606",
        ctaSecundaria: "Descargar catálogo",
        enlaceSecundario: "#contacto",
        alt: "Gabinete metálico para tablero eléctrico"
      },
      {
        nombre: "Sensores de proximidad",
        descripcion:
          "Detectores inductivos y capacitivos para automatización de procesos con certificaciones internacionales.",
        categoria: "componentes",
        imagen: "https://placehold.co/960x640/1f4d7a/ffffff?text=Sensores+Industriales",
        cta: "Hablar por WhatsApp",
        enlace: "https://wa.me/524491964606",
        ctaSecundaria: "Solicitar demo",
        enlaceSecundario: "#contacto",
        alt: "Sensores industriales montados en riel"
      },
      {
        nombre: "Multímetros digitales",
        descripcion:
          "Instrumentos de medición de alta precisión para diagnóstico y mantenimiento industrial.",
        categoria: "medicion",
        imagen: "https://placehold.co/960x640/1a3d5c/ffffff?text=Multimetros",
        cta: "Solicitar cotización",
        enlace: "https://wa.me/524491964606",
        ctaSecundaria: "Ver especificaciones",
        enlaceSecundario: "#contacto",
        alt: "Multímetros digitales profesionales"
      }
    ];


    const resolveActionLink = (text, fallback) => {
      const rawText = (text || "").toString();
      const normalized = rawText.toLowerCase();
      const simplified = normalized.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const baseFallback = (fallback || "").toString().trim();

      if (simplified.includes("llamada") || simplified.includes("llamar")) {
        return CTA_PHONE;
      }

      if (
        simplified.includes("whatsapp") ||
        simplified.includes("mensaje") ||
        simplified.includes("cotiza") ||
        simplified.includes("asesor")
      ) {
        return CTA_WHATSAPP;
      }

      if (baseFallback && baseFallback !== "#contacto" && baseFallback !== "#") {
        return baseFallback;
      }

      return "#contacto";
    };

    const applyLinkAttributes = (anchor, href) => {
      const safeHref = (href || "#contacto").toString();
      anchor.href = safeHref;
      if (safeHref.startsWith("http")) {
        anchor.target = "_blank";
        anchor.rel = "noopener";
      } else {
        anchor.removeAttribute("target");
        anchor.removeAttribute("rel");
      }
    };

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

      const primaryText = producto.cta || "Solicitar cotización";
      const primaryLink = resolveActionLink(primaryText, producto.enlace);
      const primaryCta = document.createElement("a");
      primaryCta.className = "catalogo-cta catalogo-cta--primary";
      primaryCta.textContent = primaryText;
      applyLinkAttributes(primaryCta, primaryLink);
      ctaGroup.appendChild(primaryCta);

      const secondaryText = (producto.ctaSecundaria || "").trim();
      if (secondaryText) {
        const secondaryLink = resolveActionLink(secondaryText, producto.enlaceSecundario);
        const secondaryCta = document.createElement("a");
        secondaryCta.className = "catalogo-cta catalogo-cta--secondary";
        secondaryCta.textContent = secondaryText;
        applyLinkAttributes(secondaryCta, secondaryLink);
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

    const filterByCategory = (category) => {
      const normalizeCategory = (cat) => {
        if (!cat) return "";
        return cat.toString().toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/\s+/g, "");
      };

      const normalizedCategory = normalizeCategory(category);

      return state.allProducts.filter((producto) => {
        const productCategory = normalizeCategory(producto.categoria);
        return productCategory === normalizedCategory || productCategory.includes(normalizedCategory);
      });
    };

    const handleProductos = (productos) => {
      setLoading(false);
      if (!productos.length) {
        console.info("Se usará el catálogo de respaldo");
        state.allProducts = fallbackProducts;
      } else {
        state.allProducts = productos;
      }

      const filtered = filterByCategory(state.currentCategory);
      renderProductos(filtered.length > 0 ? filtered : state.allProducts);
    };

    window.filterCatalogByCategory = (category) => {
      state.currentCategory = category;
      const filtered = filterByCategory(category);
      renderProductos(filtered.length > 0 ? filtered : state.allProducts);
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
    overlay.appendChild(defs);

    const baseGroup = document.createElementNS(svgNS, "g");
    const glowGroup = document.createElementNS(svgNS, "g");
    const dotGroup = document.createElementNS(svgNS, "g");
    dotGroup.setAttribute("class", "beam-dots");
    overlay.append(baseGroup, glowGroup, dotGroup);

    const connections = [];
    let gradientCounter = 0;

    const createConnection = (from, to, curve, delay) => {
      const gradientId = `beam-gradient-${gradientCounter++}`;

      const gradient = document.createElementNS(svgNS, "linearGradient");
      gradient.setAttribute("id", gradientId);
      gradient.setAttribute("gradientUnits", "userSpaceOnUse");
      gradient.innerHTML =
        '<stop offset="0%" stop-color="#ffaa40" stop-opacity="0"></stop>' +
        '<stop offset="20%" stop-color="#ffaa40" stop-opacity="1"></stop>' +
        '<stop offset="50%" stop-color="#9c40ff" stop-opacity="1"></stop>' +
        '<stop offset="100%" stop-color="#9c40ff" stop-opacity="0"></stop>';
      defs.appendChild(gradient);

      const pathBase = document.createElementNS(svgNS, "path");
      pathBase.setAttribute("class", "beam-path-base");

      const pathGlow = document.createElementNS(svgNS, "path");
      pathGlow.setAttribute("class", "beam-path-glow");
      pathGlow.setAttribute("stroke", `url(#${gradientId})`);

      baseGroup.appendChild(pathBase);
      glowGroup.appendChild(pathGlow);
      connections.push({ from, to, curve, pathBase, pathGlow, gradient, gradientId, delay });
    };

    const leftNodes = [...container.querySelectorAll('[data-beam-target="core"]')];
    const rightNodes = [...container.querySelectorAll('[data-beam-source="core"]')];

    leftNodes.forEach((node, index) =>
      createConnection(node, center, node.dataset.beamCurve || "auto", index)
    );
    rightNodes.forEach((node, index) =>
      createConnection(node, center, node.dataset.beamCurve || "auto", leftNodes.length + index)
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

        const startX = fromRect.left - containerRect.left + fromRect.width / 2;
        const startY = fromRect.top - containerRect.top + fromRect.height / 2;
        const endX = toRect.left - containerRect.left + toRect.width / 2;
        const endY = toRect.top - containerRect.top + toRect.height / 2;

        connection.coords = { startX, startY, endX, endY };
      });
    };

    const animateGradients = () => {
      const duration = 4000;

      connections.forEach((connection, index) => {
        const offset = index * 500;
        const startTime = Date.now() - offset;

        const animate = () => {
          const elapsed = (Date.now() - startTime) % duration;
          const progress = elapsed / duration;

          const easeProgress = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

          const { startX, startY, endX, endY } = connection.coords;

          const x1 = startX + (endX - startX) * Math.max(0, easeProgress - 0.1);
          const y1 = startY + (endY - startY) * Math.max(0, easeProgress - 0.1);
          const x2 = startX + (endX - startX) * Math.min(1, easeProgress + 0.1);
          const y2 = startY + (endY - startY) * Math.min(1, easeProgress + 0.1);

          connection.gradient.setAttribute("x1", x1);
          connection.gradient.setAttribute("y1", y1);
          connection.gradient.setAttribute("x2", x2);
          connection.gradient.setAttribute("y2", y2);

          requestAnimationFrame(animate);
        };

        animate();
      });
    };

    updatePaths();
    animateGradients();

    if ("ResizeObserver" in window) {
      const resizeObserver = new ResizeObserver(() => requestAnimationFrame(updatePaths));
      resizeObserver.observe(container);
    }

    window.addEventListener("resize", updatePaths);
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
    await loadCatalogContent();
    initBeamConnections();
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
