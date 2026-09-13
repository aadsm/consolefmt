/**
 * Builds the distributable: two bundles of the same source, their sourcemaps,
 * and the type declarations.
 *
 * `consolepro.esm.js` is the module, for anything that imports. `consolepro.js`
 * is a classic script defining a `consolepro` global, for the contexts that
 * aren't module contexts: a plain `<script src>`, a paste into the devtools
 * console, a devtools snippet.
 *
 * The sourcemaps embed the TypeScript, so `dist/` is self-contained and
 * devtools shows `src/` frames without the sources being published.
 */

import { readFile, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { build, type BuildOptions } from "esbuild";

const root = new URL("../", import.meta.url);
const pkg = JSON.parse(await readFile(new URL("package.json", root), "utf8"));

// A build owns the directory, so a rename can't leave a stale file behind.
await rm(new URL("dist/", root), { recursive: true, force: true });

const common: BuildOptions = {
  absWorkingDir: root.pathname,
  entryPoints: ["src/index.ts"],
  bundle: true,
  target: "es2022",
  minify: true,
  sourcemap: true,
  // Survives minification, so the licence and version stay visible on a CDN.
  banner: { js: `/*! consolepro v${pkg.version} | MIT | github.com/aadsm/consolepro */` },
};

await build({ ...common, format: "esm", outfile: "dist/consolepro.esm.js" });
await build({
  ...common,
  format: "iife",
  globalName: "consolepro",
  outfile: "dist/consolepro.js",
});

execFileSync("npx", ["tsc", "-p", "tsconfig.build.json"], {
  cwd: root.pathname,
  stdio: "inherit",
});
