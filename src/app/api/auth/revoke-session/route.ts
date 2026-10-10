import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")?.trim();

  if (!token) {
    return new NextResponse(
      renderHtml("Invalid Request", "No revocation token provided.", false),
      { status: 400, headers: { "Content-Type": "text/html" } }
    );
  }

  try {
    const adminSupabase = createAdminClient();
    const { data: session, error } = await adminSupabase
      .from("admin_sessions")
      .select("id, email, ip_address, user_agent, is_revoked")
      .eq("revocation_token", token)
      .maybeSingle();

    if (error || !session) {
      return new NextResponse(
        renderHtml("Session Not Found", "This session revocation link is invalid or expired.", false),
        { status: 404, headers: { "Content-Type": "text/html" } }
      );
    }

    if (session.is_revoked) {
      return new NextResponse(
        renderHtml("Session Already Revoked", `The session for ${session.email} from IP ${session.ip_address} has already been terminated.`, true),
        { status: 200, headers: { "Content-Type": "text/html" } }
      );
    }

    // Revoke the session
    await adminSupabase
      .from("admin_sessions")
      .update({ is_revoked: true })
      .eq("id", session.id);

    return new NextResponse(
      renderHtml(
        "Session Revoked Successfully",
        `Access for <strong>${session.email}</strong> from IP <code>${session.ip_address}</code> (${session.user_agent}) has been immediately revoked.`,
        true
      ),
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  } catch (err: any) {
    return new NextResponse(
      renderHtml("Error", err.message || "Failed to process session revocation.", false),
      { status: 500, headers: { "Content-Type": "text/html" } }
    );
  }
}

function renderHtml(title: string, message: string, isSuccess: boolean) {
  const badgeColor = isSuccess ? "#16a34a" : "#dc2626";
  const icon = isSuccess ? "🛡️" : "⚠️";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title} - PYQP Portal</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f1f5f9; margin: 0; padding: 40px 20px; display: flex; align-items: center; justify-content: center; min-height: 80vh; }
    .card { background: #ffffff; border-radius: 16px; max-width: 500px; width: 100%; padding: 36px 28px; box-shadow: 0 10px 25px rgba(0,0,0,0.06); text-align: center; border: 1px solid #e2e8f0; }
    .icon { font-size: 48px; margin-bottom: 12px; }
    h1 { color: #0f172a; font-size: 22px; margin: 0 0 12px 0; font-weight: 700; }
    p { color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; }
    .status-badge { display: inline-block; background: ${badgeColor}; color: #ffffff; padding: 6px 14px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; }
    .btn { display: inline-block; background-color: #05488B; color: #ffc107; text-decoration: none; padding: 12px 20px; font-weight: 700; font-size: 14px; border-radius: 8px; transition: background-color 0.2s; }
    .btn:hover { background-color: #043a70; }
    .btn-danger { background-color: #dc2626; color: #ffffff; }
    .btn-danger:hover { background-color: #b91c1c; }
    .actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-top: 8px; }
    code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 13px; color: #0f172a; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <div class="status-badge">${isSuccess ? "Security Action Confirmed" : "Notice"}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <div class="actions">
      <a href="/reset-password" class="btn btn-danger">Reset Password Immediately</a>
      <a href="/login" class="btn">Return to Login</a>
    </div>
  </div>
</body>
</html>`;
}
