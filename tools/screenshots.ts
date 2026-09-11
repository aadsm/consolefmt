/**
 * Regenerates the console screenshots.
 *
 *     node tools/screenshots.ts            # docs/images/
 *     node tools/screenshots.ts --dark     # docs/images/dark/
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
    prompt: `span({ color: "crimson", fontWeight: "bold" }, "hello")`,
  },

  badges: { code: `
    const badge = (text, color) => span({
      color: "white", background: color, fontWeight: "bold",
      padding: "1px 7px", borderRadius: "10px", fontSize: "11px",
    }, text);

    console.log(span(badge("READY", "#27ae60"), " server listening on :3000"));
    console.log(span(badge("SLOW", "#e67e22"), " GET /api/orders took 2.4s"));
    console.log(span(badge("FAIL", "#c0392b"), " payment declined for order #8812"));
  ` },

  grid: { code: `
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
    const badge = (text, color) => span({
      color: "white", background: color, fontWeight: "bold",
      padding: "1px 7px", borderRadius: "10px", fontSize: "11px",
    }, text);

    const order = { id: 8812, total: 42.5, items: ["hat", "scarf"] };

    console.log(
      // A hard-coded background needs a hard-coded colour with it: text
      // inherits the console's, which flips with the devtools theme.
      div({ border: "1px solid #e0b4b4", borderLeft: "4px solid #c0392b",
            borderRadius: "4px", padding: "8px 12px",
            background: "#fdf6f6", color: "#5a2f2f" },
        div({ marginBottom: "4px" },
          badge("FAIL", "#c0392b"),
          span({ fontWeight: "bold" }, " payment declined"),
        ),
        div({ color: "#7f4a4a" }, "card expired — retrying in 30s"),
        div({ marginTop: "4px" }, span({ color: "#999" }, "order "), order),
      ),
    );
  ` },
};

async function main(): Promise<void> {
  const dark = process.argv.includes("--dark");
  const outputDir = join(root, "docs/images", dark ? "dark" : "");
  await mkdir(outputDir, { recursive: true });

  const scenes = snippets;
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
      import * as tags from "/src/tags.ts";
      import { element } from "/src/elements.ts";
      import { grid } from "/src/grid.ts";
      import { install } from "/src/formatter.ts";

      install();
      Object.assign(window, tags, { element, grid });
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
