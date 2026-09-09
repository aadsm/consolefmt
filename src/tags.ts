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

/**
 * Elements the formatters API doesn't render, composed from the ones it does.
 * Default styles come from docs/html-rendering.md, written with physical
 * properties so they survive a renderer that drops what it doesn't know.
 */

// The spec says `bolder`, which compounds when nested. `bold` is predictable.
export const strong = span.extend({ fontWeight: "bold" });
export const b = strong;

export const em = span.extend({ fontStyle: "italic" });
export const i = em;

export const code = span.extend({ fontFamily: "monospace" });
export const kbd = code;
export const samp = code;

export const small = span.extend({ fontSize: "smaller" });
export const mark = span.extend({ backgroundColor: "yellow", color: "black" });

export const ins = span.extend({ textDecoration: "underline" });
export const u = ins;

export const del = span.extend({ textDecoration: "line-through" });
export const s = del;

export const sub = span.extend({
  verticalAlign: "sub",
  fontSize: "smaller",
  lineHeight: "normal",
});
export const sup = span.extend({
  verticalAlign: "super",
  fontSize: "smaller",
  lineHeight: "normal",
});

export const h1 = div.extend({
  fontSize: "2em",
  fontWeight: "bold",
  marginTop: "0.67em",
  marginBottom: "0.67em",
});
export const h2 = div.extend({
  fontSize: "1.5em",
  fontWeight: "bold",
  marginTop: "0.83em",
  marginBottom: "0.83em",
});
export const h3 = div.extend({
  fontSize: "1.17em",
  fontWeight: "bold",
  marginTop: "1em",
  marginBottom: "1em",
});
export const h4 = div.extend({
  fontSize: "1em",
  fontWeight: "bold",
  marginTop: "1.33em",
  marginBottom: "1.33em",
});
export const h5 = div.extend({
  fontSize: "0.83em",
  fontWeight: "bold",
  marginTop: "1.67em",
  marginBottom: "1.67em",
});
export const h6 = div.extend({
  fontSize: "0.67em",
  fontWeight: "bold",
  marginTop: "2.33em",
  marginBottom: "2.33em",
});

export const p = div.extend({ marginTop: "1em", marginBottom: "1em" });

export const pre = div.extend({
  fontFamily: "monospace",
  whiteSpace: "pre",
  marginTop: "1em",
  marginBottom: "1em",
});

export const blockquote = div.extend({
  marginTop: "1em",
  marginBottom: "1em",
  marginLeft: "40px",
  marginRight: "40px",
});

export const ul = ol.extend({ listStyleType: "disc" });

export const th = td.extend({ fontWeight: "bold" });
