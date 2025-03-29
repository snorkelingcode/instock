
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@1.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const resend = new Resend(resendApiKey);

interface ResponsePayload {
  messageId: string;
  body: string;
  htmlBody?: string;
  userId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messageId, body, htmlBody, userId }: ResponsePayload = await req.json();

    // Get the original message details
    const { data: message, error: messageError } = await supabase
      .from("support_messages")
      .select("*")
      .eq("id", messageId)
      .single();

    if (messageError || !message) {
      console.error("Error retrieving message:", messageError);
      return new Response(
        JSON.stringify({ error: "Message not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Send email via Resend
    const emailResult = await resend.emails.send({
      from: `${message.recipient}@tcgupdates.com`,
      to: message.sender_email,
      subject: `Re: ${message.subject}`,
      text: body,
      html: htmlBody || `<div>${body.replace(/\n/g, '<br>')}</div>`,
      reply_to: `${message.recipient}@tcgupdates.com`,
    });

    console.log("Email send result:", emailResult);

    // Store the response in the database
    const { data: responseData, error: responseError } = await supabase
      .from("support_responses")
      .insert({
        message_id: messageId,
        body: body,
        html_body: htmlBody || null,
        sent_by: userId,
        delivery_status: emailResult.id ? "sent" : "failed",
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
    await supabase
      .from("support_messages")
      .update({ status: "replied" })
      .eq("id", messageId);

    // Return success
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Response sent and stored", 
        id: responseData[0].id,
        emailId: emailResult.id
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error sending support response:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send response" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
