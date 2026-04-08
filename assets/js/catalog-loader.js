import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { fetchBanners, getPlaceholderImage } from './banner-sheet.js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function loadCatalogContent() {
  try {
    const [bannerResult, catalogResult] = await Promise.allSettled([
      loadBannersFromSheet(),
      loadProductosFromApi()
    ]);

    if (bannerResult.status === 'rejected') {
      console.warn('Banner loading failed, hiding section:', bannerResult.reason);
      hideBannerSection();
    }

    if (catalogResult.status === 'rejected') {
      console.warn('Catalog loading failed:', catalogResult.reason);
    }
  } catch (error) {
    console.error('Error loading catalog content:', error);
  }
}

async function loadBannersFromSheet() {
  const stage = document.getElementById('bannerStage');
  const dotsContainer = document.getElementById('bannerDots');
  const slider = document.querySelector('.banner-slider');

  if (!stage || !dotsContainer || !slider) return;

  try {
    const banners = await fetchBanners();

    if (!banners || banners.length === 0) {
      hideBannerSection();
      return;
    }

    stage.innerHTML = '';
    dotsContainer.innerHTML = '';

    banners.forEach((banner, index) => {
      const article = document.createElement('article');
      article.className = `banner-slide${index === 0 ? ' is-active' : ''}`;

      const hasLink = banner.link_url && banner.link_url !== '[URL]' && banner.link_url.length > 5;
      const wrapper = document.createElement(hasLink ? 'a' : 'div');
      wrapper.className = 'banner-media';

      if (hasLink) {
        wrapper.href = banner.link_url;
        if (/^https?:/i.test(banner.link_url)) {
          wrapper.target = '_blank';
          wrapper.rel = 'noopener';
        }
      }

      const img = document.createElement('img');
      img.src = banner.imagen_url || getPlaceholderImage();
      img.alt = banner.titulo || 'Banner promocional';
      img.loading = index === 0 ? 'eager' : 'lazy';
      img.width = 1200;
      img.height = 420;
      img.onerror = function () {
        this.src = getPlaceholderImage();
        this.onerror = null;
      };

      wrapper.appendChild(img);

      if (banner.titulo) {
        const overlay = document.createElement('div');
        overlay.className = 'banner-overlay';
        const title = document.createElement('h3');
        title.className = 'banner-title';
        title.textContent = banner.titulo;

        if (banner.descripcion) {
          const desc = document.createElement('p');
          desc.className = 'banner-desc';
          desc.textContent = banner.descripcion;
          overlay.appendChild(title);
          overlay.appendChild(desc);
        } else {
          overlay.appendChild(title);
        }

        if (banner.texto_boton && hasLink) {
          const btn = document.createElement('span');
          btn.className = 'banner-cta';
          btn.textContent = banner.texto_boton;
          overlay.appendChild(btn);
        }

        wrapper.appendChild(overlay);
      }

      article.appendChild(wrapper);
      stage.appendChild(article);

      const dot = document.createElement('button');
      dot.className = `catalogo-dot${index === 0 ? ' is-active' : ''}`;
      dot.type = 'button';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Ver ${banner.titulo || `banner ${index + 1}`}`);
      dotsContainer.appendChild(dot);
    });

    slider.classList.remove('is-loading');
    initializeBannerCarousel();
  } catch (error) {
    console.warn('Failed to load banners from sheet:', error);
    hideBannerSection();
  }
}

function hideBannerSection() {
  const section = document.querySelector('.banner-carousel');
  if (section) section.style.display = 'none';
}

function initializeBannerCarousel() {
  const stage = document.getElementById('bannerStage');
  const dotsContainer = document.getElementById('bannerDots');
  const prevBtn = document.querySelector('[data-banner-prev]');
  const nextBtn = document.querySelector('[data-banner-next]');

  if (!stage || !dotsContainer) return;

  const slides = Array.from(stage.querySelectorAll('.banner-slide'));
  const dots = Array.from(dotsContainer.querySelectorAll('.catalogo-dot'));
  let currentIndex = 0;
  let autoplayInterval;

  if (slides.length <= 1) {
    if (prevBtn) prevBtn.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none';
    dotsContainer.style.display = 'none';
  }

  function goToSlide(index) {
    if (index < 0) index = slides.length - 1;
    if (index >= slides.length) index = 0;

    slides.forEach((slide, i) => slide.classList.toggle('is-active', i === index));
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
    currentIndex = index;
  }

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      goToSlide(index);
      resetAutoplay();
    });
  });

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      goToSlide(currentIndex - 1);
      resetAutoplay();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      goToSlide(currentIndex + 1);
      resetAutoplay();
    });
  }

  function startAutoplay() {
    if (slides.length <= 1) return;
    autoplayInterval = setInterval(() => goToSlide(currentIndex + 1), 5000);
  }

  function stopAutoplay() {
    if (autoplayInterval) clearInterval(autoplayInterval);
    autoplayInterval = null;
  }

  function resetAutoplay() {
    stopAutoplay();
    startAutoplay();
  }

  startAutoplay();
  const slider = document.querySelector('.banner-slider');
  if (slider) {
    slider.addEventListener('mouseenter', stopAutoplay);
    slider.addEventListener('mouseleave', startAutoplay);
  }
}

async function loadProductosFromApi() {
  const apiUrl = `${supabaseUrl}/functions/v1/api-catalogo`;

  const response = await fetch(apiUrl, {
    headers: { 'Authorization': `Bearer ${supabaseKey}` },
  });

  if (!response.ok) throw new Error('Failed to fetch catalog data');

  const { productos } = await response.json();
  loadProductos(productos);
}

function loadProductos(productos) {
  const stage = document.getElementById('catalogoStage');
  const dotsContainer = document.getElementById('catalogoDots');

  if (!stage || !dotsContainer) return;
  if (!productos || productos.length === 0) return;

  stage.innerHTML = '';
  dotsContainer.innerHTML = '';

  productos.forEach((producto, index) => {
    const article = document.createElement('article');
    article.className = `catalogo-slide${index === 0 ? ' is-active' : ''}`;
    article.setAttribute('data-categoria', producto.categoria);
    article.innerHTML = `
      <div class="catalogo-media">
        <img src="${producto.imagen_url}" alt="${producto.nombre}" loading="lazy" width="800" height="520">
      </div>
      <div class="catalogo-info">
        <span class="catalogo-pill">${producto.categoria}</span>
        <h3 class="catalogo-title">${producto.nombre}</h3>
        <p class="catalogo-description">${producto.descripcion}</p>
        <div class="catalogo-cta-group">
          <a class="catalogo-cta catalogo-cta--primary" href="#catalogo">Descargar catalogo</a>
          <a class="catalogo-cta catalogo-cta--secondary" href="https://wa.me/524491964606" target="_blank" rel="noopener">Solicitar cotizacion</a>
        </div>
      </div>
    `;
    stage.appendChild(article);

    const dot = document.createElement('button');
    dot.className = `catalogo-dot${index === 0 ? ' is-active' : ''}`;
    dot.type = 'button';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Ver ${producto.nombre}`);
    dotsContainer.appendChild(dot);
  });

  initializeProductosCarousel();
}

