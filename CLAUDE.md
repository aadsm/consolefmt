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

- **CSS support.** Formatters honour a `style` attribute, so CSS should be writable the
  way it is in HTML — as a string or as an object.
- **Composition.** The formatters API renders seven tags — `div`, `span`, `ol`, `li`,
  `table`, `tr`, `td` — so every other element has to be composed from those.
- **Live objects.** An object logged inside a message stays inspectable and expandable
  rather than stringified. It's the one thing this rendering target can do that plain
  HTML can't, and it shapes the API: any argument might be data.

## Approach

Written in TypeScript. `EXAMPLES.md` stays plain JS — designing the usage API shouldn't be
tangled up with types.

Phases: the function API first, then the HTML string API on top of it.

The **example usage** leads: fictional code in the shape we'd like to write it, informed
by the archived implementation. Everything else follows from it.

`EXAMPLES.md` is scaffolding for that and will eventually be deleted, so nothing in `src/`
may reference it. Restate a rule where it's implemented instead.

## Working on it

`src/` is the implementation, TypeScript, no build step yet. `npm run check` type-checks
it (`tsc --noEmit`).

## Reference

`docs/chrome-custom-formatters.md` — the Chrome team's spec. Read it before assuming what
the API supports. It's from 2016, so it's authoritative on the format but silent on how
devtools actually behaves today.

## The archive

`archive/` holds a previous, working implementation with tests. It's a **reference only**
— useful because the problem is already solved once and the tests capture real behaviour.
Not happy with how it turned out, and not tied to its API.

It is deliberately **not in git** — untracked and gitignored, so a fresh clone won't have
it. Never commit it.
