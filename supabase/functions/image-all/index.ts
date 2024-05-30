// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../_constants/supabase.ts';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// TODO:
// - return proper http error code

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  const response = {
    success: false,
  }


  const { data, error } = await supabase
    .from('images')
    .select();
  
  if (error) {
    response.error = error;
  } else {
    response.data = data
    response.success = true;
  }

  return new Response(JSON.stringify(response), 
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  )
});
