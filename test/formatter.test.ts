import { test } from "node:test";
import assert from "node:assert/strict";

import { formatter, toJsonML } from "../src/formatter.ts";
import { div, span, strong } from "../src/tags.ts";

const user = { name: "Pedro", age: 32 };

test("an element becomes [name, { style }, ...children]", () => {
  assert.deepEqual(toJsonML(span("hello")), ["span", { style: "" }, "hello"]);
});

test("attributes are CSS properties, hyphenated", () => {
  assert.deepEqual(toJsonML(span({ fontWeight: "bold", color: "red" })), [
    "span",
    { style: "font-weight: bold; color: red" },
  ]);
});

test("style takes a string or an object, and is applied last", () => {
  assert.deepEqual(toJsonML(span({ color: "red", style: "color: blue" })), [
    "span",
    { style: "color: red; color: blue" },
  ]);
  assert.deepEqual(toJsonML(span({ color: "red", style: { color: "blue" } })), [
    "span",
    { style: "color: red; color: blue" },
  ]);
});

test("elements nest, and everything else becomes a string", () => {
  assert.deepEqual(toJsonML(div(strong("bold"), " and ", 42, true)), [
    "div",
    { style: "" },
    ["span", { style: "font-weight: bold" }, "bold"],
    " and ",
    "42",
    "true",
  ]);
});

test("an object child becomes an object reference, so it stays live", () => {
  assert.deepEqual(toJsonML(span("user: ", user)), [
    "span",
    { style: "" },
    "user: ",
    ["object", { object: user }],
  ]);
});

test("the formatter only claims elements", () => {
  assert.deepEqual(formatter.header(span("hello")), ["span", { style: "" }, "hello"]);
  assert.equal(formatter.header(user), null);
  assert.equal(formatter.header("hello"), null);
  assert.equal(formatter.header(null), null);
});
