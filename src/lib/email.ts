import nodemailer, { type Transporter } from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number.parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const PASSWORD_RESET_FROM = process.env.PASSWORD_RESET_FROM || `PYQP Admin <${SMTP_USER}>`;

let transporter: Transporter | null = null;

function getEmailTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({

      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD,
      },
    });
  }
  return transporter;
}

export async function sendPasswordResetEmail({
  to,
  resetUrl,
  recipientName = "Administrator",
}: {
  to: string;
  resetUrl: string;
  recipientName?: string;
}): Promise<boolean> {
  if (!SMTP_USER || !SMTP_PASSWORD) {
    console.warn("SMTP credentials not fully configured; reset email skipped.");
    return false;
  }

  const transport = getEmailTransporter();

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f7fb; margin: 0; padding: 20px; color: #1e293b; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(5, 72, 139, 0.08); }
    .header { background: #05488B; padding: 28px 24px; text-align: center; }
    .header h1 { margin: 0; color: #ffc107; font-size: 22px; font-weight: 800; letter-spacing: 0.5px; }
    .header p { margin: 6px 0 0 0; color: #ffffff; font-size: 13px; opacity: 0.9; }
    .content { padding: 32px 28px; }
    .greeting { font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #05488B; }
    .btn-container { text-align: center; margin: 28px 0; }
    .btn { display: inline-block; background-color: #05488B; color: #ffc107 !important; text-decoration: none; padding: 14px 32px; font-weight: 700; font-size: 15px; border-radius: 10px; box-shadow: 0 3px 8px rgba(5, 72, 139, 0.25); }
    .notice { background: #fffdf5; border-left: 4px solid #ffc107; padding: 14px 16px; margin: 20px 0; border-radius: 6px; font-size: 13px; color: #856404; line-height: 1.5; }
    .footer { background: #f8fafc; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Poornima University</h1>
      <p>Previous Year Question Papers Portal (PYQP)</p>
    </div>
    <div class="content">
      <div class="greeting">Hello, ${recipientName}</div>
      <p>We received a request to reset the password for your administrator account on the Poornima University PYQP Portal.</p>
      
      <div class="btn-container">
        <a href="${resetUrl}" class="btn" target="_blank">Reset Your Password</a>
      </div>

      <div class="notice">
        <strong>Security Notice:</strong> This password reset link is cryptographically protected and will expire in <strong>15 minutes</strong>. If you did not request this change, please ignore this email or notify the Central Library administrator immediately.
      </div>

      <p style="font-size: 13px; color: #64748b;">If the button above does not work, copy and paste this URL into your browser:<br>
      <a href="${resetUrl}" style="color: #05488B; word-break: break-all;">${resetUrl}</a></p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Poornima University Central Library. All rights reserved.<br>
      Ramchandrapura, P.O. Vidhani Vatika, Sitapura Extension, Jaipur, Rajasthan 303905
    </div>
  </div>
</body>
</html>
  `;

  try {
    await transport.sendMail({
      from: PASSWORD_RESET_FROM,
      to,
      subject: "Poornima University PYQP — Admin Password Reset Request",
      html: htmlContent,
    });
    return true;
  } catch (error) {
    console.error("Nodemailer send error:", error);
    return false;
  }
}