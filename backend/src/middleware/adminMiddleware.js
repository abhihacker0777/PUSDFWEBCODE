function createAdminMiddleware({
  jwt,
  secret,
  adminSessionId,
  cookieOptions,
  getEnvAdminUser,
  findAdminAuthUser,
  toPublicAdminUser,
  hasAdminPermission
}) {
  function verifyAdminToken(token) {
    const decoded = jwt.verify(token, secret);
    if (decoded.sessionId !== adminSessionId) {
      throw new Error("STALE_ADMIN_SESSION");
    }
    return decoded;
  }

  async function resolveAdminFromToken(decoded = {}) {
    if (decoded.owner) return toPublicAdminUser(getEnvAdminUser());

    const identifier = decoded.loginIdentifier || decoded.email || decoded.user || "";
    const dbUser = await findAdminAuthUser(identifier);
    if (!dbUser) return null;

    const publicUser = toPublicAdminUser(dbUser);
    return publicUser.isActive ? publicUser : null;
  }

  async function verifyToken(req, res, next) {
    const token = req.cookies.admin_token;
    if (!token) return res.status(401).send("No token provided");

    try {
      const decoded = verifyAdminToken(token);
      req.user = decoded;
      req.admin = await resolveAdminFromToken(decoded);
      if (!req.admin) {
        throw new Error("ADMIN_SESSION_USER_DISABLED");
      }
      next();
    } catch {
      res.clearCookie("admin_token", cookieOptions);
      return res.status(403).send("Invalid token");
    }
  }

  function requirePermission(permission) {
    return (req, res, next) => {
      if (hasAdminPermission(req.admin, permission)) return next();
      return res.status(403).json({ success: false, message: "Forbidden" });
    };
  }

  function requireOwnerAdmin(req, res, next) {
    if (toPublicAdminUser(req.admin).isOwner) return next();
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  return {
    verifyToken,
    requirePermission,
    requireOwnerAdmin
  };
}

module.exports = { createAdminMiddleware };
