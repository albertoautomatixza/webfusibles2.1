const SHEET_ID = '1qQ7apfZKl_nwPv7aBKzo5mmUFjIzz2q3lSWFrMqL2lM';
const GVIZ_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;

let cachedProducts = null;

function normalizeLabel(label) {
  return (label || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function isActive(val) {
  if (typeof val === 'boolean') return val;
  const s = String(val).trim().toLowerCase();
  return s === 'true' || s === '1';
}

function isValidUrl(url) {
  if (!url) return false;
  const trimmed = url.trim();
  return trimmed.length > 5 && trimmed !== '[URL]' && /^https?:\/\/.+/i.test(trimmed);
}

function parseSheetResponse(raw) {
  if (!raw) return [];
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return [];

  const json = JSON.parse(raw.slice(start, end + 1));
  const cols = json?.table?.cols ?? [];
  const rows = json?.table?.rows ?? [];

  const colMap = {};
  const aliases = {
    id: ['id'],
    categoria: ['categoria', 'category'],
    titulo: ['titulo', 'title', 'nombre'],
    descripcion: ['descripcion', 'description'],
    imagen_url: ['imagen_url', 'imagen', 'image', 'url de la imagen'],
    boton_1_texto: ['boton_1_texto', 'boton 1 texto', 'cta1'],
    boton_1_link: ['boton_1_link', 'boton 1 link', 'link1'],
    boton_2_texto: ['boton_2_texto', 'boton 2 texto', 'cta2'],
    boton_2_link: ['boton_2_link', 'boton 2 link', 'link2'],
    activo: ['activo', 'active'],
    orden: ['orden', 'order', 'prioridad']
  };

  cols.forEach((col, i) => {
    const label = normalizeLabel(col?.label);
    if (!label) return;
    for (const [key, names] of Object.entries(aliases)) {
      if (names.some((n) => normalizeLabel(n) === label) && !(key in colMap)) {
        colMap[key] = i;
      }
    }
  });

  return rows.map((row) => {
    const cells = row?.c ?? [];
    const cell = (idx) => {
      if (idx === undefined || idx >= cells.length || !cells[idx]) return null;
      return cells[idx];
    };

    const val = (idx) => {
      const c = cell(idx);
      if (!c) return '';
      const v = c.v;
      return v != null ? String(v).trim() : (c.f || '').trim();
    };

    const numVal = (idx) => {
      const c = cell(idx);
      if (!c) return 0;
      const n = Number(c.v);
      return isNaN(n) ? 0 : n;
    };

    const boolVal = (idx) => {
      const c = cell(idx);
      if (!c) return false;
      return isActive(c.v);
    };

    const imagenRaw = val(colMap.imagen_url);
    const btn1Link = val(colMap.boton_1_link);
    const btn2Link = val(colMap.boton_2_link);

    return {
      id: val(colMap.id),
      categoria: val(colMap.categoria),
      titulo: val(colMap.titulo),
      descripcion: val(colMap.descripcion),
      imagen_url: isValidUrl(imagenRaw) ? imagenRaw : '',
      boton_1_texto: val(colMap.boton_1_texto),
      boton_1_link: isValidUrl(btn1Link) ? btn1Link : '',
      boton_2_texto: val(colMap.boton_2_texto),
      boton_2_link: isValidUrl(btn2Link) ? btn2Link : '',
      activo: colMap.activo !== undefined ? boolVal(colMap.activo) : true,
      orden: numVal(colMap.orden)
    };
  });
}

function normalizeCategory(cat) {
  if (!cat) return '';
  return cat.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '');
}

function filterSortGroup(products) {
  const active = products.filter((p) => p.activo);
  const sorted = active.sort((a, b) => a.orden - b.orden);

  const groups = {};
  sorted.forEach((product) => {
    const key = normalizeCategory(product.categoria) || 'otros';
    if (!groups[key]) groups[key] = [];
    groups[key].push(product);
  });

  return { all: sorted, groups };
}

export async function fetchCatalogProducts() {
  if (cachedProducts) return cachedProducts;

  const response = await fetch(GVIZ_URL, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Sheet fetch failed: ${response.status}`);

  const text = await response.text();
  const all = parseSheetResponse(text);
  const result = filterSortGroup(all);
  cachedProducts = result;
  return result;
}

export function getProductsByCategory(category) {
  if (!cachedProducts) return [];
  const key = normalizeCategory(category);
  return cachedProducts.groups[key] || [];
}
