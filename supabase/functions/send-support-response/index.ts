
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ResponsePayload {
  messageId: string;
  body: string;
  userId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messageId, body, userId }: ResponsePayload = await req.json();
    
    console.log("Received support response request:", { messageId, userId });

    if (!messageId || !body || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get original message
    const { data: message, error: messageError } = await supabase
      .from("support_messages")
      .select("*")
      .eq("id", messageId)
      .single();

    if (messageError || !message) {
      console.error("Error fetching original message:", messageError);
      return new Response(
        JSON.stringify({ error: "Failed to find original message" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get user info
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);

    if (userError || !userData.user) {
      console.error("Error fetching user data:", userError);
      return new Response(
        JSON.stringify({ error: "Failed to get user information" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Here we would use SendGrid or another email provider to send the actual email
    // This is a simplified implementation that just records the response

    // Record the response in the database
    const { data: responseData, error: responseError } = await supabase
      .from("support_responses")
      .insert({
        message_id: messageId,
        body: body,
        sent_by: userData.user.email,
        delivery_status: "recorded" // In a real implementation, this would be updated based on email delivery
      })
      .select();

    if (responseError) {
      console.error("Error storing response:", responseError);
      return new Response(
        JSON.stringify({ error: "Failed to store response" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update the message status to 'replied'
    const { error: updateError } = await supabase
      .from("support_messages")
      .update({ status: "replied" })
      .eq("id", messageId);

    if (updateError) {
      console.error("Error updating message status:", updateError);
      // We still continue as the response was saved
    }

    console.log("Support response recorded successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Response recorded", 
        id: responseData[0].id 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error sending support response:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process response", details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        
      }
    );
  }
});
