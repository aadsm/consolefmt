/**
 * Regenerates the console screenshots.
 *
 *     node tools/screenshots.ts            # docs/images/
 *     node tools/screenshots.ts --dark     # docs/images/dark/
 *     node tools/screenshots.ts --gallery  # docs/images/gallery/, from docs/gallery.md
 *
 * Each snippet is run in a page that has consolepro loaded, and what the
 * console printed for it is written out as a cropped PNG.
 */

import { createServer } from "node:http";
import { mkdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { AddressInfo } from "node:net";
import ts from "typescript";
import { openDevtoolsConsole } from "./devtools-console.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

interface Snippet {
  /** Run in the page. */
  code?: string;
  /** Then typed at the console prompt, so the shot shows the exchange. */
  prompt?: string;
  /** Framed with the panel around it, rather than cropped to the message. */
  panel?: boolean;
}

/** The snippets. Each one is a console message the README points at. */
const snippets: Record<string, Snippet> = {
  // An expression, not a console.log: the console prints the value with no
  // `undefined` after it, which is what makes this one worth the prompt.
  hello: {
    panel: true,
    // A line typed at the prompt can't import, so the shot needs the tags
    // already in scope, as they'd be on a page that had imported them.
    code: `Object.assign(window, consolepro);`,
    prompt: `span({ color: "crimson", fontWeight: "bold" }, "hello")`,
  },

  badges: { code: `
    const { span } = consolepro;

    const badge = (text, color) => span({
      color: "white", background: color, fontWeight: "bold",
      padding: "1px 7px", borderRadius: "10px", fontSize: "11px",
    }, text);

    console.log(span(badge("READY", "#27ae60"), " server listening on :3000"));
    console.log(span(badge("SLOW", "#e67e22"), " GET /api/orders took 2.4s"));
  ` },

  grid: { code: `
    const { grid } = consolepro;

    const { row, cell } = grid;
    const box = cell.extend({ padding: "3px 10px", background: "white" });
    const head = box.extend({ fontWeight: "bold", background: "#f4f4f4" });
    const heat = (n) => box({ textAlign: "right",
      background: "rgb(220," + (255 - n * 2) + "," + (255 - n * 2) + ")" }, n + "ms");

    console.log(
      grid({ gap: "1px", background: "#ddd", border: "1px solid #ddd" },
        row(head("endpoint"), head("p50"), head("p95"), head("p99")),
        row(box("/api/users"), heat(12), heat(48), heat(91)),
        row(box("/api/orders"), heat(20), heat(33), heat(70)),
        row(box({ colspan: 3, fontWeight: "bold", textAlign: "right" }, "worst"), heat(91)),
      ),
    );
  ` },

  card: { code: `
    const { div, span } = consolepro;

    const order = { id: 8812, total: 42.5, items: ["hat", "scarf"] };

    console.log(
      // A hard-coded background needs a hard-coded colour with it: text
      // inherits the console's, which flips with the devtools theme.
      div({ padding: "6px 10px", borderLeft: "3px solid #c0392b",
            background: "#fdf6f6", color: "#5a2f2f" },
        div({ fontWeight: "bold" }, "payment declined"),
        div(span({ color: "#8a8a8a" }, "order "), order),
      ),
    );
  ` },
};

/**
 * The gallery's snippets live in its own markdown, one per `##` heading, so
 * the page a reader sees is the same text that gets run. Keyed by the slug
 * the heading makes, which is also the name its image is written under.
 */
async function galleryBlocks(): Promise<Record<string, string>> {
  const markdown = await readFile(join(root, "docs/gallery.md"), "utf8");
  const blocks: Record<string, string> = {};

  for (const [, title, code] of markdown.matchAll(
    /^## (.+)$[\s\S]*?```js\n([\s\S]*?)```/gm,
  )) {
    blocks[title!.toLowerCase().replaceAll(" ", "-")] = code ?? "";
  }
  return blocks;
}

async function galleryScenes(): Promise<Record<string, Snippet>> {
  return Object.fromEntries(
    Object.entries(await galleryBlocks())
      .map(([slug, code]) => [slug, { code, panel: true }]),
  );
}

/**
 * The README's hero, named by the gallery slugs it's made of rather than
 * written out again, so the two can't drift apart.
 */
const HERO = ["flame-graph", "event-loop-trace", "compositing-layers", "railroad-diagram"];

async function heroScene(): Promise<Snippet> {
  const blocks = await galleryBlocks();

  // Each example gets its own scope: they all declare a `label`, and several
  // share names for their helpers.
  const code = HERO.map((slug) => {
    const block = blocks[slug];
    if (block === undefined) {
      throw new Error(`consolepro: the gallery has no "${slug}" for the hero.`);
    }
    return `(() => {\n${block}\n})();`;
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
    ? await galleryScenes()
    : { ...(dark ? {} : { hero: await heroScene() }), ...snippets };
  const server = await serveSource();
  const console_ = await openDevtoolsConsole({
    url: server.url,
    theme: dark ? "dark" : "light",
  });

  try {
    for (const [name, { code = "", prompt, panel = false }] of Object.entries(scenes)) {
      const path = join(outputDir, `${name}.png`);
      await console_.capture(code, path, { ...(prompt === undefined ? {} : { prompt }), panel });
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
      consolepro.install();
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
