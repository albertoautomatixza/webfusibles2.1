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

    const { data: banners, error: bannersError } = await supabase
      .from('banners')
      .select('*')
      .eq('activo', true)
      .order('orden', { ascending: true });

    if (bannersError) {
      console.error('Error fetching banners:', bannersError);
      throw bannersError;
    }

    const { data: productos, error: productosError } = await supabase
      .from('productos')
      .select('*')
      .eq('activo', true)
      .order('orden', { ascending: true });

    if (productosError) {
      console.error('Error fetching productos:', productosError);
      throw productosError;
    }

    return new Response(
      JSON.stringify({
        banners: banners || [],
        productos: productos || [],
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300',
        },
      }
    );
  } catch (error) {
    console.error('Error in api-catalogo:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        banners: [],
        productos: [],
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
