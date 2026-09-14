/**
 * The examples a markdown file describes, read out of the file that shows
 * them. `tools/screenshots.ts` shoots them; the playground runs them.
 */

import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

export interface Scene {
  /** Run in the page. */
  code: string;
  /** Framed with the panel around it, rather than cropped to the message. */
  panel: boolean;
}

/** A block of its own, so a scene's declarations can't reach the next one. */
export function block(code: string): string {
  return `{\n${code}\n}`;
}

/**
 * The scenes a markdown file describes. A `##` section holding both a code
 * block and an image is one: the code is the section's first block, and the
 * image names the shot. A section with no image is prose, and a block after
 * the image is commentary rather than an example.
 *
 * The markdown is the source, not a transcription: to change an example, edit
 * its code block and re-run. Each block runs on its own, so it has to take the
 * names it uses from `consolepro` rather than from the block before it.
 *
 * `?framed` on the image path asks for the panel around the shot. It is the
 * image that is framed, so the document it appears in is what says so.
 */
export async function scenesFrom(file: string): Promise<Record<string, Scene>> {
  const markdown = await readFile(join(root, file), "utf8");
  const scenes: Record<string, Scene> = {};

  for (const section of markdown.split(/^## /m).slice(1)) {
    const code = /```js\n([\s\S]*?)^```/m.exec(section)?.[1];
    const image = /!\[[^\]]*\]\([^)]*\/([\w-]+)\.png(\?framed)?\)/.exec(section);
    const name = image?.[1];
    if (code !== undefined && name !== undefined) {
      scenes[name] = { code, panel: image?.[2] !== undefined };
    }
  }
  return scenes;
}

