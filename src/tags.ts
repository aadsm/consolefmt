/**
 * The tags the Custom Formatters API renders, as functions. Every other
 * element is composed from these.
 */

import { element } from "./elements.ts";
import type { Child, Element } from "./elements.ts";

export type Tag = (...args: readonly Child[]) => Element;

export const div: Tag = (...args) => element("div", ...args);
export const span: Tag = (...args) => element("span", ...args);
export const ol: Tag = (...args) => element("ol", ...args);
export const li: Tag = (...args) => element("li", ...args);
export const table: Tag = (...args) => element("table", ...args);
export const tr: Tag = (...args) => element("tr", ...args);
export const td: Tag = (...args) => element("td", ...args);
