import { test } from "node:test";
import assert from "node:assert/strict";

import { nativeTagNames } from "../src/elements.ts";
import * as tags from "../src/tags.ts";
import { div, span } from "../src/tags.ts";

test("there is one function per native tag, and nothing else", () => {
  const exported = Object.keys(tags).sort();

  assert.deepEqual(exported, [...nativeTagNames].sort());
});

test("each one builds an element of its own name", () => {
  for (const name of nativeTagNames) {
    assert.equal(tags[name]().name, name);
  }
});

test("they read arguments the same way element() does", () => {
  const el = div({ padding: "4px" }, span({ fontWeight: "bold" }, "bold"), " and ");

  assert.deepEqual(el.attributes, { padding: "4px" });
  assert.equal(el.children.length, 2);
  assert.deepEqual(el.children[1], " and ");
});
