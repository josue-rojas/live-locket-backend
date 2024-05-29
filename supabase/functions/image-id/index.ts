// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Create Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? Deno.env.get('LOCAL_SUPABASE_URL'),
  Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('LOCAL_SUPABASE_ANON_KEY'));

// TODO:
// - return proper http error code

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const pathname = url.pathname.split('/');
  const id = parseInt(pathname[pathname.length - 1]);

  const response = {
    success: false,
  }

  const { data, error } = await supabase
    .from('images')
    .select()
    .eq('id', id);
  
  if (error) {
    response.error = error;
  } else {
    response.data = data[0] || []
    response.success = true;
  }

  return new Response(JSON.stringify(response), 
    { headers: { "Content-Type": "application/json" } },
  )
});
