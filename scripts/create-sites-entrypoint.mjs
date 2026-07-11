import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const distDir = path.resolve("dist");
const assetsDir = path.join(distDir, "assets");
const indexPath = path.join(distDir, "index.html");
const entrypointPath = path.join(distDir, "index.js");

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

async function readAssetMap() {
  const entries = await readdir(assetsDir, { withFileTypes: true }).catch(() => []);
  const assets = {};

  for (const entry of entries) {
    if (!entry.isFile()) {
      continue;
    }

    const filePath = path.join(assetsDir, entry.name);
    const route = `/assets/${entry.name}`;
    const ext = path.extname(entry.name).toLowerCase();
    assets[route] = {
      body: await readFile(filePath, "utf8"),
      contentType: mimeTypes[ext] ?? "application/octet-stream",
    };
  }

  return assets;
}

const indexHtml = await readFile(indexPath, "utf8");
const assets = await readAssetMap();

const entrypoint = `const indexHtml = ${JSON.stringify(indexHtml)};
const assets = ${JSON.stringify(assets)};

const cacheHeaders = {
  "cache-control": "public, max-age=31536000, immutable",
};

function response(body, contentType, headers = {}) {
  return new Response(body, {
    headers: {
      "content-type": contentType,
      ...headers,
    },
  });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const asset = assets[url.pathname];

    if (asset) {
      return response(asset.body, asset.contentType, cacheHeaders);
    }

    return response(indexHtml, "text/html; charset=utf-8", {
      "cache-control": "no-store",
    });
  },
};
`;

await mkdir(distDir, { recursive: true });
await writeFile(entrypointPath, entrypoint, "utf8");
