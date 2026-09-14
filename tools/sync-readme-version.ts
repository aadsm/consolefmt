/**
 * Points the README's CDN URLs at the current version.
 *
 * Run by the `version` npm script, which fires after the bump and before the
 * commit, so the rewritten README lands in the version commit.
 *
 * From 1.0.0 on the URL names a major range, `@2`, which keeps serving fixes
 * and additions without ever breaking a page that copied it. Below 1.0.0 a
 * minor is free to break, so the URL pins one exact version.
 */

import { readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const { version } = JSON.parse(await readFile(new URL("package.json", root), "utf8"));
const major = Number(version.split(".")[0]);
const tag = major >= 1 ? String(major) : version;

const readme = new URL("README.md", root);
const source = await readFile(readme, "utf8");
const rewritten = source.replaceAll(
  /(cdn\.jsdelivr\.net\/npm\/consolefmt@)[^/]+\//g,
  `$1${tag}/`,
);

if (rewritten === source) {
  console.log(`README CDN URLs already at @${tag}`);
} else {
  await writeFile(readme, rewritten);
  console.log(`README CDN URLs set to @${tag}`);
}
