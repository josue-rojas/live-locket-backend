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

const DEFAULT_UPLOAD_BY = 'anon';

Deno.serve(async (req) => {
  const response = {
    success: false,
  }

  if (req.body) {
    const body = await req.formData();
    const imageFile = body.get("image");
    const imagePath = `images/${imageFile.name}`;
    
    const { data, error } = await supabase.storage.from('images').upload(imagePath, imageFile);

    if (error) {
      response.error = error;
    } else {
      response.datas = data;
      response.success = true;

      const { error: dbError } = await supabase
        .from('images')
        .insert({
          bucket_location: data.fullPath,
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
    { headers: { "Content-Type": "application/json" } },
  )
});
