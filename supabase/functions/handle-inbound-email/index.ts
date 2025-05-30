
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface InboundEmailPayload {
  from: string;
  to: string[] | string;
  subject: string;
  text: string;
  html?: string;
  attachments?: {
    filename: string;
    content: string; // Base64 encoded content
    type: string; // MIME type
  }[];
  headers?: Record<string, string>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Log the full request for debugging
    console.log("Received request:", {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries())
    });
    
    // For SendGrid inbound parse webhook, the payload will be form data
    let payload: InboundEmailPayload;
    
    const contentType = req.headers.get("content-type") || "";
    
    if (contentType.includes("application/json")) {
      // Standard JSON payload handling
      payload = await req.json();
    } else if (contentType.includes("application/x-www-form-urlencoded") || 
               contentType.includes("multipart/form-data")) {
      // SendGrid webhook sends data as form-data
      const formData = await req.formData();
      
      // Extract the email data from SendGrid's format
      const from = formData.get("from") as string;
      const subject = formData.get("subject") as string;
      const text = formData.get("text") as string;
      const html = formData.get("html") as string;
      const to = formData.get("to") as string;
      
      payload = {
        from,
        to,
        subject,
        text,
        html
      };
      
      // Handle attachments if present (would need additional processing)
    } else {
      throw new Error(`Unsupported content type: ${contentType}`);
    }
    
    console.log("Processed email payload:", JSON.stringify(payload));

    // Extract sender information
    const fromParts = payload.from.match(/^(?:"?([^"]*)"?\s)?<?([^\s>]*)>?$/);
    const senderName = fromParts ? fromParts[1] || null : null;
    const senderEmail = fromParts ? fromParts[2] : payload.from;

    // Extract recipient
    let recipient = "";
    if (Array.isArray(payload.to)) {
      recipient = payload.to[0].split("@")[0]; // e.g., "support" from "support@tcgupdates.com"
    } else {
      recipient = payload.to.split("@")[0];
    }

    console.log("Parsed email details:", { 
      senderName, 
      senderEmail, 
      recipient, 
      subject: payload.subject 
    });

    // Process any attachments
    const attachmentUrls: string[] = [];
    // Implementation would upload attachments to Storage and save URLs

    // Store the email in the database
    const { data, error } = await supabase.from("support_messages").insert({
      subject: payload.subject,
      body: payload.text,
      html_body: payload.html || null,
      sender_email: senderEmail,
      sender_name: senderName,
      recipient: recipient,
      attachment_urls: attachmentUrls,
      status: 'new'  // Explicitly set status to 'new'
    }).select();

    if (error) {
      console.error("Error storing email:", error);
      return new Response(
        JSON.stringify({ error: "Failed to store email" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Email successfully stored with ID:", data[0].id);

    // Return success
    return new Response(
      JSON.stringify({ success: true, message: "Email received and stored", id: data[0].id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing incoming email:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process email", details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
