import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface BannerRow {
  banner_url: string;
  titulo: string;
}

interface ProductoRow {
  categoria: string;
  imagen_url: string;
  nombre: string;
  descripcion: string;
}

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
      return new Response(
        JSON.stringify({ error: 'spreadsheetId is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const bannersSheet = sheetNames?.banners || 'Banners';
    const productosSheet = sheetNames?.productos || 'Productos';

    // Fetch Banners from Google Sheets
    const bannersUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${bannersSheet}`;
    const bannersResponse = await fetch(bannersUrl);
    const bannersText = await bannersResponse.text();
    const bannersJson = JSON.parse(bannersText.substring(47).slice(0, -2));

    // Fetch Productos from Google Sheets
    const productosUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${productosSheet}`;
    const productosResponse = await fetch(productosUrl);
    const productosText = await productosResponse.text();
    const productosJson = JSON.parse(productosText.substring(47).slice(0, -2));

    // Process Banners
    const banners: BannerRow[] = [];
    if (bannersJson.table.rows) {
      bannersJson.table.rows.forEach((row: any, index: number) => {
        if (row.c && row.c[0] && row.c[1]) {
          const banner_url = row.c[0]?.v || '';
          const titulo = row.c[1]?.v || '';
          if (banner_url && titulo) {
            banners.push({
              banner_url,
              titulo,
            });
          }
        }
      });
    }

    // Process Productos
    const productos: ProductoRow[] = [];
    if (productosJson.table.rows) {
      productosJson.table.rows.forEach((row: any, index: number) => {
        if (row.c && row.c[0] && row.c[1] && row.c[2] && row.c[3]) {
          const categoria = row.c[0]?.v || '';
          const imagen_url = row.c[1]?.v || '';
          const nombre = row.c[2]?.v || '';
          const descripcion = row.c[3]?.v || '';
          if (categoria && imagen_url && nombre && descripcion) {
            productos.push({
              categoria,
              imagen_url,
              nombre,
              descripcion,
            });
          }
        }
      });
    }

    // Delete existing data
    await supabase.from('banners').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('productos').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Insert Banners
    const bannersToInsert = banners.map((banner, index) => ({
      ...banner,
      orden: index,
      activo: true,
    }));

    if (bannersToInsert.length > 0) {
      const { error: bannersError } = await supabase
        .from('banners')
        .insert(bannersToInsert);

      if (bannersError) throw bannersError;
    }

    // Insert Productos
    const productosToInsert = productos.map((producto, index) => ({
      ...producto,
      orden: index,
      activo: true,
    }));

    if (productosToInsert.length > 0) {
      const { error: productosError } = await supabase
        .from('productos')
        .insert(productosToInsert);

      if (productosError) throw productosError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        synced: {
          banners: banners.length,
          productos: productos.length,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error syncing Google Sheets:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
