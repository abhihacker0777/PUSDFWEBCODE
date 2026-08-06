// A 403 means "logged in, but not permitted to do this one thing" - it must
// never be treated the same as 401 ("not logged in at all"). Conflating the
// two was the exact cause of a real bug: a low-privilege admin role got a
// 403 on a permission-gated fetch and was wrongly logged out of a session
// that was still perfectly valid.
export const isAdminSessionExpired = (response) => response.status === 401;
