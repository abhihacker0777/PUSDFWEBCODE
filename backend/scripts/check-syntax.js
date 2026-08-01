const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const backendRoot = path.resolve(__dirname, "..");
const targets = [
  path.join(backendRoot, "server.js"),
  path.join(backendRoot, "src")
];

function collectJsFiles(target) {
  const stat = fs.statSync(target);
  if (stat.isFile()) return target.endsWith(".js") ? [target] : [];

  return fs.readdirSync(target, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(target, entry.name);
    return entry.isDirectory() ? collectJsFiles(fullPath) : collectJsFiles(fullPath);
  });
}

const files = targets.flatMap(collectJsFiles);
for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], { stdio: "inherit" });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

console.log(`Checked ${files.length} backend JavaScript files.`);
