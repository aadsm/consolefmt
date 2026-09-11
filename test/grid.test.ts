import { test } from "node:test";
import assert from "node:assert/strict";

import { cell, grid, row } from "../src/grid.ts";

test("colspan and rowspan become the grid properties that do the same job", () => {
  assert.deepEqual(cell({ colspan: 2 }, "wide").attributes, { gridColumn: "span 2" });
  assert.deepEqual(cell({ rowspan: 3 }, "tall").attributes, { gridRow: "span 3" });
  assert.deepEqual(cell({ colspan: 2, rowspan: 3 }).attributes, {
    gridColumn: "span 2",
    gridRow: "span 3",
  });
});

test("every other attribute is CSS, as usual", () => {
  assert.deepEqual(cell({ colspan: 2, color: "red" }, "x").attributes, {
    gridColumn: "span 2",
    color: "red",
  });
  assert.deepEqual(cell({ color: "red" }).attributes, { color: "red" });
});

test("a cell can be extended like any tag", () => {
  const header = cell.extend({ fontWeight: "bold" });

  assert.deepEqual(header({ colspan: 2 }, "h").attributes, {
    fontWeight: "bold",
    gridColumn: "span 2",
  });
});

test("a grid counts its columns from the first row", () => {
  const it = grid(row(cell("a"), cell("b"), cell("c")), row(cell("d")));

  assert.equal(it.attributes["gridTemplateColumns"], "repeat(3, auto)");
});

test("counting adds up the spans rather than the cells", () => {
  const it = grid(row(cell({ colspan: 2 }, "wide"), cell("c")));

  assert.equal(it.attributes["gridTemplateColumns"], "repeat(3, auto)");
});

test("a rowspan is one column wide, like any other cell", () => {
  const it = grid(row(cell({ rowspan: 2 }, "tall"), cell("b"), cell("c")));

  assert.equal(it.attributes["gridTemplateColumns"], "repeat(3, auto)");
});

test("only the first row is counted", () => {
  // The second row is one short, as it would be under a rowspan.
  const it = grid(row(cell("a"), cell("b")), row(cell("c")));

  assert.equal(it.attributes["gridTemplateColumns"], "repeat(2, auto)");
});

test("saying the columns yourself skips the counting", () => {
  const it = grid({ gridTemplateColumns: "200px auto" }, cell("a"), cell("b"));

  assert.equal(it.attributes["gridTemplateColumns"], "200px auto");
});

test("attributes win over the defaults", () => {
  const it = grid({ display: "grid", gap: "1px" }, row(cell("a")));

  assert.equal(it.attributes["display"], "grid");
  assert.equal(it.attributes["gap"], "1px");
});

test("a grid with no row says so, and says what to do instead", () => {
  assert.throws(() => grid(cell("a"), cell("b")), (error: Error) => {
    assert.match(error.message, /first row/);
    assert.match(error.message, /gridTemplateColumns/);
    return true;
  });
});
