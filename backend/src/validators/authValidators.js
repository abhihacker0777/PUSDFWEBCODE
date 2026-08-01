const { z } = require("zod");
const {
  normalizeText,
  sanitizeFreeText,
  normalizeAuthIdentifier,
  normalizeUuid
} = require("../utils/helpers");
const { ADMIN_ROLES } = require("../config/permissions");

const MAX_ASSISTANT_TEXT_LENGTH = 500;
const EMAIL_PATTERN = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
const USERNAME_PATTERN = /^[a-z0-9._@-]+$/i;

const emailSchema = z.preprocess(
  (value) => normalizeAuthIdentifier(value),
  z.string()
    .min(3)
    .max(254)
    .regex(EMAIL_PATTERN)
);

const loginIdentifierSchema = z.preprocess(
  (value) => normalizeAuthIdentifier(value),
  z.string()
    .min(3)
    .max(254)
    .refine((value) => EMAIL_PATTERN.test(value) || USERNAME_PATTERN.test(value))
);

const passwordInputSchema = z.preprocess(
  (value) => (typeof value === "string" ? value : ""),
  z.string()
    .min(8)
    .max(128)
    .regex(/^[\x20-\x7E]+$/)
);

const newPasswordInputSchema = z.preprocess(
  (value) => (typeof value === "string" ? value : ""),
  z.string()
    .min(10)
    .max(128)
    .regex(/^[\x20-\x7E]+$/)
);

const captchaTokenSchema = z.preprocess(
  (value) => normalizeText(value, 2048),
  z.string()
    .max(2048)
    .regex(/^[a-zA-Z0-9._:-]*$/)
);

function freeTextSchema(maxLength, minLength = 1) {
  return z.preprocess(
    (value) => sanitizeFreeText(value, maxLength),
    z.string()
      .min(minLength)
      .max(maxLength)
      .regex(/^[a-zA-Z0-9\s.,!?'"()&:/+\-_@#;|]*$/)
  );
}

const loginBodySchema = z.object({
  email: loginIdentifierSchema.optional(),
  username: loginIdentifierSchema.optional(),
  password: passwordInputSchema,
  captchaToken: captchaTokenSchema.optional()
}).passthrough().transform((value) => ({
  identifier: value.email || value.username || "",
  password: value.password,
  captchaToken: value.captchaToken || ""
})).refine((value) => Boolean(value.identifier));

const passwordResetBodySchema = z.object({
  email: emailSchema
}).passthrough();

const resetTokenSchema = z.preprocess(
  (value) => normalizeText(value, 160),
  z.string()
    .min(32)
    .max(160)
    .regex(/^[a-zA-Z0-9_-]+$/)
);

const passwordResetConfirmBodySchema = z.object({
  token: resetTokenSchema,
  password: newPasswordInputSchema
}).passthrough();

const emailBodySchema = z.object({
  email: emailSchema
}).passthrough();

const googleCredentialSchema = z.preprocess(
  (value) => normalizeText(value, 3000),
  z.string()
    .min(20)
    .max(3000)
    .regex(/^[a-zA-Z0-9_.=-]+$/)
);

const assistantGoogleVerifyBodySchema = z.object({
  credential: googleCredentialSchema
}).passthrough();

const assistantSearchBodySchema = z.object({
  credential: googleCredentialSchema,
  question: freeTextSchema(MAX_ASSISTANT_TEXT_LENGTH, 2)
}).passthrough();

const customReplyBodySchema = z.object({
  keyword: freeTextSchema(200, 1),
  reply: freeTextSchema(1000, 1)
}).passthrough();

const customReplyDeleteBodySchema = z.object({
  keyword: freeTextSchema(200, 1)
}).passthrough();

const optionalEmailSchema = z.preprocess(
  (value) => normalizeAuthIdentifier(value),
  z.string()
    .max(254)
    .refine((value) => !value || EMAIL_PATTERN.test(value))
);

const adminRoleSchema = z.preprocess(
  (value) => normalizeText(value, 20).toLowerCase(),
  z.enum(ADMIN_ROLES)
);

const adminDisplayNameSchema = freeTextSchema(80, 0);

const adminUserCreateBodySchema = z.object({
  username: loginIdentifierSchema,
  email: optionalEmailSchema.optional(),
  displayName: adminDisplayNameSchema.optional(),
  password: newPasswordInputSchema,
  role: adminRoleSchema
}).passthrough().transform((value) => ({
  loginIdentifier: value.username,
  email: value.email || "",
  displayName: value.displayName || "",
  password: value.password,
  role: value.role
}));

const adminUserUpdateBodySchema = z.object({
  id: z.preprocess((value) => normalizeUuid(value), z.string().uuid()),
  email: optionalEmailSchema.optional(),
  displayName: adminDisplayNameSchema.optional(),
  password: newPasswordInputSchema.optional(),
  role: adminRoleSchema.optional(),
  isActive: z.boolean().optional()
}).passthrough();

const adminUserDeleteBodySchema = z.object({
  id: z.preprocess((value) => normalizeUuid(value), z.string().uuid())
}).passthrough();

module.exports = {
  googleCredentialSchema,
  loginBodySchema,
  passwordResetBodySchema,
  passwordResetConfirmBodySchema,
  emailBodySchema,
  assistantGoogleVerifyBodySchema,
  assistantSearchBodySchema,
  customReplyBodySchema,
  customReplyDeleteBodySchema,
  adminUserCreateBodySchema,
  adminUserUpdateBodySchema,
  adminUserDeleteBodySchema
};
