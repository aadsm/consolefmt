import { test } from "node:test";
import assert from "node:assert/strict";

import { Element, element, isAttributes, nativeTagNames } from "../src/elements.ts";

const user = { name: "Pedro", age: 32 };

test("an element keeps its name, attributes and children", () => {
  const el = element("span", { color: "red" }, "hello");

  assert.ok(el instanceof Element);
  assert.equal(el.name, "span");
  assert.deepEqual(el.attributes, { color: "red" });
  assert.deepEqual(el.children, ["hello"]);
});

test("every native tag is accepted", () => {
  for (const name of nativeTagNames) {
    assert.equal(element(name).name, name);
  }
});

test("any other tag throws, and says what to compose from", () => {
  assert.throws(() => element("h1", "Title"), (error: Error) => {
    assert.match(error.message, /<h1>/);
    assert.match(error.message, new RegExp(nativeTagNames.join(", ")));
    return true;
  });
});

test("a plain object first is the attributes", () => {
  assert.deepEqual(element("span", { color: "red" }).attributes, { color: "red" });
  assert.deepEqual(element("span", { color: "red" }).children, []);
});

test("attributes may be omitted entirely", () => {
  const el = element("span", "hello");

  assert.deepEqual(el.attributes, {});
  assert.deepEqual(el.children, ["hello"]);
});

test("style is carried through as a string or an object", () => {
  assert.deepEqual(element("span", { style: "color: red" }).attributes, {
    style: "color: red",
  });
  assert.deepEqual(element("span", { style: { color: "red" } }).attributes, {
    style: { color: "red" },
  });
});

test("anything that isn't a plain object is a child, in any position", () => {
  const inner = element("span", "inner");

  assert.deepEqual(element("span", "hello").children, ["hello"]);
  assert.deepEqual(element("span", 42).children, [42]);
  assert.deepEqual(element("span", inner, "x").children, [inner, "x"]);
});

test("empty attributes let an object be the first child", () => {
  const el = element("span", {}, user);

  assert.deepEqual(el.attributes, {});
  assert.deepEqual(el.children, [user]);
});

test("an object in a later position stays a child", () => {
  assert.deepEqual(element("span", "user: ", user).children, ["user: ", user]);
});

test("an object as the first child reads as attributes — the known hole", () => {
  const el = element("span", user);

  assert.deepEqual(el.attributes, user);
  assert.deepEqual(el.children, []);
});

test("arrays are children, kept whole", () => {
  const items = [1, 2, 3];

  assert.deepEqual(element("span", items).children, [items]);
  assert.deepEqual(element("span", ...items).children, [1, 2, 3]);
});

test("null and undefined children are dropped", () => {
  assert.deepEqual(element("span", null, "x", undefined, "y").children, ["x", "y"]);
  assert.deepEqual(element("span", null).children, []);
});

test("a null first argument is a dropped child, not attributes", () => {
  const el = element("span", null, user);

  assert.deepEqual(el.attributes, {});
  assert.deepEqual(el.children, [user]);
});

test("isAttributes only accepts plain objects", () => {
  assert.equal(isAttributes({}), true);
  assert.equal(isAttributes({ color: "red" }), true);

  assert.equal(isAttributes(null), false);
  assert.equal(isAttributes(undefined), false);
  assert.equal(isAttributes("hello"), false);
  assert.equal(isAttributes(42), false);
  assert.equal(isAttributes([1, 2]), false);
  assert.equal(isAttributes(element("span")), false);
  assert.equal(isAttributes(new Date()), false);
});
