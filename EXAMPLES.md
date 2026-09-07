# Example usage

Fictional. This is the API we want, written before it exists. Everything else gets driven
from here.

Grounded in the tests and docs of the archived implementation, but not bound to its API.

---

## 1. Function API

### Basic

```js
import { div, span } from "consolepro";

console.log(span("hello"));
console.log(span({ color: "red" }, "hello"));
```

First argument is the style when it's a plain object. Not `{ style: {...} }` — style is
effectively the only attribute the formatters API honours, so it shouldn't need a wrapper.

### Nesting

```js
console.log(
  div({ border: "1px solid red", padding: "4px", borderRadius: "4px" },
    span({ fontWeight: "bold" }, "bold"),
    " and ",
    span({ fontStyle: "italic" }, "italic")
  )
);
```

### Embedding live objects

```js
const user = { name: "Pedro", age: 32 };
console.log(span("user: ", user));
```

The object stays inspectable in the console — expandable, not stringified. This is the one
thing this rendering target can do that plain HTML can't.

### Composition

A new element is just a function:

```js
const pill = (message, color = "white") =>
  span({
    color,
    fontWeight: "bold",
    padding: "2px 4px",
    border: `5px solid ${color}`,
    borderRadius: "12px",
  }, message);

const IF = pill("IF", "red");
const THEN = pill("THEN");

console.log(IF, "condition", THEN, "do this");
```

Elements are values — build once, log many times.

```js
const title = (...children) => div({ fontSize: "2em", fontWeight: "bold" }, ...children);
const section = (name, ...children) => div(title(name), ...children);
```

### Children

```js
span("a", 42, div("b"))        // strings, numbers, elements
span(items)                    // an array flattens into the children
span(cond ? span("x") : null)  // null and undefined are dropped
```

---

## 2. HTML API

Built on top of the function API.

### Strings

```js
import { html } from "consolepro";

console.log(html(`<span style="padding: 4px; border: 1px solid">info</span>`));
```

### Tagged template

```js
const name = "Pedro";
console.log(html`<span style="font-weight: bold">hello ${name}</span>`);
```

Interpolated objects stay live, same as the function API:

```js
console.log(html`<div>user: ${user}</div>`);
```

### CSS

```js
console.log(html`
  <style>
    .card { padding: 20px; border-radius: 10px; background: #f0f0f0; }
    .day  { font-size: 108px; font-weight: bold; color: #333; }
  </style>

  <div class="card">
    <div class="day">${date.getDate()}</div>
  </div>
`);
```

Selectors get flattened to inline styles, because the formatters API has no class support.

### Composition

```js
const pill = (message, color = "white") => html`
  <span style="color: ${color}; font-weight: bold; border: 5px solid ${color}">
    ${message}
  </span>
`;
```

---

## Open

- **Style as first arg vs. named.** `span({ color: "red" }, "x")` reads well until you want
  a non-style attribute. Is there ever one worth supporting?
- **Custom elements as plain functions** covers composition with no machinery. Is anything
  lost versus a registry (`define("pill", …)`) that the HTML API could then use as
  `<pill>`? That's the one thing functions can't give the string API.
- **`html` vs `html\`\``** — one export handling both, or two?
