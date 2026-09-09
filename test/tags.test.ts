import { test } from "node:test";
import assert from "node:assert/strict";

import { nativeTagNames } from "../src/elements.ts";
import * as tags from "../src/tags.ts";
import {
  b, code, del, div, em, extend, h1, i, ins, kbd, li, mark, ol, s, samp,
  span, strong, th, u, ul,
} from "../src/tags.ts";

test("there is one function per native tag, and nothing else", () => {
  const exported = Object.keys(tags).sort();

  const composed = [
    "strong", "b", "em", "i", "code", "kbd", "samp", "small", "mark",
    "ins", "u", "del", "s", "sub", "sup",
    "h1", "h2", "h3", "h4", "h5", "h6",
    "p", "pre", "blockquote", "ul", "th",
  ];

  assert.deepEqual(exported, [...nativeTagNames, ...composed, "extend"].sort());
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

test("every tag can be extended", () => {
  for (const name of nativeTagNames) {
    assert.equal(typeof tags[name].extend, "function");
  }
});

test("an extended tag renders its base with the defaults applied", () => {
  const h1 = div.extend({ fontSize: "2em", fontWeight: "bold" });
  const el = h1("Title");

  assert.equal(el.name, "div");
  assert.deepEqual(el.attributes, { fontSize: "2em", fontWeight: "bold" });
  assert.deepEqual(el.children, ["Title"]);
});

test("the caller's attributes win over the defaults", () => {
  const h1 = div.extend({ fontSize: "2em", fontWeight: "bold" });

  assert.deepEqual(h1({ fontSize: "3em", color: "red" }, "Title").attributes, {
    fontSize: "3em",
    fontWeight: "bold",
    color: "red",
  });
});

test("extending doesn't touch the base", () => {
  div.extend({ fontSize: "2em" });

  assert.deepEqual(div("x").attributes, {});
});

test("an extended tag can itself be extended", () => {
  const heading = div.extend({ fontWeight: "bold" });
  const h1 = heading.extend({ fontSize: "2em" });
  const h2 = heading.extend({ fontSize: "1.5em" });

  assert.deepEqual(h1("x").attributes, { fontWeight: "bold", fontSize: "2em" });
  assert.deepEqual(h2("x").attributes, { fontWeight: "bold", fontSize: "1.5em" });
  assert.deepEqual(heading("x").attributes, { fontWeight: "bold" });
});

test("div.extend(…) is sugar for extend(div, …)", () => {
  const viaMethod = div.extend({ color: "red" })("x");
  const viaFunction = extend(div, { color: "red" })("x");

  assert.deepEqual(viaMethod.attributes, viaFunction.attributes);
  assert.equal(viaMethod.name, viaFunction.name);
});

test("extend works on a tag whose base changes the element", () => {
  const ul = ol.extend({ listStyleType: "disc" });
  const el = ul(li("one"));

  assert.equal(el.name, "ol");
  assert.deepEqual(el.attributes, { listStyleType: "disc" });
  assert.equal(el.children.length, 1);
});

test("composed elements render a native element underneath", () => {
  assert.equal(h1("Title").name, "div");
  assert.equal(strong("x").name, "span");
  assert.equal(ul(li("one")).name, "ol");
  assert.equal(th("x").name, "td");
});

test("composed elements carry the spec's defaults", () => {
  assert.deepEqual(h1("Title").attributes, {
    fontSize: "2em",
    fontWeight: "bold",
    marginTop: "0.67em",
    marginBottom: "0.67em",
  });
  assert.deepEqual(mark("x").attributes, {
    backgroundColor: "yellow",
    color: "black",
  });
  assert.deepEqual(ul().attributes, { listStyleType: "disc" });
});

test("visually identical elements are aliases", () => {
  assert.equal(b, strong);
  assert.equal(i, em);
  assert.equal(kbd, code);
  assert.equal(samp, code);
  assert.equal(u, ins);
  assert.equal(s, del);
});

test("composed elements take attributes and children like any tag", () => {
  const el = h1({ color: "red" }, "Title");

  assert.equal(el.attributes["color"], "red");
  assert.equal(el.attributes["fontSize"], "2em");
  assert.deepEqual(el.children, ["Title"]);
});
