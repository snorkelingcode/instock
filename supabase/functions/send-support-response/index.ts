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
  isContactForm?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messageId, body, userId, isContactForm = false }: ResponsePayload = await req.json();
    
    console.log("Received support response request:", { messageId, userId, isContactForm });

    if (!messageId || !body || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let recipientEmail: string;
    let subject: string;
    let messageBody: string | null = null;
    
    if (isContactForm) {
      // Get contact form submission
      const { data: contactSubmission, error: contactError } = await supabase
        .from("contact_submissions")
        .select("*")
        .eq("id", messageId)
        .single();

      if (contactError || !contactSubmission) {
        console.error("Error fetching contact submission:", contactError);
        return new Response(
          JSON.stringify({ error: "Failed to find contact submission" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      recipientEmail = contactSubmission.email;
      subject = `Re: Your message to TCG Updates - ${contactSubmission.inquiry_type}`;
      messageBody = contactSubmission.message;
      
      // Update contact submission status to replied
      await supabase
        .from("contact_submissions")
        .update({ status: "replied" })
        .eq("id", messageId);
        
    } else {
      // Get original message from support_messages
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
      
      recipientEmail = message.sender_email;
      subject = `Re: ${message.subject}`;
      messageBody = message.body;
      
      // Update the message status to 'replied'
      await supabase
        .from("support_messages")
        .update({ status: "replied" })
        .eq("id", messageId);
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
        to: recipientEmail,
        subject: subject,
        content: `
        <html>
          <body>
            <p>Hello,</p>
            <p>${body}</p>
            <p>Best regards,<br/>
            TCG Updates Support Team</p>
            <hr>
            ${messageBody ? `<p><small>This is in response to your message: "${messageBody}"</small></p>` : ''}
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
            ${messageBody ? `<p><small>This is in response to your message: "${messageBody}"</small></p>` : ''}
          </body>
        </html>`,
      });
      
      console.log("Email sent successfully to:", recipientEmail);
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

    // Record the response
    let responseTable = "support_responses";
    let responseData = {
      message_id: messageId,
      body: body,
      sent_by: userData.user.id,
      delivery_status: "sent"
    };

    const { data: savedResponse, error: responseError } = await supabase
      .from(responseTable)
      .insert(responseData)
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

    console.log("Support response sent and recorded successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Response sent", 
        id: savedResponse[0].id 
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
