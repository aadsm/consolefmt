# consolepro

Rich, styled content in the Chrome and Edge devtools console.

![A devtools console showing four things consolepro drew: a flame graph of a 420ms
profile, an event loop trace with one task over the frame budget, five compositing
layers tilted in 3D, and a railroad diagram of a URL regex](docs/images/hero.png)

Every one of those is a `console.log`. There are more in the
[gallery](docs/gallery.md).

## Turn it on

consolepro renders through the [Custom Formatters][spec] API, which devtools
keeps behind a setting. Open devtools, then **Settings → Console → Enable custom
formatters**, and reload the page. Nothing renders until you do.

[spec]: docs/chrome-custom-formatters.md

```js
import { install } from "consolepro";

install();
```

## Elements are values

An element is a function call. The first argument is the attributes when it's a
plain object, and a child otherwise. Attributes are CSS properties, written
flat.

```js
span("hello")
span({ color: "red" }, "hello")
span({ height: "1px", background: "#ccc" })     // attributes only, no children
```

![A devtools console: span({ color: "crimson", fontWeight: "bold" }, "hello") typed
at the prompt, and the word hello printed back in bold crimson](docs/images/hello.png)

Every remaining argument is exactly one child, whatever its type. Arrays don't
flatten, so an array is logged as itself.

```js
span("a", 42, div("b"))        // strings, numbers, elements
span(...items)                 // spread a list into children
span(items)                    // the array itself
span(cond ? span("x") : null)  // null and undefined are dropped
```

Seven tags are real — `div`, `span`, `ol`, `li`, `table`, `tr`, `td` — because
those are the ones the formatters API renders. Everything else is composed from
them, `h1` and `strong` and `img` included.

## Elements compose

A new element is a function, so anything you'd factor out of your code you can
factor out of your logging.

```js
const badge = (text, color) => span({
  color: "white", background: color, fontWeight: "bold",
  padding: "1px 7px", borderRadius: "10px", fontSize: "11px",
}, text);

console.log(span(badge("READY", "#27ae60"), " server listening on :3000"));
console.log(span(badge("SLOW", "#e67e22"), " GET /api/orders took 2.4s"));
console.log(span(badge("FAIL", "#c0392b"), " payment declined for order #8812"));
```

![](docs/images/badges.png)

`extend` does the same for attributes, giving you a tag with defaults already
applied:

```js
const box = td.extend({ padding: "3px 10px" });
const head = box.extend({ fontWeight: "bold" });
```

## Objects stay live

An object logged inside a message stays inspectable — it's a reference to the
real thing, not a snapshot of its text, so you can open it in the console and
walk it. It arrives collapsed, as `▸ Object`.

```js
const order = { id: 8812, total: 42.5, items: ["hat", "scarf"] };

console.log(
  div({ border: "1px solid #e0b4b4", borderLeft: "4px solid #c0392b",
        borderRadius: "4px", padding: "8px 12px",
        background: "#fdf6f6", color: "#5a2f2f" },
    div({ marginBottom: "4px" },
      badge("FAIL", "#c0392b"),
      span({ fontWeight: "bold" }, " payment declined"),
    ),
    div({ color: "#7f4a4a" }, "card expired — retrying in 30s"),
    div({ marginTop: "4px" }, span({ color: "#999" }, "order "), order),
  ),
);
```

![](docs/images/card.png)

An object in the *first* argument is read as attributes, since that slot is
taken. Pass empty attributes to put one there: `span({}, order)`.

Set a colour whenever you set a background. Text inherits the console's, and
that flips with the devtools theme.

## Grids

`grid` lays cells out with CSS grid, which is how you get cells that span. The
column count comes from the first row, so it isn't written down twice.

```js
const { row, cell } = grid;
const box = cell.extend({ padding: "3px 10px", background: "white" });
const head = box.extend({ fontWeight: "bold", background: "#f4f4f4" });
const heat = (n) => box({ textAlign: "right",
  background: `rgb(220, ${255 - n * 2}, ${255 - n * 2})` }, n + "ms");

console.log(
  grid({ gap: "1px", background: "#ddd", border: "1px solid #ddd" },
    row(head("endpoint"), head("p50"), head("p95"), head("p99")),
    row(box("/api/users"), heat(12), heat(48), heat(91)),
    row(box("/api/orders"), heat(20), heat(33), heat(70)),
    row(box({ colspan: 3, fontWeight: "bold", textAlign: "right" }, "worst"), heat(91)),
  ),
);
```

![](docs/images/grid.png)

`colspan` and `rowspan` are named after the table attributes they stand in for,
and become `grid-column` and `grid-row`. A cell covered by a `rowspan` above is
left out of its row, the same as in HTML.

Each row's spans have to add up to the column count. When they don't, the cells
after the mistake shift along and the last row comes out ragged — it renders,
so it's worth a glance rather than an error.

## Status

Early. The function API above works; the HTML string API doesn't exist yet.
There's no build step and nothing is published.

## Licence

MIT
