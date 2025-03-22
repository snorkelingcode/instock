
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

// Get the API key from environment variables
const resendApiKey = Deno.env.get("RESEND_API_KEY");
const resend = new Resend(resendApiKey);

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the webhook payload from Supabase Auth
    const payload = await req.json();

    // Extract relevant information
    const { type, email, data } = payload;

    // Define email templates based on the event type
    let subject, htmlContent;

    if (type === "signup") {
      subject = "Welcome to TCG Updates!";
      htmlContent = generateSignupEmail(email, data);
    } else if (type === "magiclink") {
      subject = "Your TCG Updates Magic Link";
      htmlContent = generateMagicLinkEmail(data.link);
    } else if (type === "recovery") {
      subject = "Reset Your TCG Updates Password";
      htmlContent = generateRecoveryEmail(data.link);
    } else if (type === "invite") {
      subject = "You've been invited to TCG Updates";
      htmlContent = generateInviteEmail(data.link);
    } else if (type === "confirmation") {
      subject = "Confirm Your TCG Updates Email";
      htmlContent = generateConfirmationEmail(data.link);
    } else {
      // Default fallback
      subject = "TCG Updates Notification";
      htmlContent = generateDefaultEmail(type, data);
    }

    // Send the custom email using Resend
    const { data: emailData, error } = await resend.emails.send({
      from: "TCG Updates <noreply@tcgupdates.com>",
      to: [email],
      subject: subject,
      html: htmlContent,
    });

    if (error) {
      console.error("Error sending email:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log("Email sent successfully:", emailData);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

// Email template generators
function generateSignupEmail(email: string, data: any) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to TCG Updates!</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          border-bottom: 3px solid #e63946;
        }
        .logo {
          max-width: 200px;
          margin-bottom: 10px;
        }
        h1 {
          color: #1d3557;
          margin-top: 0;
        }
        .content {
          padding: 20px 0;
        }
        .button {
          display: inline-block;
          padding: 10px 20px;
          background-color: #e63946;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          margin: 20px 0;
        }
        .footer {
          font-size: 12px;
          color: #666;
          border-top: 1px solid #eee;
          padding-top: 20px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>TCG Updates</h1>
      </div>
      <div class="content">
        <h2>Welcome to TCG Updates!</h2>
        <p>Thank you for signing up. Your account has been created successfully.</p>
        <p>You can now log in and start exploring the latest TCG updates, news, and more.</p>
        <a href="https://www.tcgupdates.com/dashboard" class="button">Go to Dashboard</a>
        <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} TCG Updates. All rights reserved.</p>
        <p>You're receiving this email because you signed up for TCG Updates.</p>
      </div>
    </body>
    </html>
  `;
}

function generateMagicLinkEmail(link: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Your Magic Link for TCG Updates</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          border-bottom: 3px solid #e63946;
        }
        .logo {
          max-width: 200px;
          margin-bottom: 10px;
        }
        h1 {
          color: #1d3557;
          margin-top: 0;
        }
        .content {
          padding: 20px 0;
        }
        .button {
          display: inline-block;
          padding: 10px 20px;
          background-color: #e63946;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          margin: 20px 0;
        }
        .footer {
          font-size: 12px;
          color: #666;
          border-top: 1px solid #eee;
          padding-top: 20px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>TCG Updates</h1>
      </div>
      <div class="content">
        <h2>Your Magic Link</h2>
        <p>You requested to sign in to TCG Updates. Click the button below to sign in:</p>
        <a href="${link}" class="button">Sign In to TCG Updates</a>
        <p>This link will expire in 24 hours. If you didn't request this, you can safely ignore this email.</p>
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} TCG Updates. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
}

function generateRecoveryEmail(link: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reset Your TCG Updates Password</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          border-bottom: 3px solid #e63946;
        }
        .logo {
          max-width: 200px;
          margin-bottom: 10px;
        }
        h1 {
          color: #1d3557;
          margin-top: 0;
        }
        .content {
          padding: 20px 0;
        }
        .button {
          display: inline-block;
          padding: 10px 20px;
          background-color: #e63946;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          margin: 20px 0;
        }
        .footer {
          font-size: 12px;
          color: #666;
          border-top: 1px solid #eee;
          padding-top: 20px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>TCG Updates</h1>
      </div>
      <div class="content">
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password for TCG Updates. Click the button below to set a new password:</p>
        <a href="${link}" class="button">Reset Your Password</a>
        <p>This link will expire in 24 hours. If you didn't request this, you can safely ignore this email.</p>
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} TCG Updates. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
}

function generateInviteEmail(link: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>You've Been Invited to TCG Updates</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          border-bottom: 3px solid #e63946;
        }
        .logo {
          max-width: 200px;
          margin-bottom: 10px;
        }
        h1 {
          color: #1d3557;
          margin-top: 0;
        }
        .content {
          padding: 20px 0;
        }
        .button {
          display: inline-block;
          padding: 10px 20px;
          background-color: #e63946;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          margin: 20px 0;
        }
        .footer {
          font-size: 12px;
          color: #666;
          border-top: 1px solid #eee;
          padding-top: 20px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>TCG Updates</h1>
      </div>
      <div class="content">
        <h2>You've Been Invited!</h2>
        <p>You've been invited to join TCG Updates. Click the button below to accept the invitation:</p>
        <a href="${link}" class="button">Accept Invitation</a>
        <p>This link will expire in 24 hours.</p>
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} TCG Updates. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
}

function generateConfirmationEmail(link: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Confirm Your TCG Updates Email</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          border-bottom: 3px solid #e63946;
        }
        .logo {
          max-width: 200px;
          margin-bottom: 10px;
        }
        h1 {
          color: #1d3557;
          margin-top: 0;
        }
        .content {
          padding: 20px 0;
        }
        .button {
          display: inline-block;
          padding: 10px 20px;
          background-color: #e63946;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          margin: 20px 0;
        }
        .footer {
          font-size: 12px;
          color: #666;
          border-top: 1px solid #eee;
          padding-top: 20px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>TCG Updates</h1>
      </div>
      <div class="content">
        <h2>Confirm Your Email</h2>
        <p>Thank you for signing up! Please confirm your email address by clicking the button below:</p>
        <a href="${link}" class="button">Confirm Email</a>
        <p>This link will expire in 24 hours.</p>
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} TCG Updates. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
}

function generateDefaultEmail(type: string, data: any) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>TCG Updates Notification</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          border-bottom: 3px solid #e63946;
        }
        .logo {
          max-width: 200px;
          margin-bottom: 10px;
        }
        h1 {
          color: #1d3557;
          margin-top: 0;
        }
        .content {
          padding: 20px 0;
        }
        .footer {
          font-size: 12px;
          color: #666;
          border-top: 1px solid #eee;
          padding-top: 20px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>TCG Updates</h1>
      </div>
      <div class="content">
        <h2>Notification</h2>
        <p>You have a new notification from TCG Updates.</p>
        <p>Please visit our website for more information.</p>
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} TCG Updates. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
}
