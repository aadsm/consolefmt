/**
 * The Custom Formatter itself: turns an `Element` into the JsonML the devtools
 * console renders, and registers it on the page.
 *
 * JsonML is `[tagName, { style }, ...children]`. A child is another element, a
 * string, or an object reference — `["object", { object }]` — which is what
 * keeps a logged object live and expandable instead of stringified.
 */

import { Element } from "./elements.ts";
import type { Attributes, PresentChild, Style } from "./elements.ts";

/** An object reference. Not JSON: devtools substitutes an object id for it. */
type ObjectReference = ["object", { object: object }];

type JsonMLChild = JsonML | ObjectReference | string;

export type JsonML = [string, { style: string }, ...JsonMLChild[]];

/** `[element, config?]` — devtools calls these with the object it's printing. */
export const formatter = {
  header(value: unknown): JsonML | null {
    return value instanceof Element ? toJsonML(value) : null;
  },

  /** Nothing expands yet — the whole message is the header. */
  hasBody(): boolean {
    return false;
  },
};

/** Registers the formatter. Later formatters get a turn only if ours returns null. */
export function install(): void {
  const page = globalThis as { devtoolsFormatters?: unknown[] };
  page.devtoolsFormatters = [formatter, ...(page.devtoolsFormatters ?? [])];
}

export function toJsonML(element: Element): JsonML {
  return [
    element.name,
    { style: cssText(element.attributes) },
    ...element.children.map(toJsonMLChild),
  ];
}

function toJsonMLChild(child: PresentChild): JsonMLChild {
  if (child instanceof Element) return toJsonML(child);
  if (typeof child === "object") return ["object", { object: child }];
  return String(child);
}

/**
 * Attributes are CSS properties written flat, plus a reserved `style` that
 * takes either a CSS string or an object. `style` is serialised last, so it
 * wins the cascade against the flat properties.
 */
function cssText(attributes: Attributes): string {
  const { style, ...properties } = attributes;
  const declarations = [...declarationsOf(properties as Style)];

  if (typeof style === "string") {
    declarations.push(style.trim().replace(/;$/, ""));
  } else if (style !== undefined) {
    declarations.push(...declarationsOf(style));
  }

  return declarations.join("; ");
}

function* declarationsOf(style: Style): Generator<string> {
  for (const [name, value] of Object.entries(style)) {
    if (value !== undefined && value !== null) {
      yield `${hyphenate(name)}: ${value}`;
    }
  }
}

/** `fontWeight` is the way it's written here; `font-weight` is what CSS wants. */
function hyphenate(name: string): string {
  return name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}
