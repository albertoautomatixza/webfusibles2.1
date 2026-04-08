import { fetchBanners } from './banner-sheet.js';
import { fetchCatalogProducts, getProductsByCategory } from './catalog-sheet.js';

export async function loadCatalogContent() {
  try {
    const [bannerResult, catalogResult] = await Promise.allSettled([
      loadBannersFromSheet(),
      loadCatalogFromSheet()
    ]);

    if (bannerResult.status === 'rejected') {
      console.warn('Banner loading failed:', bannerResult.reason);
      hideBannerSection();
    }

    if (catalogResult.status === 'rejected') {
      console.warn('Catalog loading failed:', catalogResult.reason);
      hideCatalogSection();
    }
  } catch (error) {
    console.error('Error loading content:', error);
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

      const placeholderText = encodeURIComponent(banner.titulo || 'Banner');
      const placeholderSrc = `https://placehold.co/1200x420/214464/E5EFF8?text=${placeholderText}`;

      const img = document.createElement('img');
      img.src = banner.imagen_url || placeholderSrc;
      img.alt = banner.titulo || 'Banner promocional';
      img.loading = index === 0 ? 'eager' : 'lazy';
      img.width = 1200;
      img.height = 420;
      img.onerror = function () {
        this.src = placeholderSrc;
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
    initializeCarousel('bannerStage', 'bannerDots', '[data-banner-prev]', '[data-banner-next]');
  } catch (error) {
    console.warn('Failed to load banners:', error);
    hideBannerSection();
  }
}

async function loadCatalogFromSheet() {
  const stage = document.getElementById('catalogoStage');
  const dotsContainer = document.getElementById('catalogoDots');

  if (!stage || !dotsContainer) return;

  try {
    const { all, groups } = await fetchCatalogProducts();

    if (!all || all.length === 0) {
      hideCatalogSection();
      return;
    }

    const defaultCategory = 'componentes';
    const products = groups[defaultCategory] || all;
    renderCatalogProducts(products);

    window.filterCatalogByCategory = (category) => {
      const key = category.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '');
      const filtered = getProductsByCategory(key);
      renderCatalogProducts(filtered.length > 0 ? filtered : all);
    };
  } catch (error) {
    console.warn('Failed to load catalog:', error);
    hideCatalogSection();
  }
}

function renderCatalogProducts(products) {
  const stage = document.getElementById('catalogoStage');
  const dotsContainer = document.getElementById('catalogoDots');

  if (!stage || !dotsContainer) return;

  stage.innerHTML = '';
  dotsContainer.innerHTML = '';

  if (!products.length) {
    stage.innerHTML = '<div class="catalogo-empty"><p>No hay productos disponibles en esta categoria.</p></div>';
    return;
  }

  products.forEach((product, index) => {
    const article = document.createElement('article');
    article.className = `catalogo-slide${index === 0 ? ' is-active' : ''}`;
    article.setAttribute('role', 'tabpanel');
    article.setAttribute('aria-hidden', index === 0 ? 'false' : 'true');

    if (product.titulo) {
      const title = document.createElement('h3');
      title.className = 'catalogo-title';
      title.textContent = product.titulo;
      article.appendChild(title);
    }

    if (product.imagen_url) {
      const media = document.createElement('div');
      media.className = 'catalogo-media';
      const img = document.createElement('img');
      img.src = product.imagen_url;
      img.alt = product.titulo || product.descripcion || 'Producto';
      img.loading = index === 0 ? 'eager' : 'lazy';
      img.width = 800;
      img.height = 520;
      img.onerror = function () {
        this.parentElement.style.display = 'none';
        this.onerror = null;
      };
      media.appendChild(img);
      article.appendChild(media);
    }

    if (product.descripcion) {
      const desc = document.createElement('p');
      desc.className = 'catalogo-description';
      desc.textContent = product.descripcion;
      article.appendChild(desc);
    }

    const hasBtn1 = product.boton_1_texto && product.boton_1_link;
    const hasBtn2 = product.boton_2_texto && product.boton_2_link;

    if (hasBtn1 || hasBtn2) {
      const ctaGroup = document.createElement('div');
      ctaGroup.className = 'catalogo-cta-group';

      if (hasBtn1) {
        const btn1 = document.createElement('a');
        btn1.className = 'catalogo-cta catalogo-cta--primary';
        btn1.textContent = product.boton_1_texto;
        btn1.href = product.boton_1_link;
        if (/^https?:/i.test(product.boton_1_link)) {
          btn1.target = '_blank';
          btn1.rel = 'noopener';
        }
        ctaGroup.appendChild(btn1);
      }

      if (hasBtn2) {
        const btn2 = document.createElement('a');
        btn2.className = 'catalogo-cta catalogo-cta--secondary';
        btn2.textContent = product.boton_2_texto;
        btn2.href = product.boton_2_link;
        if (/^https?:/i.test(product.boton_2_link)) {
          btn2.target = '_blank';
          btn2.rel = 'noopener';
        }
        ctaGroup.appendChild(btn2);
      }

      article.appendChild(ctaGroup);
    }

    stage.appendChild(article);

    const dot = document.createElement('button');
    dot.className = `catalogo-dot${index === 0 ? ' is-active' : ''}`;
    dot.type = 'button';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Ver ${product.titulo || `producto ${index + 1}`}`);
    dotsContainer.appendChild(dot);
  });

  initializeCarousel('catalogoStage', 'catalogoDots', '[data-slider-prev]', '[data-slider-next]');
}

function hideBannerSection() {
  const section = document.querySelector('.banner-carousel');
  if (section) section.style.display = 'none';
}

function hideCatalogSection() {
  const section = document.getElementById('catalogo');
  if (section) section.style.display = 'none';
}

function initializeCarousel(stageId, dotsId, prevSelector, nextSelector) {
  const stage = document.getElementById(stageId);
  const dotsContainer = document.getElementById(dotsId);
  const prevBtn = document.querySelector(prevSelector);
  const nextBtn = document.querySelector(nextSelector);

  if (!stage || !dotsContainer) return;

  const slides = Array.from(stage.querySelectorAll('.catalogo-slide, .banner-slide'));
  const dots = Array.from(dotsContainer.querySelectorAll('.catalogo-dot'));
  let currentIndex = 0;
  let autoplayInterval;

  if (slides.length <= 1) {
    if (prevBtn) prevBtn.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none';
    dotsContainer.style.display = 'none';
  } else {
    if (prevBtn) prevBtn.style.display = '';
    if (nextBtn) nextBtn.style.display = '';
    dotsContainer.style.display = '';
  }

  function goToSlide(index) {
    if (index < 0) index = slides.length - 1;
    if (index >= slides.length) index = 0;
    slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === index);
      slide.setAttribute('aria-hidden', i === index ? 'false' : 'true');
    });
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
    autoplayInterval = setInterval(() => goToSlide(currentIndex + 1), 6000);
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

  const slider = stage.closest('.banner-slider, .catalogo-slider');
  if (slider) {
    slider.addEventListener('mouseenter', stopAutoplay);
    slider.addEventListener('mouseleave', startAutoplay);
  }
}

export async function syncGoogleSheets() {
  await loadCatalogContent();
}
