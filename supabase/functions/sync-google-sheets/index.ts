import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SHEET_ID = "112hxQ5igL1W7_nz0Q5_tsDZ3wRrA24Gqs3g7F20eeaw";

async function fetchSheet(sheetName: string) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${sheetName}`;
  const res = await fetch(url);
  const text = await res.text();

  const json = JSON.parse(text.substring(47).slice(0, -2));
  const rows = json.table.rows.map((r) => r.c.map((c) => c?.v ?? null));
  const headers = rows.shift();

  return rows.map((row) => {
    const obj: Record<string, string | null> = {};
    headers.forEach((header: string, i: number) => {
      obj[header] = row[i];
    });
    return obj;
  });
}

serve(async () => {
  try {
    // BANNERS
    const bannersSheet = await fetchSheet("Banners");

    await supabase.from("banners").delete().neq("banner_url", "");

    await supabase.from("banners").insert(
      bannersSheet.map((b) => ({
        banner_url: b.Banner_url,
        titulo: b.titulo,
      })),
    );

    // PRODUCTOS
    const productosSheet = await fetchSheet("Productos");

    await supabase.from("productos").delete().neq("imagen_url", "");

    await supabase.from("productos").insert(
      productosSheet.map((p) => ({
        categoria: p.Categoria,
        imagen_url: p.Imagen_url,
        nombre: p.Nombre,
        descripcion: p.Descripcion
      })),
    );

    return new Response(
      JSON.stringify({
        ok: true,
        banners: bannersSheet.length,
        productos: productosSheet.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
    });
  }
});
