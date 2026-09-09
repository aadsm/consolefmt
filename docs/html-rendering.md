# HTML default rendering

The default styles browsers give HTML elements, quoted from the HTML Standard's rendering
section: <https://html.spec.whatwg.org/multipage/rendering.html>. Everything below is
verbatim — this is where the composed elements get their values, so nothing here should be
rounded or paraphrased.

`:heading(1)` … `:heading(6)` are the modern spelling of `h1` … `h6`.

## Phrasing content (§15.3.4)

```css
cite, dfn, em, i, var { font-style: italic; }
b, strong { font-weight: bolder; }
code, kbd, samp, tt { font-family: monospace; }
big { font-size: larger; }
small { font-size: smaller; }

sub { vertical-align: sub; }
sup { vertical-align: super; }
sub, sup { line-height: normal; font-size: smaller; }

:link { color: #0000EE; }
:visited { color: #551A8B; }
:link:active, :visited:active { color: #FF0000; }
:link, :visited { text-decoration: underline; cursor: pointer; }

mark { background: yellow; color: black; }

abbr[title], acronym[title] { text-decoration: dotted underline; }
ins, u { text-decoration: underline; }
del, s, strike { text-decoration: line-through; }

br { display-outside: newline; }
nobr { white-space: nowrap; }
```

## Flow content (§15.3.3)

```css
address, blockquote, center, dialog, div, figure, figcaption, footer, form,
header, hr, legend, listing, main, p, plaintext, pre, search, xmp {
  display: block;
}

blockquote, figure, listing, p, plaintext, pre, xmp {
  margin-block: 1em;
}

blockquote, figure { margin-inline: 40px; }

address { font-style: italic; }
listing, plaintext, pre, xmp {
  font-family: monospace; white-space: pre;
}

pre[wrap] { white-space: pre-wrap; }
```

## Sections and headings (§15.3.6)

```css
article, aside, :heading, hgroup, nav, section {
  display: block;
}

:heading { font-weight: bold; }

:heading(1) { margin-block: 0.67em; font-size: 2.00em; }
:heading(2) { margin-block: 0.83em; font-size: 1.50em; }
:heading(3) { margin-block: 1.00em; font-size: 1.17em; }
:heading(4) { margin-block: 1.33em; font-size: 1.00em; }
:heading(5) { margin-block: 1.67em; font-size: 0.83em; }
:heading(6, 7, 8, 9) {
  font-size: 0.67em;
  margin-block: 2.33em;
}
```

## Lists (§15.3.7)

```css
dir, dd, dl, dt, menu, ol, ul { display: block; }
li { display: list-item; text-align: match-parent; }

dir, dl, menu, ol, ul { margin-block: 1em; }

:is(dir, dl, menu, ol, ul) :is(dir, dl, menu, ol, ul) {
  margin-block: 0;
}

dd { margin-inline-start: 40px; }
dir, menu, ol, ul { padding-inline-start: 40px; }

ol, ul, menu { counter-reset: list-item; }
ol { list-style-type: decimal; }

dir, menu, ul {
  list-style-type: disc;
}
:is(dir, menu, ol, ul) :is(dir, menu, ul) {
  list-style-type: circle;
}
:is(dir, menu, ol, ul) :is(dir, menu, ol, ul) :is(dir, menu, ul) {
  list-style-type: square;
}

li { list-style-position: inside; }
li :is(dir, menu, ol, ul) { list-style-position: outside; }
:is(dir, menu, ol, ul) :is(dir, menu, ol, ul, li) { list-style-position: unset; }
```

## Tables (§15.3.8)

```css
table { display: table; }
caption { display: table-caption; }
thead, thead[hidden] { display: table-header-group; }
tbody, tbody[hidden] { display: table-row-group; }
tfoot, tfoot[hidden] { display: table-footer-group; }
tr, tr[hidden] { display: table-row; }
td, th { display: table-cell; }

td, th { padding: 1px; }
th { font-weight: bold; }
caption { text-align: center; }

thead, tbody, tfoot, table > tr { vertical-align: middle; }
tr, td, th { vertical-align: inherit; }
thead, tbody, tfoot, tr { border-color: inherit; }

td[nowrap], th[nowrap] { white-space: nowrap; }
```

## The hr element (§15.3.11)

```css
hr {
  color: gray;
  border-style: inset;
  border-width: 1px;
  margin-block: 0.5em;
  margin-inline: auto;
  overflow: hidden;
}
```
