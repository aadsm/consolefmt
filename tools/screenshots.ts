/**
 * Regenerates the console screenshots.
 *
 *     node tools/screenshots.ts            # docs/images/
 *     node tools/screenshots.ts --dark     # docs/images/dark/
 *     node tools/screenshots.ts --gallery  # docs/images/gallery/, from docs/gallery.md
 *
 * Every example comes from the markdown that shows it, so the code a reader
 * sees is the code that ran. Each one is run in a page that has consolepro
 * loaded, and what the console printed for it is written out as a PNG.
 */

import { createServer } from "node:http";
import { mkdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { AddressInfo } from "node:net";
import ts from "typescript";
import { openDevtoolsConsole } from "./devtools-console.ts";
import { block, scenesFrom, type Scene } from "./markdown-scenes.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * The README's hero, named by the gallery slugs it's made of rather than
 * written out again, so the two can't drift apart. Each example keeps its own
 * block: they all declare a `label`, and several share names for their helpers.
 */
const HERO = ["flame-graph", "event-loop-trace", "compositing-layers", "railroad-diagram"];

async function heroScene(): Promise<Scene> {
  const gallery = await scenesFrom("docs/gallery.md");

  const code = HERO.map((slug) => {
    const scene = gallery[slug];
    if (scene === undefined) {
      throw new Error(`consolepro: the gallery has no "${slug}" for the hero.`);
    }
    return block(scene.code);
  }).join("\n");

  return { code, panel: true };
}

async function main(): Promise<void> {
  const dark = process.argv.includes("--dark");
  const gallery = process.argv.includes("--gallery");
  const outputDir = join(root, "docs/images",
    gallery ? "gallery" : dark ? "dark" : "");
  await mkdir(outputDir, { recursive: true });

  // No dark hero: the gallery examples pick their own colours against a light
  // console, so on a dark one the layer legend goes dark on dark. It needs the
  // examples reworked, not the theme flipped.
  const scenes = gallery
    ? await scenesFrom("docs/gallery.md")
    : {
      ...(dark ? {} : { hero: await heroScene() }),
      ...(await scenesFrom("README.md")),
    };
  const server = await serveSource();
  const console_ = await openDevtoolsConsole({
    url: server.url,
    theme: dark ? "dark" : "light",
  });

  try {
    for (const [name, { code, panel }] of Object.entries(scenes)) {
      const path = join(outputDir, `${name}.png`);
      await console_.capture(block(code), path, { panel });
      process.stdout.write(`${path}\n`);
    }
  } finally {
    await console_.close();
    server.close();
  }
}

/**
 * A page with consolepro loaded, and `src/` served as the ES modules the
 * browser wants. There's no build step, so the TypeScript is transpiled on the
 * way out — the `.ts` import specifiers stay as written and resolve back here.
 */
async function serveSource(): Promise<{ url: string; close(): void }> {
  const page = `<!doctype html>
    <meta charset="utf-8">
    <title>consolepro</title>
    <script type="module">
      import * as consolepro from "/src/index.ts";
      window.consolepro = consolepro;
    </script>`;

  const server = createServer(async (request, response) => {
    const path = new URL(request.url ?? "/", "http://127.0.0.1").pathname;

    if (path === "/") {
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end(page);
      return;
    }

    if (path === "/favicon.ico") {
      response.writeHead(204).end();
      return;
    }

    if (/^\/src\/[\w-]+\.ts$/.test(path)) {
      const source = await readFile(join(root, path), "utf8");
      const { outputText } = ts.transpileModule(source, {
        compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
      });
      response.writeHead(200, { "content-type": "text/javascript; charset=utf-8" });
      response.end(outputText);
      return;
    }

    response.writeHead(404).end();
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;

  return { url: `http://127.0.0.1:${port}/`, close: () => server.close() };
}

await main();
