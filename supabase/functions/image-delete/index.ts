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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

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
  } else if (!data[0]) {
    console.log('DELETE IMAGE', {
      id,
      message: 'image does not exist'
    })

    response.success = true;
  } else {
    const file = data[0];
    // first we gotta delete the image from the bucket
    const deleteImage = await supabase
      .storage
      .from('images')
      .remove([file.bucket_location]);
    

    // TODO: we gotta clean this up.... lots of ifs and else
    if (deleteImage.error) {
      console.log('DELETE IMAGE', {
        id,
        message: 'Error in deleteImage',
        error: deleteImage.error,
      });
      response.error = deleteImage.error;
    } else {
      const deleteResponse = await supabase
        .from('images')
        .delete()
        .eq('id', id);
      
      if (deleteResponse.error) {
        console.log('DELETE IMAGE', {
          id,
          message: 'Error in deleteResponse',
          error: deleteResponse.error,
        });
      } else {
        response.success = true;
      }
    }

  }

  return new Response(JSON.stringify(response), 
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    }
  )
});
