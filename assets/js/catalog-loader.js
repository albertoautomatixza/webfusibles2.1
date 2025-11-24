import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function loadCatalogContent() {
  try {
    const { data: productos, error: productosError } = await supabase
      .from('productos')
      .select('*')
      .eq('activo', true)
      .order('orden', { ascending: true });

    if (productosError) throw productosError;

    if (!productos || productos.length === 0) {
      console.warn('No products found in database');
      return;
    }

    const stage = document.getElementById('catalogoStage');
    const dotsContainer = document.getElementById('catalogoDots');

    if (!stage || !dotsContainer) return;

    stage.innerHTML = '';
    dotsContainer.innerHTML = '';

    productos.forEach((producto, index) => {
      const article = document.createElement('article');
      article.className = `catalogo-slide${index === 0 ? ' is-active' : ''}`;
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

    initializeCarousel();

  } catch (error) {
    console.error('Error loading catalog content:', error);
  }
}

function initializeCarousel() {
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
