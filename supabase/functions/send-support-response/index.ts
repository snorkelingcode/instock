
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts";

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

    // Send email using SMTP
    try {
      const smtpClient = new SMTPClient({
        connection: {
          hostname: "smtp.sendgrid.net",
          port: 587,
          tls: true,
          auth: {
            username: "apikey",
            password: Deno.env.get("SMTP_PASSWORD") || "",
          },
        },
      });

      await smtpClient.send({
        from: `TCG Updates <noreply@tcgupdates.com>`,
        to: message.sender_email,
        subject: `Re: ${message.subject}`,
        content: `
        <html>
          <body>
            <p>Hello,</p>
            <p>${body}</p>
            <p>Best regards,<br/>
            TCG Updates Support Team</p>
            <hr>
            <p><small>This is in response to your inquiry: "${message.subject}"</small></p>
          </body>
        </html>`,
        html: `
        <html>
          <body>
            <p>Hello,</p>
            <p>${body}</p>
            <p>Best regards,<br/>
            TCG Updates Support Team</p>
            <hr>
            <p><small>This is in response to your inquiry: "${message.subject}"</small></p>
          </body>
        </html>`,
      });
      
      console.log("Email sent successfully to:", message.sender_email);
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: emailError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Record the response in the database
    const { data: responseData, error: responseError } = await supabase
      .from("support_responses")
      .insert({
        message_id: messageId,
        body: body,
        sent_by: userData.user.email,
        delivery_status: "sent" // We're now sending the email directly
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

    console.log("Support response sent and recorded successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Response sent", 
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
