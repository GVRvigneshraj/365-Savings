const fs = require("node:fs");
const path = require("node:path");

const outDir = path.join(__dirname, "..", "dist", "365-savings", "browser");
const indexFile = path.join(outDir, "index.html");
const notFoundFile = path.join(outDir, "404.html");

if (!fs.existsSync(indexFile)) {
  console.error("postbuild: dist index.html not found at", indexFile);
  process.exit(1);
}

fs.copyFileSync(indexFile, notFoundFile);
console.log("postbuild: wrote SPA fallback 404.html");
