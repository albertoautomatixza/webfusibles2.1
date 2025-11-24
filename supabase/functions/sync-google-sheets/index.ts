import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { spreadsheetId, sheetNames } = await req.json();

    if (!spreadsheetId) {
      throw new Error('spreadsheetId is required');
    }

    const bannersSheetName = sheetNames?.banners || 'Banners';
    const productosSheetName = sheetNames?.productos || 'Productos';

    async function fetchSheet(sheetName: string) {
      const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
      const res = await fetch(url);
      const text = await res.text();

      const json = JSON.parse(text.substring(47).slice(0, -2));
      const allRows = json.table.rows.map((r: any) => r.c.map((c: any) => c?.v ?? null));
      
      if (allRows.length === 0) return [];
      
      const headers = allRows[0];
      const dataRows = allRows.slice(1);

      return dataRows.map((row: any) => {
        const obj: Record<string, any> = {};
        headers.forEach((header: string, i: number) => {
          if (header) {
            obj[header] = row[i];
          }
        });
        return obj;
      });
    }

    function convertGoogleDriveUrl(url: string): string {
      if (!url) return url;

      const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match) {
        return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w2000`;
      }

      return url;
    }

    const bannersSheet = await fetchSheet(bannersSheetName);
    const productosSheet = await fetchSheet(productosSheetName);

    await supabase.from('banners').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('productos').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const bannersToInsert = bannersSheet
      .filter((b: any) => b.Banner_url)
      .map((b: any, index: number) => ({
        banner_url: convertGoogleDriveUrl(b.Banner_url),
        titulo: b.titulo || '',
        orden: index,
        activo: true,
      }));

    const productosToInsert = productosSheet
      .filter((p: any) => p.Imagen_url)
      .map((p: any, index: number) => ({
        categoria: p.Categoria || '',
        imagen_url: convertGoogleDriveUrl(p.Imagen_url),
        nombre: p.Nombre || '',
        descripcion: p.Descripcion || '',
        orden: index,
        activo: true,
      }));

    if (bannersToInsert.length > 0) {
      const { error: bannersError } = await supabase.from('banners').insert(bannersToInsert);
      if (bannersError) throw bannersError;
    }

    if (productosToInsert.length > 0) {
      const { error: productosError } = await supabase.from('productos').insert(productosToInsert);
      if (productosError) throw productosError;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        banners: bannersToInsert.length,
        productos: productosToInsert.length,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error syncing Google Sheets:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        ok: false,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
