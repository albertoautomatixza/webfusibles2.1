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

async function uploadImageToSupabase(
  supabase: any,
  imageUrl: string,
  fileName: string
): Promise<string> {
  try {
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }

    const imageBlob = await imageResponse.blob();
    const arrayBuffer = await imageBlob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const contentType = imageBlob.type || 'image/jpeg';
    const extension = contentType.split('/')[1] || 'jpg';
    const fullFileName = `${fileName}.${extension}`;

    const { data, error } = await supabase.storage
      .from('catalog-images')
      .upload(fullFileName, uint8Array, {
        contentType,
        upsert: true,
      });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from('catalog-images')
      .getPublicUrl(fullFileName);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    return imageUrl;
  }
}

function extractImageUrl(cellData: any): string | null {
  if (!cellData) return null;

  if (typeof cellData.v === 'string' && cellData.v.startsWith('http')) {
    return cellData.v;
  }

  if (cellData.f && typeof cellData.f === 'string') {
    const imageMatch = cellData.f.match(/IMAGE\("([^"]+)"\)/);
    if (imageMatch) {
      return imageMatch[1];
    }
  }

  return null;
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

    const bannersUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${bannersSheet}`;
    const bannersResponse = await fetch(bannersUrl);
    const bannersText = await bannersResponse.text();
    const bannersJson = JSON.parse(bannersText.substring(47).slice(0, -2));

    const productosUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json&sheet=${productosSheet}`;
    const productosResponse = await fetch(productosUrl);
    const productosText = await productosResponse.text();
    const productosJson = JSON.parse(productosText.substring(47).slice(0, -2));

    const banners: BannerRow[] = [];
    if (bannersJson.table.rows) {
      for (let i = 0; i < bannersJson.table.rows.length; i++) {
        const row = bannersJson.table.rows[i];
        if (row.c && row.c[0] && row.c[1]) {
          let banner_url = extractImageUrl(row.c[0]) || row.c[0]?.v || '';
          const titulo = row.c[1]?.v || '';

          if (banner_url && titulo) {
            if (banner_url.startsWith('http')) {
              banner_url = await uploadImageToSupabase(
                supabase,
                banner_url,
                `banner-${i}-${Date.now()}`
              );
            }

            banners.push({
              banner_url,
              titulo,
            });
          }
        }
      }
    }

    const productos: ProductoRow[] = [];
    if (productosJson.table.rows) {
      for (let i = 0; i < productosJson.table.rows.length; i++) {
        const row = productosJson.table.rows[i];
        if (row.c && row.c[0] && row.c[1] && row.c[2] && row.c[3]) {
          const categoria = row.c[0]?.v || '';
          let imagen_url = extractImageUrl(row.c[1]) || row.c[1]?.v || '';
          const nombre = row.c[2]?.v || '';
          const descripcion = row.c[3]?.v || '';

          if (categoria && imagen_url && nombre && descripcion) {
            if (imagen_url.startsWith('http')) {
              imagen_url = await uploadImageToSupabase(
                supabase,
                imagen_url,
                `producto-${i}-${Date.now()}`
              );
            }

            productos.push({
              categoria,
              imagen_url,
              nombre,
              descripcion,
            });
          }
        }
      }
    }

    await supabase.from('banners').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('productos').delete().neq('id', '00000000-0000-0000-0000-000000000000');

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