function initializeProductosCarousel() {
  const stage = document.getElementById('catalogoStage');
  const dotsContainer = document.getElementById('catalogoDots');
  const prevBtn = document.querySelector('[data-slider-prev]');
  const nextBtn = document.querySelector('[data-slider-next]');

  if (!stage || !dotsContainer) return;

  const slides = Array.from(stage.querySelectorAll('.catalogo-slide'));
  const dots = Array.from(dotsContainer.querySelectorAll('.catalogo-dot'));
  let currentIndex = 0;

  function goToSlide(index) {
    if (index < 0) index = slides.length - 1;
    if (index >= slides.length) index = 0;
    slides.forEach((slide, i) => slide.classList.toggle('is-active', i === index));
    dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
    currentIndex = index;
  }

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => goToSlide(index));
  });

  if (prevBtn) prevBtn.addEventListener('click', () => goToSlide(currentIndex - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goToSlide(currentIndex + 1));

  let autoplayInterval = setInterval(() => goToSlide(currentIndex + 1), 5000);

  stage.addEventListener('mouseenter', () => clearInterval(autoplayInterval));
  stage.addEventListener('mouseleave', () => {
    autoplayInterval = setInterval(() => goToSlide(currentIndex + 1), 5000);
  });
}

export async function syncGoogleSheets(spreadsheetId) {
  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/sync-google-sheets`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          spreadsheetId,
          sheetNames: { banners: 'Banners', productos: 'Productos' },
        }),
      }
    );

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to sync Google Sheets');

    await loadCatalogContent();
    return result;
  } catch (error) {
    console.error('Error syncing Google Sheets:', error);
    throw error;
  }
}
