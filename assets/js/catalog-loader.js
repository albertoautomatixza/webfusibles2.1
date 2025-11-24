import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function loadCatalogContent() {
  try {
    const apiUrl = `${supabaseUrl}/functions/v1/api-catalogo`;

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch catalog data');
    }

    const { banners, productos } = await response.json();

    loadBanners(banners);
    loadProductos(productos);

  } catch (error) {
    console.error('Error loading catalog content:', error);
  }
}

function loadBanners(banners) {
  const stage = document.getElementById('bannerStage');
  const dotsContainer = document.getElementById('bannerDots');
  const slider = document.querySelector('.banner-slider');

  if (!stage || !dotsContainer || !slider) {
    console.warn('Banner elements not found');
    return;
  }

  if (!banners || banners.length === 0) {
    console.warn('No banners found');
    slider.classList.remove('is-loading');
    return;
  }

  stage.innerHTML = '';
  dotsContainer.innerHTML = '';

  banners.forEach((banner, index) => {
    const article = document.createElement('article');
    article.className = `banner-slide${index === 0 ? ' is-active' : ''}`;
    article.innerHTML = `
      <div class="banner-media">
        <img src="${banner.banner_url}" alt="${banner.titulo}" loading="${index === 0 ? 'eager' : 'lazy'}" width="1200" height="600">
      </div>
    `;
    stage.appendChild(article);

    const dot = document.createElement('button');
    dot.className = `catalogo-dot${index === 0 ? ' is-active' : ''}`;
    dot.type = 'button';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Ver ${banner.titulo}`);
    dot.setAttribute('data-slide-index', index.toString());
    dotsContainer.appendChild(dot);
  });

  slider.classList.remove('is-loading');
  initializeBannerCarousel();
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

  function goToSlide(index) {
    if (index < 0) index = slides.length - 1;
    if (index >= slides.length) index = 0;

    slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === index);
    });

    dots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === index);
    });

    currentIndex = index;
  }

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => goToSlide(index));
  });

  if (prevBtn) {
    prevBtn.addEventListener('click', () => goToSlide(currentIndex - 1));
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => goToSlide(currentIndex + 1));
  }

  function startAutoplay() {
    autoplayInterval = setInterval(() => {
      goToSlide(currentIndex + 1);
    }, 4000);
  }

  function stopAutoplay() {
    if (autoplayInterval) {
      clearInterval(autoplayInterval);
    }
  }

  startAutoplay();

  stage.addEventListener('mouseenter', stopAutoplay);
  stage.addEventListener('mouseleave', startAutoplay);
}

function loadProductos(productos) {
  const stage = document.getElementById('catalogoStage');
  const dotsContainer = document.getElementById('catalogoDots');

  if (!stage || !dotsContainer) {
    console.warn('Producto elements not found');
    return;
  }

  if (!productos || productos.length === 0) {
    console.warn('No products found in database');
    return;
  }

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
          <a class="catalogo-cta catalogo-cta--primary" href="#catalogo">Descargar catálogo</a>
          <a class="catalogo-cta catalogo-cta--secondary" href="https://wa.me/524491964606" target="_blank" rel="noopener">Solicitar cotización</a>
        </div>
      </div>
    `;
    stage.appendChild(article);

    const dot = document.createElement('button');
    dot.className = `catalogo-dot${index === 0 ? ' is-active' : ''}`;
    dot.type = 'button';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Ver ${producto.nombre}`);
    dot.setAttribute('data-slide-index', index.toString());
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

    slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === index);
    });

    dots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === index);
    });

    currentIndex = index;
  }

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => goToSlide(index));
  });

  if (prevBtn) {
    prevBtn.addEventListener('click', () => goToSlide(currentIndex - 1));
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => goToSlide(currentIndex + 1));
  }

  let autoplayInterval = setInterval(() => {
    goToSlide(currentIndex + 1);
  }, 5000);

  stage.addEventListener('mouseenter', () => {
    clearInterval(autoplayInterval);
  });

  stage.addEventListener('mouseleave', () => {
    autoplayInterval = setInterval(() => {
      goToSlide(currentIndex + 1);
    }, 5000);
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
          sheetNames: {
            banners: 'Banners',
            productos: 'Productos',
          },
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to sync Google Sheets');
    }

    console.log('Google Sheets synced successfully:', result);
    await loadCatalogContent();
    return result;
  } catch (error) {
    console.error('Error syncing Google Sheets:', error);
    throw error;
  }
}
