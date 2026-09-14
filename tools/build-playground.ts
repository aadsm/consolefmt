/**
 * Assembles the playground into `_site/`: the page, the built library beside
 * it, and the gallery's examples as a module the page can run.
 *
 *     node tools/build-playground.ts           # build
 *     node tools/build-playground.ts --serve   # build, then serve it
 *
 * The library is the local build rather than a CDN copy, so the page runs
 * whatever is in `src/` right now.
 */

import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { basename, dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { highlight } from "./highlight.ts";
import { scenesFrom } from "./markdown-scenes.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const site = join(root, "_site");

await rm(site, { recursive: true, force: true });
await mkdir(site, { recursive: true });

for (const file of ["dist/consolepro.esm.js", "dist/consolepro.esm.js.map"]) {
  await copyFile(join(root, file), join(site, basename(file))).catch(() => {
    throw new Error("consolepro: run `npm run build` first, the page serves the built library.");
  });
}

await copyFile(join(root, "playground/index.html"), join(site, "index.html"));


/**
 * The gallery, as the page wants it: a name, a label, the body to run, and the
 * shot of it that already exists, so a visitor sees each example before
 * running it.
 */
const examples = Object.entries(await scenesFrom("docs/gallery.md")).map(([name, { code }]) => ({
  name,
  label: name.replaceAll("-", " ").replace(/^./, (letter) => letter.toUpperCase()),
  code,
  html: highlight(code.trim()),
}));

await mkdir(join(site, "examples"), { recursive: true });
for (const { name } of examples) {
  await copyFile(
    join(root, `docs/images/gallery/${name}.png`),
    join(site, `examples/${name}.png`),
  );
}

await writeFile(
  join(site, "examples.js"),
  `export const examples = ${JSON.stringify(examples, null, 2)};\n`,
);

process.stdout.write(`${site} (${examples.length} examples)\n`);

if (process.argv.includes("--serve")) await serve();

/** Enough of a static server to look at the page before it is deployed. */
async function serve(port = 8080): Promise<void> {
  const types: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".map": "application/json; charset=utf-8",
  };

  const server = createServer(async (request, response) => {
    const path = new URL(request.url ?? "/", "http://localhost").pathname;
    if (path.includes("..")) {
      response.writeHead(403).end();
      return;
    }

    try {
      const file = join(site, path === "/" ? "index.html" : path);
      const body = await readFile(file);
      response.writeHead(200, { "content-type": types[extname(file)] ?? "text/plain" });
      response.end(body);
    } catch {
      response.writeHead(404).end();
    }
  });

  await new Promise<void>((resolve) => server.listen(port, resolve));
  process.stdout.write(`http://localhost:${port}\n`);
}
