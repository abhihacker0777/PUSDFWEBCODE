const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const path = require("node:path");
const { BACKEND_ROOT, FRONTEND_URL } = require("../config/env");

function configureAppMiddleware(app) {
  app.set("trust proxy", Number(process.env.TRUST_PROXY || 1));

  app.use(cors({
    origin: FRONTEND_URL,
    credentials: true
  }));

  app.use(helmet());
  app.use(helmet.contentSecurityPolicy({
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "script-src": ["'self'"],
      "img-src": ["'self'", "data:", "https://*.googleusercontent.com", "https://*.gstatic.com", "https://*.google.com"]
    }
  }));

  app.use(express.json({ limit: "25kb" }));
  app.use(cookieParser());
  app.use(express.static(path.join(BACKEND_ROOT, "public")));
}

module.exports = { configureAppMiddleware };
