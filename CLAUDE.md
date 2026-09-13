# consolepro

Renders rich, styled content into the Chrome/Edge devtools console by registering a Custom Formatter (`window.devtoolsFormatters`).

## What's here

`src/` is the library:

- `elements.ts` builds an element and splits a call's arguments into attributes and children
- `tags.ts` the tag functions, `extend`, and `asTag` for tags that read their arguments their own way
- `grid.ts` the grid, carrying its own `row` and `cell`
- `formatter.ts` turns an element into the JsonML devtools renders, and registers itself when the first element is built
- `index.ts` the package entry point

`test/` mirrors it, one file per module, run by `node --test`.

`README.md` is the walkthrough and `docs/gallery.md` holds thirty worked examples. Both are the source their screenshots are generated from.

## Two constraints shape the API

The formatters API renders seven tags, `div`, `span`, `ol`, `li`, `table`, `tr` and `td`, so every other element is composed from those.

An object logged inside a message stays inspectable and expandable rather than stringified. It is the one thing this rendering target can do that plain HTML can't, and it means any argument might be data.

## Working on it

```
npm run check    # tsc --noEmit, over src, test and tools
npm test         # node --test
npm run build    # dist/
```

Node runs the TypeScript directly by stripping the types, so `src/` has no compile step and imports name the real files (`./tags.ts`). Only erasable syntax works: no enum, namespace, parameter properties or decorators. `erasableSyntaxOnly` turns those into a `npm run check` failure rather than a runtime one.

## The build

`tools/build.ts` writes `dist/`, which is gitignored and built at publish time by `prepublishOnly`. esbuild emits `consolepro.js`, a classic script defining a `consolepro` global, and `consolepro.esm.js`, the module. tsc emits the declarations into `dist/types/`.

The README pins its CDN URLs to a version. `npm version` runs `tools/sync-readme-version.ts`, which rewrites them and stages the file so it rides in the version commit.

## The screenshots

Every image in `README.md` and `docs/gallery.md` is a real devtools console, driven headlessly by `tools/screenshots.ts`. It uses Puppeteer's bundled Chrome rather than whatever is installed, so a given commit renders the same images years later. Everything devtools-specific lives behind `openDevtoolsConsole` in `tools/devtools-console.ts`.

```
node tools/screenshots.ts            # docs/images/
node tools/screenshots.ts --dark     # docs/images/dark/
node tools/screenshots.ts --gallery  # docs/images/gallery/
```

Every shot comes from the markdown that shows it: `README.md` for the first two, `docs/gallery.md` for `--gallery`. A `##` section holding both a code block and an image is a shot. The code is the section's first block, the image names the file, and `?framed` on the image path puts the devtools panel around it instead of cropping to the message. A section with no image is prose, and a block after the image is commentary.

That markdown is the source, not a transcription: to change an example, edit its code block and re-run. Each block runs inside a block of its own, so it has to take the names it uses from `consolepro` rather than from the block before it, and one that reaches for a tag it did not name fails the run rather than quietly working.

The hero is the exception, composed rather than parsed: `HERO` names gallery examples by slug, each keeps its own scope, and the shot is written to `docs/images/hero.png`. It has no dark twin, because the examples pick their colours against a light console.

A run rewrites every image in the target directory, but the caret is stopped mid-frame before each shot, so a file only comes back modified when its content actually moved. Two runs of the same commit produce identical bytes.

## Reference

`docs/chrome-custom-formatters.md` is the Chrome team's spec. Read it before assuming what the API supports. It is from 2016, so it is authoritative on the format but silent on how devtools actually behaves today.

`docs/html-rendering.md` quotes the HTML Standard's default styles verbatim. It is where composed elements get their values, so nothing there should be rounded or paraphrased.

## Not in git

`local/` is ignored whole, so a fresh clone won't have any of it. Never commit anything from it, and nothing in `src/` may reference it. Restate a rule where it's implemented instead. Being ignored is not the same as being safe: `git clean -xdf` would take the lot.

`local/archive/` holds a previous, working implementation with tests. It is a reference only, useful because the problem is already solved once and its tests capture real behaviour. Not happy with how it turned out, and not tied to its API.
