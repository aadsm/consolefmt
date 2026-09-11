/**
 * A grid, for the spans the Custom Formatters API won't give you.
 *
 * The renderer applies the `style` attribute and nothing else, so `colspan` on
 * a `td` is dropped on the floor — but `grid-column: span 2` is just CSS, and
 * survives. So a table that needs merged cells is built from divs and CSS grid
 * rather than from `table`/`tr`/`td`.
 *
 * `grid`, `row` and `cell` are a set: `row` is what gives `grid` somewhere to
 * count columns from, and `cell` is what turns `colspan` into the property
 * that does the work.
 */

import { asTag, div } from "./tags.ts";
import type { Tag } from "./tags.ts";
import { Element, readArguments } from "./elements.ts";
import type { Child, PresentChild } from "./elements.ts";

/**
 * A row. It generates no box of its own — `display: contents` lifts its cells
 * into the surrounding grid — so it groups cells in the source without taking
 * part in the layout.
 *
 * Two things follow. Styling a row does nothing: an element with no box has
 * nothing to paint, so a background belongs on the cells. And a row that
 * overrides `display` stops being one, both to the layout and to the column
 * count below.
 */
export const row = div.extend({ display: "contents" });

/**
 * A cell. `colspan` and `rowspan` are consolepro's own attributes rather than
 * CSS, named after the table equivalents they stand in for, and become the
 * grid properties that do the same job.
 */
export const cell: Tag = asTag((...args) => {
  const [attributes, children] = readArguments(args);
  const { colspan, rowspan, ...style } = attributes;

  return div(
    {
      ...(colspan === undefined ? {} : { gridColumn: `span ${colspan}` }),
      ...(rowspan === undefined ? {} : { gridRow: `span ${rowspan}` }),
      ...style,
    },
    ...children,
  );
});

export interface Grid extends Tag {
  row: Tag;
  cell: Tag;
}

/**
 * A grid. `inline-grid` so it stays as wide as its contents instead of
 * stretching across the console.
 *
 * The column count is worked out from the first row, so it doesn't have to be
 * written down and kept in step with the cells. Pass `gridTemplateColumns` to
 * say it yourself — for named or sized tracks — and the counting is skipped.
 */
export const grid: Grid = Object.assign(
  asTag((...args) => {
    const [attributes, children] = readArguments(args);
    const counted =
      attributes["gridTemplateColumns"] === undefined
        ? { gridTemplateColumns: `repeat(${columnsIn(children)}, auto)` }
        : {};

    return div({ display: "inline-grid", ...counted, ...attributes }, ...children);
  }),
  { row, cell },
);

/**
 * The column count: the widths of the first row's cells added up.
 *
 * Only the first row is read. A cell sitting under a `rowspan` is absent from
 * the rows below by design, so telling that apart from a miscount would mean
 * reimplementing grid's own placement — and a miscount is loud anyway, since
 * every cell after it shifts along.
 */
function columnsIn(children: readonly Child[]): number {
  const first = children.find(isRow);

  if (first === undefined) {
    throw new Error(
      "consolepro: grid counts its columns from the first row, so it needs a " +
        "row — or pass gridTemplateColumns and it won't count.",
    );
  }

  return first.children.reduce<number>((total, child) => total + widthOf(child), 0);
}

function isRow(child: Child): child is Element {
  return child instanceof Element && child.attributes["display"] === "contents";
}

/** A cell is one column wide unless its `grid-column` says it spans more. */
function widthOf(child: PresentChild): number {
  if (!(child instanceof Element)) return 1;

  const span = /^\s*span\s+(\d+)/.exec(String(child.attributes["gridColumn"] ?? ""));
  return span?.[1] === undefined ? 1 : Number(span[1]);
}
