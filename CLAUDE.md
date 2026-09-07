# consolepro

Renders rich, styled content into the Chrome/Edge devtools console by registering a
Custom Formatter (`window.devtoolsFormatters`).

## Why

A wall of text in the devtools console makes it hard to tell what came from where.
`console.log("%c…")` can style messages, but it's very restrictive and doesn't compose at
all — you can't wrap a styled fragment in a function and reuse it.

The Custom Formatters API was built for rendering structured types nicely (think Clojure
values), but the mechanism is generic enough to print arbitrary HTML. This project
leverages it to log console messages as HTML.

## Goals

Two APIs over the same core:

1. **Function-based** — `div(table(tr(), tr()))`
2. **HTML strings** — `"<div><table>…"`, built on top of the function API

Plus:

- **CSS support.** Formatters support a `style` attribute, so parse a CSS string into a
  style string.
- **Composition.** The formatters API supports very few HTML elements, so we need a way to
  create new elements by composing existing ones.

## Approach

Written in TypeScript. `EXAMPLES.md` stays plain JS — designing the usage API shouldn't be
tangled up with types.

Phases: the function API first, then the HTML string API on top of it.

But the first task is neither — it's writing **example usage** for the API we want.
Fictional code, in the shape we'd like to write it, informed by the tests in the archived
implementation. Everything else gets driven from those examples.

## Reference

`docs/chrome-custom-formatters.md` — the Chrome team's spec. Read it before assuming what
the API supports. It's from 2016, so it's authoritative on the format but silent on how
devtools actually behaves today.

## The archive

`archive/` holds a previous, working implementation with tests. It's a **reference only**
— useful because the problem is already solved once and the tests capture real behaviour.
Not happy with how it turned out, and not tied to its API.
