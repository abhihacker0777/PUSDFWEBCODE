const { google } = require("googleapis");
const {
  CLIENT_ID,
  CLIENT_SECRET,
  DRIVE_REFRESH_TOKEN,
  GOOGLE_SIGNIN_CLIENT_ID,
  ASSISTANT_EMAIL_DOMAIN
} = require("../config/env");
const { googleCredentialSchema } = require("../validators/authValidators");
const { normalizeText } = require("../utils/helpers");

let assistantSheetsAuthClient = null;
let googleServiceAuthClient = null;
const googleSignInClient = new google.auth.OAuth2(GOOGLE_SIGNIN_CLIENT_ID);

function isAllowedAssistantEmail(email) {
  const cleanEmail = normalizeText(email, 254).toLowerCase();
  return cleanEmail.endsWith(`@${ASSISTANT_EMAIL_DOMAIN}`);
}

async function verifyAssistantGoogleCredential(credential) {
  const parsedCredential = googleCredentialSchema.safeParse(credential);
  const idToken = parsedCredential.success ? parsedCredential.data : "";
  if (!idToken) {
    const err = new Error("Please Sign In With Your Poornima Google Account.");
    err.code = "SIGN_IN_REQUIRED";
    throw err;
  }

  let ticket;
  try {
    ticket = await googleSignInClient.verifyIdToken({
      idToken,
      audience: GOOGLE_SIGNIN_CLIENT_ID
    });
  } catch (verifyErr) {
    const err = new Error("Please sign in again with your Poornima Google account.");
    err.code = "INVALID_GOOGLE_TOKEN";
    throw err;
  }

  const payload = ticket.getPayload() || {};
  const email = normalizeText(payload.email, 254).toLowerCase();
  const name = normalizeText(payload.name, 120);
  const picture = normalizeText(payload.picture, 500);

  if (!payload.email_verified) {
    const err = new Error("Google email is not verified.");
    err.code = "INVALID_GOOGLE_ACCOUNT";
    throw err;
  }

  if (!isAllowedAssistantEmail(email)) {
    const err = new Error(`Please Sign In With Your ${ASSISTANT_EMAIL_DOMAIN} Google Account.`);
    err.code = "INVALID_EMAIL_DOMAIN";
    throw err;
  }

  return { email, name, picture };
}

async function getGoogleOAuthClient() {
  if (googleServiceAuthClient) return googleServiceAuthClient;

  if (!CLIENT_ID || !CLIENT_SECRET || !DRIVE_REFRESH_TOKEN) {
    throw new Error("Missing OAuth2 credentials in .env");
  }

  googleServiceAuthClient = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
  googleServiceAuthClient.setCredentials({ refresh_token: DRIVE_REFRESH_TOKEN });
  return googleServiceAuthClient;
}

async function getAssistantSheetsAuthClient() {
  if (assistantSheetsAuthClient) return assistantSheetsAuthClient;
  assistantSheetsAuthClient = await getGoogleOAuthClient();
  return assistantSheetsAuthClient;
}

async function getServiceSheets() {
  const authClient = await getGoogleOAuthClient();
  return google.sheets({ version: "v4", auth: authClient });
}

async function getServiceDrive() {
  const authClient = await getGoogleOAuthClient();
  return google.drive({ version: "v3", auth: authClient });
}

module.exports = {
  verifyAssistantGoogleCredential,
  getAssistantSheetsAuthClient,
  getServiceSheets,
  getServiceDrive
};
