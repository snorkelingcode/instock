
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ContactFormPayload {
  first_name: string;
  last_name: string;
  email: string;
  inquiry_type: 'question' | 'suggestion' | 'partnership' | 'bug' | 'other';
  message: string;
  newsletter_signup: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: ContactFormPayload = await req.json();
    
    console.log("Received contact form submission:", payload);
    
    // Insert into the contact_submissions table
    const { data, error } = await supabase
      .from('contact_submissions')
      .insert({
        first_name: payload.first_name,
        last_name: payload.last_name,
        email: payload.email,
        inquiry_type: payload.inquiry_type,
        message: payload.message,
        newsletter_signup: payload.newsletter_signup,
        status: 'new'
      });
    
    if (error) {
      console.error("Error inserting contact form submission:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing contact form:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
