/**
 * The package entry point.
 *
 * `grid` carries its own `row` and `cell`, so they aren't exported here —
 * `cell` next to `td` and `row` next to `tr` would be a guessing game. Reach
 * them through `grid.cell`, or unpack them where you use them:
 * `const { row, cell } = grid`.
 */

export * from "./tags.ts";
export { element, Element } from "./elements.ts";
export { grid } from "./grid.ts";
export { install } from "./formatter.ts";

export type { Attributes, Child, NativeTagName, Style } from "./elements.ts";
export type { Tag } from "./tags.ts";
export type { Grid } from "./grid.ts";
