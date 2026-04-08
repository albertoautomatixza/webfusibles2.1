const SHEET_ID = '1l9vMTcBCKzzmFSIvuWTggifBZSRei1urFNnMV3IDb1M';
const GVIZ_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json`;

const PLACEHOLDER_IMG = 'https://placehold.co/1200x420/214464/ffffff?text=Banner';
const MAX_BANNERS = 10;

let cachedBanners = null;

function parseGvizDate(raw) {
  if (!raw) return null;
  const str = String(raw);
  const match = str.match(/^Date\((\d+),(\d+),(\d+)\)$/);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]), Number(match[3]));
  }
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

function isActive(val) {
  if (typeof val === 'boolean') return val;
  const s = String(val).trim().toLowerCase();
  return s === 'true' || s === '1';
}

function isInDateRange(fechaInicio, fechaFin) {
  if (!fechaInicio && !fechaFin) return true;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  if (fechaInicio && now < fechaInicio) return false;
  if (fechaFin) {
    const end = new Date(fechaFin);
    end.setHours(23, 59, 59, 999);
    if (now > end) return false;
  }
  return true;
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
    id: ['id', 'id banner'],
    titulo: ['titulo', 'título', 'nombre', 'nombre de campaña', 'nombre de campana', 'title'],
    imagen_url: ['imagen_url', 'url de la imagen', 'imagen', 'image', 'banner_url'],
    link_url: ['link_url', 'url de destino', 'enlace', 'link', 'destino'],
    activo: ['activo', 'active', 'estado'],
    orden: ['orden', 'prioridad', 'priority', 'order'],
    fecha_inicio: ['fecha_inicio', 'fecha de inicio', 'start', 'inicio'],
    fecha_fin: ['fecha_fin', 'fecha de fin', 'end', 'fin'],
    texto_boton: ['texto_boton', 'boton', 'cta', 'button'],
    descripcion: ['descripcion', 'descripción', 'description', 'texto']
  };

  cols.forEach((col, i) => {
    const label = (col.label || '').trim().toLowerCase();
    for (const [key, names] of Object.entries(aliases)) {
      if (names.includes(label) && !(key in colMap)) {
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

    const dateVal = (idx) => {
      const c = cell(idx);
      if (!c) return null;
      return parseGvizDate(c.v) || parseGvizDate(c.f);
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

    return {
      id: val(colMap.id) || '',
      titulo: val(colMap.titulo) || '',
      imagen_url: val(colMap.imagen_url) || '',
      link_url: val(colMap.link_url) || '',
      activo: colMap.activo !== undefined ? boolVal(colMap.activo) : true,
      orden: numVal(colMap.orden),
      fecha_inicio: dateVal(colMap.fecha_inicio),
      fecha_fin: dateVal(colMap.fecha_fin),
      texto_boton: val(colMap.texto_boton),
      descripcion: val(colMap.descripcion)
    };
  });
}

function filterAndSort(banners) {
  return banners
    .filter((b) => b.activo)
    .filter((b) => isInDateRange(b.fecha_inicio, b.fecha_fin))
    .filter((b) => {
      const url = b.imagen_url;
      return url && url !== '[URL]' && url.length > 5;
    })
    .sort((a, b) => a.orden - b.orden)
    .slice(0, MAX_BANNERS);
}

export async function fetchBanners() {
  if (cachedBanners) return cachedBanners;

  const response = await fetch(GVIZ_URL, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Sheet fetch failed: ${response.status}`);

  const text = await response.text();
  const all = parseSheetResponse(text);
  const result = filterAndSort(all);
  cachedBanners = result;
  return result;
}

export function getPlaceholderImage() {
  return PLACEHOLDER_IMG;
}
