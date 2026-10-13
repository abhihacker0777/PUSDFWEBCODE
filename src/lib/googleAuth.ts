import { google } from "googleapis";

const CLIENT_ID = process.env.CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_SIGNIN_CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const DRIVE_REFRESH_TOKEN = process.env.DRIVE_REFRESH_TOKEN;
const GOOGLE_SIGNIN_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_SIGNIN_CLIENT_ID || process.env.GOOGLE_SIGNIN_CLIENT_ID || CLIENT_ID;
const ASSISTANT_EMAIL_DOMAIN = (process.env.ASSISTANT_EMAIL_DOMAIN || "").trim().replace(/^@/, "");

let googleServiceAuthClient: any = null;
const googleSignInClient = new google.auth.OAuth2(GOOGLE_SIGNIN_CLIENT_ID);

export function isAllowedAssistantEmail(email: string): boolean {
  if (!email) return false;
  if (!ASSISTANT_EMAIL_DOMAIN) return true;
  return email.toLowerCase().trim().endsWith(`@${ASSISTANT_EMAIL_DOMAIN.toLowerCase()}`);
}

export async function verifyAssistantGoogleCredential(idToken: string) {
  if (!idToken) {
    const domainMsg = ASSISTANT_EMAIL_DOMAIN ? ` with your @${ASSISTANT_EMAIL_DOMAIN}` : "";
    const err = new Error(`Please sign in${domainMsg} Google account.`);
    (err as any).code = "SIGN_IN_REQUIRED";
    throw err;
  }

  let ticket;
  try {
    ticket = await googleSignInClient.verifyIdToken({
      idToken,
      audience: GOOGLE_SIGNIN_CLIENT_ID,
    });
  } catch (verifyErr) {
    const domainMsg = ASSISTANT_EMAIL_DOMAIN ? ` with your @${ASSISTANT_EMAIL_DOMAIN}` : "";
    const err = new Error(`Please sign in again${domainMsg} Google account.`);
    (err as any).code = "INVALID_GOOGLE_TOKEN";
    throw err;
  }

  const payload = (ticket.getPayload() || {}) as Record<string, any>;
  const email = (payload.email || "").toLowerCase().trim();
  const name = (payload.name || "").trim();
  const picture = payload.picture || "";

  if (!payload.email_verified) {
    const err = new Error("Google email is not verified.");
    (err as any).code = "INVALID_GOOGLE_ACCOUNT";
    throw err;
  }

  if (!isAllowedAssistantEmail(email)) {
    const err = new Error(`Please sign in with your @${ASSISTANT_EMAIL_DOMAIN} Google Account.`);
    (err as any).code = "INVALID_EMAIL_DOMAIN";
    throw err;
  }

  return { email, name, picture };
}

export const verifyGoogleInstitutionalToken = verifyAssistantGoogleCredential;

export function getGoogleOAuthClient() {
  if (googleServiceAuthClient) return googleServiceAuthClient;

  if (!CLIENT_ID || !CLIENT_SECRET || !DRIVE_REFRESH_TOKEN) {
    throw new Error("Missing Google Drive OAuth2 credentials in environment variables.");
  }

  googleServiceAuthClient = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
  googleServiceAuthClient.setCredentials({ refresh_token: DRIVE_REFRESH_TOKEN });
  return googleServiceAuthClient;
}

export function getServiceDrive() {
  const authClient = getGoogleOAuthClient();
  return google.drive({ version: "v3", auth: authClient });
}

export function getServiceSheets() {
  const authClient = getGoogleOAuthClient();
  return google.sheets({ version: "v4", auth: authClient });
}
