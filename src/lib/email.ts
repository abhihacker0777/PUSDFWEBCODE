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

export async function sendAdminLoginAlertEmail({
  to,
  adminName = "Administrator",
  loginTimeIST,
  priorLoginTimeIST,
  ip,
  userAgent,
  revokeUrl,
}: {
  to: string;
  adminName?: string;
  loginTimeIST: string;
  priorLoginTimeIST?: string;
  ip: string;
  userAgent: string;
  revokeUrl: string;
}): Promise<boolean> {
  if (!SMTP_USER || !SMTP_PASSWORD) {
    console.warn("SMTP credentials not configured; admin login alert skipped.");
    return false;
  }

  const transport = getEmailTransporter();

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 14px rgba(5, 72, 139, 0.08); }
    .header { background: #05488B; padding: 24px; text-align: center; }
    .header h1 { margin: 0; color: #ffc107; font-size: 20px; font-weight: 800; }
    .header p { margin: 4px 0 0 0; color: #ffffff; font-size: 13px; opacity: 0.9; }
    .content { padding: 26px 24px; }
    .alert-banner { background: #eff6ff; border-left: 4px solid #05488B; padding: 12px 16px; margin-bottom: 20px; border-radius: 6px; font-size: 14px; color: #1e3a8a; }
    .meta-table { width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 13px; }
    .meta-table td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
    .meta-label { font-weight: 600; color: #64748b; width: 35%; }
    .meta-value { font-weight: 600; color: #0f172a; word-break: break-all; }
    .btn-container { text-align: center; margin: 26px 0 16px 0; }
    .btn-revoke { display: inline-block; background-color: #dc2626; color: #ffffff !important; text-decoration: none; padding: 12px 28px; font-weight: 700; font-size: 14px; border-radius: 8px; box-shadow: 0 3px 8px rgba(220, 38, 38, 0.25); }
    .footer { background: #f8fafc; padding: 18px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Poornima University</h1>
      <p>Security Alert: Admin Sign-In Detected</p>
    </div>
    <div class="content">
      <div class="alert-banner">
        Hello <strong>${adminName}</strong>, your administrator account was just signed in.
      </div>

      <table class="meta-table">
        <tr>
          <td class="meta-label">Sign-In Time (IST):</td>
          <td class="meta-value">${loginTimeIST}</td>
        </tr>
        <tr>
          <td class="meta-label">Prior Session (IST):</td>
          <td class="meta-value">${priorLoginTimeIST || "First recorded session"}</td>
        </tr>
        <tr>
          <td class="meta-label">Client IP Address:</td>
          <td class="meta-value">${ip}</td>
        </tr>
        <tr>
          <td class="meta-label">Browser / Device:</td>
          <td class="meta-value">${userAgent}</td>
        </tr>
      </table>

      <p style="font-size: 13px; color: #475569; line-height: 1.5;">
        If this was you, you can safely ignore this security notification. If you do not recognize this activity, click below immediately to terminate this session:
      </p>

      <div class="btn-container">
        <a href="${revokeUrl}" class="btn-revoke" target="_blank">Revoke This Session Now</a>
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Poornima University IT & Central Library Security.<br>
      Jaipur, Rajasthan
    </div>
  </div>
</body>
</html>
  `;

  try {
    await transport.sendMail({
      from: PASSWORD_RESET_FROM,
      to,
      subject: `[Security Alert] New Admin Sign-In Detected - ${adminName}`,
      html: htmlContent,
    });
    return true;
  } catch (error) {
    console.error("sendAdminLoginAlertEmail error:", error);
    return false;
  }
}

export async function sendLibraryAdminInviteEmail({
  to,
  adminName = "Library Staff",
  role = "Full",
  loginUrl,
}: {
  to: string;
  adminName?: string;
  role?: string;
  loginUrl: string;
}): Promise<boolean> {
  if (!SMTP_USER || !SMTP_PASSWORD) {
    console.warn("SMTP credentials not configured; invite email skipped.");
    return false;
  }

  const transport = getEmailTransporter();

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: #05488B; padding: 24px; text-align: center; }
    .header h1 { margin: 0; color: #ffc107; font-size: 20px; font-weight: 800; }
    .header p { margin: 4px 0 0 0; color: #ffffff; font-size: 13px; }
    .content { padding: 26px 24px; }
    .role-badge { display: inline-block; background: #dbeafe; color: #1e40af; font-weight: 700; padding: 4px 10px; border-radius: 6px; font-size: 12px; }
    .btn-container { text-align: center; margin: 26px 0; }
    .btn { display: inline-block; background-color: #05488B; color: #ffc107 !important; text-decoration: none; padding: 12px 28px; font-weight: 700; font-size: 14px; border-radius: 8px; }
    .footer { background: #f8fafc; padding: 18px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Poornima University</h1>
      <p>Central Library PYQP Portal</p>
    </div>
    <div class="content">
      <p>Hello <strong>${adminName}</strong>,</p>
      <p>You have been onboarded as a library administrator with the role <span class="role-badge">${role}</span> on the Poornima University Examination Question Paper Portal.</p>
      <p>You can sign in using your institutional Google account or designated login credentials.</p>
      <div class="btn-container">
        <a href="${loginUrl}" class="btn" target="_blank">Access Admin Portal</a>
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Poornima University Central Library
    </div>
  </div>
</body>
</html>
  `;

  try {
    await transport.sendMail({
      from: PASSWORD_RESET_FROM,
      to,
      subject: `Welcome to Poornima PYQP Portal — Admin Access Granted (${role})`,
      html: htmlContent,
    });
    return true;
  } catch (error) {
    console.error("sendLibraryAdminInviteEmail error:", error);
    return false;
  }
}

export async function sendPaperFulfilledNotificationEmail({
  to,
  subjectName,
  subjectCode,
  course,
  semester,
  paperUrl,
}: {
  to: string;
  subjectName: string;
  subjectCode: string;
  course: string;
  semester: string;
  paperUrl: string;
}): Promise<boolean> {
  if (!SMTP_USER || !SMTP_PASSWORD) {
    console.warn("SMTP credentials not configured; paper fulfilled email skipped.");
    return false;
  }

  const transport = getEmailTransporter();

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #e2e8f0; }
    .header { background: #05488B; padding: 24px; text-align: center; }
    .header h1 { margin: 0; color: #ffc107; font-size: 20px; font-weight: 800; }
    .header p { margin: 4px 0 0 0; color: #ffffff; font-size: 13px; }
    .content { padding: 26px 24px; }
    .paper-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px; margin: 16px 0; }
    .btn-container { text-align: center; margin: 24px 0; }
    .btn { display: inline-block; background-color: #05488B; color: #ffc107 !important; text-decoration: none; padding: 12px 28px; font-weight: 700; font-size: 14px; border-radius: 8px; }
    .footer { background: #f8fafc; padding: 18px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Poornima University</h1>
      <p>PYQP Paper Request Fulfilled</p>
    </div>
    <div class="content">
      <p>Hello Student,</p>
      <p>Great news! The question paper you previously requested has been uploaded to the university portal by the Central Library team.</p>
      <div class="paper-box">
        <div style="font-weight: 700; color: #166534; font-size: 15px;">${subjectName} ${subjectCode ? `(${subjectCode})` : ""}</div>
        <div style="font-size: 13px; color: #374151; margin-top: 4px;">Course: <strong>${course}</strong> | Semester: <strong>${semester}</strong></div>
      </div>
      <div class="btn-container">
        <a href="${paperUrl}" class="btn" target="_blank">View / Download Paper</a>
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Poornima University Central Library
    </div>
  </div>
</body>
</html>
  `;

  try {
    await transport.sendMail({
      from: PASSWORD_RESET_FROM,
      to,
      subject: `[Paper Available] ${subjectName} is now ready on the PYQP Portal`,
      html: htmlContent,
    });
    return true;
  } catch (error) {
    console.error("sendPaperFulfilledNotificationEmail error:", error);
    return false;
  }
}