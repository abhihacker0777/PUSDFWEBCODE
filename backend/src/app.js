const express = require("express");
const { configureAppMiddleware } = require("./bootstrap/appMiddleware");
const { createAppDependencies } = require("./bootstrap/appDependencies");
const { registerRoutes } = require("./routes/registerRoutes");

function createApp() {
  const app = express();
  configureAppMiddleware(app);
  registerRoutes(app, createAppDependencies());
  return app;
}

const app = createApp();

function startServer(port = process.env.PORT || 3000) {
  const server = app.listen(port, () => console.log(`Server Started On Port ${port}`));
  server.timeout = 300000;
  return server;
}

module.exports = { app, createApp, startServer };

if (require.main === module) {
  startServer();
}
