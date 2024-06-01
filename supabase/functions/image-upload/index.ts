// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../_constants/supabase.ts';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// TODO:
// - return proper http error code

const DEFAULT_UPLOAD_BY = 'anon';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const response = {
    success: false,
  }

  if (req.body) {
    const body = await req.formData();
    const imageFile = body.get("image");
    const imagePath = `images/${imageFile.name}`;
    
    // TODO: support duplicate names (maybe we can put them into a folder by user or add a date to the name so it's unique)
    const { data, error } = await supabase.storage.from('images').upload(imagePath, imageFile);

    if (error) {
      response.error = error;
    } else {
      response.data = data;
      response.success = true;

      const { error: dbError } = await supabase
        .from('images')
        .insert({
          bucket_location: data.path,
          storage_id: data.id,
          uploaded_by: DEFAULT_UPLOAD_BY 
         });
      
      if (dbError) {
        // TODO: if there is an error we should also delete the image or it will be not images not accounted for
        response.error = dbError;
      }
    }
  } else {
    response.error = { message: "no body found" }
  }

  return new Response(JSON.stringify(response), 
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  )
});
