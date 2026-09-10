import { spawn } from "node:child_process";
import { globSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";

const outputDirectory = path.resolve("_site");
const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".html", "text/html; charset=utf-8"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".woff2", "font/woff2"],
]);

const server = createServer(async (request, response) => {
  try {
    let relativePath = decodeURIComponent(new URL(request.url, "http://localhost").pathname).slice(1);
    if (!relativePath || relativePath.endsWith("/")) relativePath += "index.html";
    const filePath = path.resolve(outputDirectory, relativePath);
    if (!filePath.startsWith(`${outputDirectory}${path.sep}`)) throw new Error("Invalid path");

    response.setHeader(
      "content-type",
      contentTypes.get(path.extname(filePath)) || "application/octet-stream",
    );
    response.end(await readFile(filePath));
  } catch {
    response.statusCode = 404;
    response.end("Not found");
  }
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const { port } = server.address();
const urls = globSync("**/*.html", { cwd: outputDirectory })
  .sort()
  .map((file) => `http://127.0.0.1:${port}/${file.replace(/index\.html$/, "")}`);

const cli = path.resolve("node_modules/pa11y-ci/bin/pa11y-ci.js");
const child = spawn(process.execPath, [cli, "--config", ".pa11yci", ...urls], {
  stdio: "inherit",
});
const exitCode = await new Promise((resolve) => child.once("exit", resolve));
await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
process.exitCode = exitCode ?? 1;
