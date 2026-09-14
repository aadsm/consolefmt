/**
 * The release commit's message: the version, and every commit since the last
 * release.
 *
 *     node tools/changelog.ts <from-tag> <version> <keyword>
 *
 * Run after `npm version` has made its commit, so `HEAD~1` is the last real
 * change and the version commit itself stays out of its own list.
 */

import { execFileSync } from "node:child_process";

const [from = "", version = "", keyword = ""] = process.argv.slice(2);

if (version === "") {
  throw new Error("consolepro: changelog needs a version.");
}

const git = (...args: string[]): string =>
  execFileSync("git", args, { encoding: "utf8" }).trimEnd();

// `[%h](%h)` is how the sibling repos write it: the short hash, linked.
const changes = git(
  "log",
  from === "" ? "HEAD~1" : `${from}..HEAD~1`,
  "--no-merges",
  "--format=- [%h](%h) %s",
);

process.stdout.write(
  `Version ${version} (${keyword} update)\n\n`
    + (from === "" ? "Changes:\n" : `Changes since ${from}:\n`)
    + `${changes}\n`,
);
