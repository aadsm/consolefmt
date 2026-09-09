/**
 * The tags the Custom Formatters API renders, as functions, and the way to
 * build new ones from them. Every other element is composed this way.
 */

import { element, readArguments } from "./elements.ts";
import type { Attributes, Child, Element } from "./elements.ts";

export interface Tag {
  (...args: readonly Child[]): Element;
  /** `div.extend({ … })` — sugar for `extend(div, { … })`. */
  extend(defaults: Attributes): Tag;
}

function asTag(call: (...args: readonly Child[]) => Element): Tag {
  const tag = call as Tag;
  tag.extend = (defaults) => extend(tag, defaults);
  return tag;
}

/** A tag that renders one of the native elements. */
function tag(name: string): Tag {
  return asTag((...args) => element(name, ...args));
}

/**
 * A new tag: `base` with `defaults` already applied. The caller's attributes
 * are spread last, so they win.
 */
export function extend(base: Tag, defaults: Attributes): Tag {
  return asTag((...args) => {
    const [attributes, children] = readArguments(args);
    return base({ ...defaults, ...attributes }, ...children);
  });
}

export const div = tag("div");
export const span = tag("span");
export const ol = tag("ol");
export const li = tag("li");
export const table = tag("table");
export const tr = tag("tr");
export const td = tag("td");
