# Gallery

The consolepro library can draw more than text. Flame graphs, network waterfalls, a layer inspector tilted in 3D, a state machine, a bitmap of a typed array. All of it powered by `console.log` and devtools' Custom Formatters.

Each example takes the names it uses from `consolepro`, the module once you have imported it.

Every image is the output of the code above it, captured from a real console.

## Session log

Ordinary logging, as you'd leave it in an app. Each line is one capsule in three parts: what happened, what it touched, and what it cost. `console.group` nests the calls under the navigation that caused them, and the cart prints as a card with the live object still inside it.

![](images/gallery/session-log.png?framed)

<details>
<summary>Code</summary>

```js
const { div, span } = consolepro;

// An ink and a wash of the same hue, so a third segment reads as context
// rather than a second label.
const NAV  = { ink: "#8e44ad", wash: "#f4ecf9" };
const GET  = { ink: "#2980b9", wash: "#eaf2f9" };
const POST = { ink: "#16a085", wash: "#e6f5f1" };
const WARN = { ink: "#d97706", wash: "#fdf3e3" };
const INK = "#3d4756", MUTED = "#98a1ae", LINE = "#e3e8ee";

// Top and bottom borders with negative margins: a capsule keeps the line
// at its normal height instead of spacing the whole log out.
const part = (ink) => ({
  display: "inline-block",
  borderTop: "1px solid " + ink, borderBottom: "1px solid " + ink,
  paddingTop: "2px", paddingBottom: "1px",
  marginTop: "-2px", marginBottom: "-2px",
});

const capsule = (verb, subject, c, tail) => span(
  span({ ...part(c.ink), background: c.ink, color: "white",
         borderLeft: "1px solid " + c.ink,
         borderTopLeftRadius: "4px", borderBottomLeftRadius: "4px",
         paddingLeft: "4px", paddingRight: "4px",
         textTransform: "uppercase", fontWeight: "bold" }, verb),
  span({ ...part(c.ink), color: c.ink,
         paddingLeft: "5px", paddingRight: "5px",
         ...(tail == null ? { borderRight: "1px solid " + c.ink,
                              borderTopRightRadius: "4px",
                              borderBottomRightRadius: "4px" } : {}) }, subject),
  tail == null ? null : span({ ...part(c.ink), background: c.wash, color: c.ink,
         borderLeft: "1px solid " + c.ink, borderRight: "1px solid " + c.ink,
         borderTopRightRadius: "4px", borderBottomRightRadius: "4px",
         paddingLeft: "5px", paddingRight: "5px" }, tail),
);

const ms = (n) => span({ fontStyle: "italic" },
  span({ fontSize: "xx-small", verticalAlign: "middle" }, String(n)),
  span({ fontSize: "8px" }, "ms"));

console.group(capsule("nav", "/", NAV, "cold start"));
console.log(capsule("get", "/api/session", GET, ms(42)));
console.log(capsule("get", "/api/products?page=1", GET, ms(88)));
console.groupEnd();

console.group(capsule("nav", "/products/8812", NAV, "client route"));
console.log(capsule("get", "/api/products/8812", GET, ms(31)));
console.log(capsule("warn", "hero.jpg is 1.4 MB", WARN, "1.2s to paint"));
console.groupEnd();

const cart = { id: 8812, items: [
  { sku: "hat-01", qty: 2, price: 12.5 },
  { sku: "scarf-03", qty: 1, price: 17.5 },
], total: 42.5 };

const money = (n) => "$" + n.toFixed(2);
const mono = { fontFamily: "ui-monospace, monospace" };

// The object sits in the card's last row rather than beside it. It stays
// expandable, and the summary above answers the question without opening it.
const receipt = div({ display: "inline-block", marginLeft: "22px",
    border: "1px solid " + LINE, borderRadius: "5px", background: "white",
    color: INK, fontSize: "11px", minWidth: "200px" },
  div({ display: "flex", justifyContent: "space-between", gap: "18px",
        padding: "4px 9px", borderBottom: "1px solid " + LINE,
        background: "#f7f9fb", fontWeight: "bold" },
    span(mono, "cart " + cart.id), span(money(cart.total))),
  ...cart.items.map((item) => div({ display: "flex", fontSize: "10px",
      justifyContent: "space-between", gap: "18px", padding: "2px 9px", ...mono },
    span(item.sku),
    span({ color: MUTED }, "×" + item.qty + "   " + money(item.price * item.qty)))),
  div({ padding: "3px 9px", borderTop: "1px solid " + LINE, fontSize: "10px" },
    span({ color: MUTED }, "object "), cart));

console.group(capsule("nav", "/cart", NAV, "client route"));
console.log(capsule("post", "/api/cart", POST, ms(130)));
console.log(receipt);
console.groupEnd();
```

</details>

## Flame graph

A frame's width is its share of its parent, so nesting does the arithmetic.

![](images/gallery/flame-graph.png?framed)

<details>
<summary>Code</summary>

```js
const { div, span } = consolepro;

const label = (t) => div({ fontSize: "10px", color: "#8a8a8a",
  textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "6px" }, t);

const profile = { name: "main", ms: 420, children: [
  { name: "parse", ms: 60, children: [{ name: "tokenize", ms: 38 }] },
  { name: "render", ms: 300, children: [
    { name: "layout", ms: 120, children: [{ name: "measure", ms: 70 }] },
    { name: "paint", ms: 150, children: [
      { name: "raster", ms: 110 }, { name: "composite", ms: 30 }] },
  ] },
  { name: "idle", ms: 60 },
] };

const HEAT = ["#e8590c", "#f08c00", "#f59f00", "#fab005", "#fcc419", "#ffd43b"];
const frame = (node, parentMs, depth) => div({
    width: (node.ms / parentMs * 100) + "%", boxSizing: "border-box" },
  div({ background: HEAT[Math.min(depth, HEAT.length - 1)], color: "#3d2600",
        height: "17px", lineHeight: "17px", fontSize: "10px",
        padding: "0 5px", marginBottom: "1px", borderRadius: "2px",
        overflow: "hidden", whiteSpace: "nowrap", boxSizing: "border-box",
        border: "1px solid rgba(255,255,255,.6)" },
    node.name, span({ opacity: "0.65" }, " " + node.ms + "ms")),
  node.children == null ? null
    : div({ display: "flex" },
        ...node.children.map((c) => frame(c, node.ms, depth + 1))),
);

console.log(div(label("profile · 420ms"),
  div({ width: "560px" }, frame(profile, profile.ms, 0))));
```

</details>

## Contribution heatmap

210 divs in a column-flowing grid.

![](images/gallery/contribution-heatmap.png?framed)

<details>
<summary>Code</summary>

```js
const { div, span } = consolepro;

const label = (t) => div({ fontSize: "10px", color: "#8a8a8a",
  textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "6px" }, t);

const WEEKS = 30;
const SCALE = ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"];
const cells = [];
for (let w = 0; w < WEEKS; w++) {
  for (let d = 0; d < 7; d++) {
    const busy = Math.max(0, Math.round(
      2.2 + 1.8 * Math.sin(w / 3.4) - (d === 0 || d === 6 ? 2.2 : 0)
      + ((w * 7 + d) % 5 === 0 ? 1 : -0.4)));
    cells.push(div({ width: "10px", height: "10px", borderRadius: "2px",
      background: SCALE[Math.min(busy, 4)] }));
  }
}
console.log(div(label("commits · last 30 weeks"),
  div({ display: "grid", gridTemplateRows: "repeat(7, 10px)",
        gridAutoFlow: "column", gridAutoColumns: "10px", gap: "3px" },
    ...cells),
  div({ display: "flex", alignItems: "center", gap: "4px",
        marginTop: "8px", fontSize: "10px", color: "#8a8a8a" },
    span("less"),
    ...SCALE.map((c) => div({ width: "10px", height: "10px",
      borderRadius: "2px", background: c })),
    span("more")),
));
```

</details>

## Line chart

Drawn on a canvas at 2x, then handed over as a data URI.

![](images/gallery/line-chart.png?framed)

<details>
<summary>Code</summary>

```js
const { div } = consolepro;

const label = (t) => div({ fontSize: "10px", color: "#8a8a8a",
  textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "6px" }, t);

const draw = (w, h, paint) => {
  const c = document.createElement("canvas");
  c.width = w * 2; c.height = h * 2;
  const g = c.getContext("2d");
  g.scale(2, 2);
  paint(g);
  return c;
};
const picture = (c, w, h, extra) => div({ width: w + "px", height: h + "px",
  backgroundImage: 'url("' + c.toDataURL() + '")', backgroundSize: w + "px " + h + "px",
  ...extra });

const series = [12, 19, 15, 27, 24, 38, 31, 44, 41, 52, 48, 61];
const chart = draw(340, 130, (g) => {
  const max = 70, pad = 26;
  g.font = "9px ui-monospace, monospace";
  g.strokeStyle = "#e6eaee"; g.fillStyle = "#9aa4b1"; g.lineWidth = 1;
  for (let v = 0; v <= max; v += 20) {
    const y = 112 - (v / max) * 92;
    g.beginPath(); g.moveTo(pad, y + 0.5); g.lineTo(332, y + 0.5); g.stroke();
    g.fillText(String(v), 6, y + 3);
  }
  const x = (i) => pad + i * ((332 - pad) / (series.length - 1));
  const y = (v) => 112 - (v / max) * 92;
  const grad = g.createLinearGradient(0, 20, 0, 112);
  grad.addColorStop(0, "rgba(41,128,185,.32)");
  grad.addColorStop(1, "rgba(41,128,185,0)");
  g.beginPath(); g.moveTo(x(0), y(series[0]));
  series.forEach((v, i) => g.lineTo(x(i), y(v)));
  g.lineTo(x(series.length - 1), 112); g.lineTo(x(0), 112); g.closePath();
  g.fillStyle = grad; g.fill();
  g.beginPath(); series.forEach((v, i) => i ? g.lineTo(x(i), y(v)) : g.moveTo(x(i), y(v)));
  g.strokeStyle = "#2980b9"; g.lineWidth = 2; g.stroke();
  series.forEach((v, i) => {
    g.beginPath(); g.arc(x(i), y(v), 2.5, 0, 7); g.fillStyle = "#2980b9"; g.fill();
  });
  g.fillStyle = "#9aa4b1"; g.font = "9px ui-monospace, monospace";
  ["jan","mar","may","jul","sep","nov"].forEach((m, i) =>
    g.fillText(m, x(i * 2) - 7, 126));
});
console.log(div(label("signups · monthly"), picture(chart, 340, 130)));
```

</details>

## Visual diff

The third image is computed from the other two at log time.

![](images/gallery/visual-diff.png?framed)

<details>
<summary>Code</summary>

```js
const { div } = consolepro;

const label = (t) => div({ fontSize: "10px", color: "#8a8a8a",
  textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "6px" }, t);

const draw = (w, h, paint) => {
  const c = document.createElement("canvas");
  c.width = w * 2; c.height = h * 2;
  const g = c.getContext("2d");
  g.scale(2, 2);
  paint(g);
  return c;
};
const picture = (c, w, h, extra) => div({ width: w + "px", height: h + "px",
  backgroundImage: 'url("' + c.toDataURL() + '")', backgroundSize: w + "px " + h + "px",
  ...extra });

const scene = (shift) => draw(120, 80, (g) => {
  g.fillStyle = "#fdfdfd"; g.fillRect(0, 0, 120, 80);
  g.fillStyle = "#34495e"; g.fillRect(12, 12, 60, 14);
  g.fillStyle = "#bdc3c7"; g.fillRect(12, 34, 96, 6); g.fillRect(12, 46, 78, 6);
  g.fillStyle = "#e74c3c"; g.fillRect(12 + shift, 60, 34, 12);
});
const before = scene(0), after = scene(22);

const diff = draw(120, 80, (g) => {
  const a = before.getContext("2d").getImageData(0, 0, 240, 160);
  const b = after.getContext("2d").getImageData(0, 0, 240, 160);
  const out = g.createImageData(240, 160);
  for (let i = 0; i < a.data.length; i += 4) {
    const d = Math.abs(a.data[i] - b.data[i]) + Math.abs(a.data[i+1] - b.data[i+1])
            + Math.abs(a.data[i+2] - b.data[i+2]);
    const hit = d > 24;
    out.data[i] = hit ? 231 : 250; out.data[i+1] = hit ? 76 : 250;
    out.data[i+2] = hit ? 60 : 250; out.data[i+3] = 255;
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.putImageData(out, 0, 0);
});

const framed = { border: "1px solid #d7dce2", borderRadius: "4px" };
const shot = (c, name) => div(
  picture(c, 120, 80, framed),
  div({ fontSize: "10px", color: "#8a8a8a", marginTop: "4px",
        textAlign: "center" }, name));

console.log(div(label("visual diff · 412 pixels changed"),
  div({ display: "flex", gap: "10px" },
    shot(before, "before"), shot(after, "after"), shot(diff, "changed"))));
```

</details>

## Network waterfall

Bars placed by start time, split into timing phases.

![](images/gallery/network-waterfall.png?framed)

<details>
<summary>Code</summary>

```js
const { div, span } = consolepro;

const label = (t) => div({ fontSize: "10px", color: "#8a8a8a",
  textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "7px" }, t);

const PHASES = [["blocked", "#c8ccd2"], ["dns", "#12a594"],
                ["connect", "#f5a524"], ["ttfb", "#3fb950"], ["download", "#3b82f6"]];
const requests = [
  { name: "index.html", start: 0, t: [4, 14, 22, 48, 12] },
  { name: "app.css", start: 96, t: [2, 0, 8, 36, 10] },
  { name: "app.js", start: 102, t: [2, 0, 0, 41, 128] },
  { name: "vendor.js", start: 108, t: [6, 0, 0, 52, 214] },
  { name: "logo.svg", start: 288, t: [3, 0, 0, 22, 6] },
  { name: "hero.webp", start: 296, t: [3, 0, 9, 31, 174] },
  { name: "/api/session", start: 380, t: [1, 0, 0, 118, 4] },
];
const SPAN = 620;

const tick = (ms) => div({ position: "absolute", left: (ms / SPAN * 100) + "%",
    top: "0", bottom: "0", borderLeft: "1px dashed #e6eaee" },
  div({ position: "absolute", top: "-13px", left: "2px",
        fontSize: "9px", color: "#aab2bd" }, ms + "ms"));

const bar = (r) => {
  const total = r.t.reduce((a, b) => a + b, 0);
  return div({ position: "absolute", left: (r.start / SPAN * 100) + "%",
      width: (total / SPAN * 100) + "%", top: "3px", height: "11px",
      display: "flex", borderRadius: "2px", overflow: "hidden",
      boxShadow: "0 0 0 1px rgba(0,0,0,.06)" },
    ...r.t.map((ms, i) => ms === 0 ? null
      : div({ width: (ms / total * 100) + "%", background: PHASES[i][1] })),
  );
};

console.log(div(label("network · 7 requests · 620ms"),
  div({ position: "relative", height: "16px", marginTop: "10px" },
    ...[0, 150, 300, 450, 600].map(tick)),
  ...requests.map((r) => div({ display: "grid",
      gridTemplateColumns: "110px 1fr", alignItems: "center", height: "17px" },
    div({ fontSize: "11px", color: "#5b6472", overflow: "hidden",
          whiteSpace: "nowrap" }, r.name),
    div({ position: "relative", height: "17px" },
      ...[0, 150, 300, 450, 600].map((ms) => div({ position: "absolute",
        left: (ms / SPAN * 100) + "%", top: "0", bottom: "0",
        borderLeft: "1px dashed #eef1f4" })),
      bar(r)))),
  div({ display: "flex", gap: "10px", marginTop: "8px", fontSize: "10px",
        color: "#8a8a8a" },
    ...PHASES.map(([n, c]) => span(
      div({ display: "inline-block", width: "8px", height: "8px",
            borderRadius: "2px", background: c, marginRight: "4px" }), n))),
));
```

</details>

## Bundle treemap

Nested flex, with flex-grow carrying the byte count.

![](images/gallery/bundle-treemap.png?framed)

<details>
<summary>Code</summary>

```js
const { div } = consolepro;

const label = (t) => div({ fontSize: "10px", color: "#8a8a8a",
  textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "7px" }, t);

const bundle = { name: "bundle", children: [
  { name: "node_modules", children: [
    { name: "react-dom", size: 130 }, { name: "lodash", size: 71 },
    { name: "moment", size: 64 }, { name: "chart.js", size: 52 },
    { name: "date-fns", size: 28 } ] },
  { name: "src", children: [
    { name: "pages", size: 48 }, { name: "components", size: 39 },
    { name: "utils", size: 14 } ] },
  { name: "polyfills", size: 22 },
] };
const weigh = (n) => n.size != null ? n.size
  : n.children.reduce((a, c) => a + weigh(c), 0);
const TINT = ["#1f6feb", "#238636", "#8957e5", "#bb8009", "#0f9d76"];

const box = (node, horizontal, depth, tint) => {
  const mine = tint != null ? tint : TINT[depth % TINT.length];
  if (node.children == null) {
    return div({ flexGrow: String(weigh(node)), flexBasis: "0",
        background: mine, color: "white", overflow: "hidden",
        border: "1px solid rgba(255,255,255,.85)", borderRadius: "3px",
        padding: "3px 5px", boxSizing: "border-box", minWidth: "0" },
      div({ fontSize: "10px", fontWeight: "bold", whiteSpace: "nowrap",
            overflow: "hidden" }, node.name),
      div({ fontSize: "9px", opacity: "0.8" }, weigh(node) + " kB"));
  }
  return div({ display: "flex", flexGrow: String(weigh(node)), flexBasis: "0",
      flexDirection: horizontal ? "row" : "column", minWidth: "0" },
    ...node.children.map((c) => box(c, !horizontal, depth + 1, mine)));
};

console.log(div(label("bundle · 468 kB"),
  div({ display: "flex", width: "520px", height: "170px" },
    ...bundle.children.map((c, i) => box(c, i % 2 === 0, 0, TINT[i]))),
));
```

</details>

## Code diff

A four-column grid and a small tokeniser.

![](images/gallery/code-diff.png?framed)

<details>
<summary>Code</summary>

```js
const { div, span } = consolepro;

const label = (t) => div({ fontSize: "10px", color: "#8a8a8a",
  textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "7px" }, t);

const KEYWORDS = new Set(["const", "let", "return", "if", "await", "async",
  "function", "new", "for", "of"]);
const paint = (code) => code.split(/('[^']*')/).flatMap((chunk, i) => {
  if (i % 2 === 1) return [span({ color: "#0a7d55" }, chunk)];
  return chunk.split(/([^A-Za-z0-9_$]+)/).map((t) => {
    if (!t) return null;
    if (KEYWORDS.has(t)) return span({ color: "#b3439a" }, t);
    if (/^[0-9]+$/.test(t)) return span({ color: "#1f6feb" }, t);
    return t;
  });
});

const lines = [
  [" ", 41, 41, "async function cacheFirst(request) {"],
  [" ", 42, 42, "  const cache = await caches.open(IMAGES);"],
  ["-", 43, null, "  const hit = cache.match(request);"],
  ["-", 44, null, "  if (hit) return hit;"],
  ["+", null, 43, "  const hit = await cache.match(request);"],
  ["+", null, 44, "  if (hit) { record('hit'); return hit; }"],
  [" ", 45, 45, ""],
  [" ", 46, 46, "  return fetch(request);"],
  [" ", 47, 47, "}"],
];
const TONE = { "+": ["#e6ffec", "#1a7f37"], "-": ["#ffebe9", "#cf222e"],
               " ": ["transparent", "#8a8a8a"] };
const gutter = (n) => div({ color: "#aab2bd", textAlign: "right",
  padding: "0 7px" }, n == null ? "" : String(n));

console.log(div(label("cacheFirst.js · 2 additions · 2 deletions"),
  div({ fontFamily: "ui-monospace, monospace", fontSize: "11.5px",
        border: "1px solid #d8dee4", borderRadius: "6px", overflow: "hidden",
        width: "430px" },
    ...lines.map(([kind, a, b, code]) => div({ display: "grid",
        gridTemplateColumns: "38px 38px 16px 1fr", lineHeight: "18px",
        background: TONE[kind][0] },
      gutter(a), gutter(b),
      div({ color: TONE[kind][1], textAlign: "center" }, kind),
      div({ whiteSpace: "pre" }, ...paint(code)))),
  )));
```

</details>

## Commit graph

The merge elbow is one border-radius on two borders.

![](images/gallery/commit-graph.png?framed)

<details>
<summary>Code</summary>

```js
const { div, span } = consolepro;

const label = (t) => div({ fontSize: "10px", color: "#8a8a8a",
  textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "7px" }, t);

const LANE = ["#1f6feb", "#8957e5"];
const at = (lane) => 14 + lane * 18;
const vline = (lane, from, to) => div({ position: "absolute",
  left: at(lane) + "px", top: from + "px", height: (to - from) + "px",
  width: "2px", marginLeft: "-1px", background: LANE[lane] });
const dot = (lane, y, hollow) => div({ position: "absolute",
  left: at(lane) + "px", top: y + "px", width: "9px", height: "9px",
  marginLeft: "-4.5px", marginTop: "-4.5px", borderRadius: "50%",
  background: hollow ? "white" : LANE[lane],
  border: "2px solid " + LANE[lane], boxSizing: "border-box" });
// Spans dot to dot, with the curve in the middle: put the corner at an
// end and its radius pulls the line short of the circle it should meet.
const merge = (fromY, toY) => div({ position: "absolute", left: at(0) + "px",
  top: fromY + "px", width: (at(1) - at(0)) + "px",
  height: (toY - fromY) + "px",
  borderTop: "2px solid " + LANE[1], borderRight: "2px solid " + LANE[1],
  borderTopRightRadius: "9px", boxSizing: "border-box" });

const commits = [
  ["a3f19c2", 0, "merge: service worker caching", "12 min ago"],
  ["7b0e441", 1, "sw: store misses in images-v1", "40 min ago"],
  ["c1d8e90", 1, "sw: precache the app shell", "2 hours ago"],
  ["5e27ab3", 0, "chore: bump chrome-for-testing", "yesterday"],
  ["9fa0c15", 0, "feat: grid colspan and rowspan", "yesterday"],
];
const ROW = 26;

console.log(div(label("git log --graph"),
  div({ position: "relative", width: "450px",
        height: (commits.length * ROW) + "px" },
    vline(0, 13, 13 + 3 * ROW),
    vline(1, 13 + ROW, 13 + 2 * ROW),
    merge(13, 13 + ROW),
    ...commits.map(([sha, lane, subject, when], i) => div({},
      dot(lane, 13 + i * ROW, i > 0),
      div({ position: "absolute", left: "62px", top: (3 + i * ROW) + "px",
            right: "0", display: "grid",
            gridTemplateColumns: "62px 1fr auto", gap: "10px",
            fontSize: "11px", lineHeight: "18px" },
        span({ fontFamily: "ui-monospace, monospace", color: "#8957e5" }, sha),
        span({ color: "#24292f", overflow: "hidden",
               whiteSpace: "nowrap" }, subject),
        span({ color: "#8a8a8a" }, when)))),
  )));
```

</details>

## Sequence diagram

Arrowheads are clip-path triangles; a self-call is three borders and one rounded corner.

![](images/gallery/sequence-diagram.png?framed)

<details>
<summary>Code</summary>

```js
const { div } = consolepro;

const label = (t) => div({ fontSize: "10px", color: "#8a8a8a",
  textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "7px" }, t);

// Three rules the drawing leans on, each learned the hard way:
//   · a stroke is a whole number of pixels. Chrome rounds a fractional
//     border width down but keeps a fractional height, so border: 1.5px and
//     height: 1.5px are different thicknesses where they meet.
//   · a line stops where its arrowhead starts, or it runs on to the apex and
//     blunts the point with a flat stub.
//   · a rounded corner needs a border on both its sides. A radius with only
//     one tapers that border away to nothing instead of turning.
const LANE = [46, 190, 330];
const INK = "#5b6472";
const BAR = 2;              // stroke width
const HEAD = 7;             // arrowhead length
const TURN = 4;             // corner radius
const SELF_W = 26, SELF_H = 18;

const actor = (name, x, tint) => div({ position: "absolute", left: x + "px",
  top: "0", transform: "translateX(-50%)", background: tint, color: "white",
  fontSize: "10px", fontWeight: "bold", padding: "2px 9px",
  borderRadius: "3px", whiteSpace: "nowrap" }, name);

const lifeline = (x) => div({ position: "absolute", left: x + "px", top: "20px",
  bottom: "0", borderLeft: "1px dashed #ccd3dc" });

const stroke = (left, right, top) => div({ position: "absolute",
  left: left + "px", right: right + "px", top: top + "px",
  height: BAR + "px", background: INK });

// Centred on the line it caps: "top" on an absolute child is measured from
// the parent's padding box, which starts below any border.
const arrowhead = (x, y, dir) => div({ position: "absolute",
  left: x + "px", top: y + "px",
  transform: "translate(" + (dir > 0 ? "-100%" : "0") + ", -50%)",
  width: HEAD + "px", height: HEAD + "px", background: INK,
  clipPath: dir > 0 ? "polygon(0 0, 100% 50%, 0 100%)"
                    : "polygon(100% 0, 0 50%, 100% 100%)" });

const caption = (attributes, text) => div({ fontSize: "10px", color: INK,
  position: "absolute", ...attributes }, text);

const arrow = (from, to, y, text) => {
  const a = LANE[from], b = LANE[to], rightwards = b > a;
  const width = Math.abs(b - a);
  return div({ position: "absolute", top: y + "px",
      left: Math.min(a, b) + "px", width: width + "px", height: BAR + "px" },
    stroke(rightwards ? 0 : HEAD, rightwards ? HEAD : 0, 0),
    arrowhead(rightwards ? width : 0, BAR / 2, rightwards ? 1 : -1),
    caption({ bottom: "5px", left: "0", right: "0", textAlign: "center" }, text));
};

const selfCall = (lane, y, text) => div({ position: "absolute",
    left: LANE[lane] + "px", top: y + "px",
    width: SELF_W + "px", height: SELF_H + "px" },
  stroke(0, SELF_W - HEAD, 0),
  div({ position: "absolute", left: HEAD + "px", right: "0", top: "0",
        bottom: "0", boxSizing: "border-box",
        borderTop: BAR + "px solid " + INK,
        borderRight: BAR + "px solid " + INK,
        borderBottom: BAR + "px solid " + INK,
        borderTopRightRadius: TURN + "px",
        borderBottomRightRadius: TURN + "px" }),
  arrowhead(0, SELF_H - BAR / 2, -1),
  caption({ left: (SELF_W + 8) + "px", top: "2px", whiteSpace: "nowrap" }, text));

console.log(div(label("fetch /img/dog.svg · 214ms"),
  div({ position: "relative", width: "560px", height: "210px",
        fontFamily: "ui-monospace, monospace" },
    actor("page", LANE[0], "#2980b9"), actor("sw", LANE[1], "#8e44ad"),
    actor("cdn", LANE[2], "#16a085"),
    ...LANE.map(lifeline),
    arrow(0, 1, 46, "fetch()"),
    selfCall(1, 66, "caches.match() → miss"),
    arrow(1, 2, 106, "fetch(request)"),
    arrow(2, 1, 142, "200 · 174ms"),
    selfCall(1, 158, "cache.put()"),
    arrow(1, 0, 198, "response"),
  )));
```

</details>

## Experiment results

Means as dots, 95% intervals as bars, coloured by whether they clear zero.

![](images/gallery/experiment-results.png?framed)

<details>
<summary>Code</summary>

```js
const { div } = consolepro;

const label = (t) => div({ fontSize: "10px", color: "#8a8a8a",
  textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "7px" }, t);

const LO = -8, HI = 12, W = 420;
const at = (v) => ((v - LO) / (HI - LO)) * W;
const variants = [
  { name: "control", mean: 0, lo: 0, hi: 0 },
  { name: "B · one-page checkout", mean: 4.2, lo: 1.1, hi: 7.3 },
  { name: "C · saved cards", mean: 6.8, lo: 3.9, hi: 9.7 },
  { name: "D · guest by default", mean: -1.8, lo: -5.0, hi: 1.4 },
];
const verdict = (v) => v.lo > 0 ? "#1a7f37" : v.hi < 0 ? "#cf222e" : "#8a8a8a";

console.log(div(label("conversion lift · 95% ci"),
  ...variants.map((v) => div({ display: "grid",
      gridTemplateColumns: "150px 1fr 64px", alignItems: "center",
      height: "26px", fontSize: "11px" },
    div({ color: "#5b6472", whiteSpace: "nowrap", overflow: "hidden" }, v.name),
    div({ position: "relative", height: "26px", width: W + "px" },
      div({ position: "absolute", left: at(0) + "px", top: "0", bottom: "0",
            borderLeft: "1px solid #c8ccd2" }),
      v.lo === v.hi ? null : div({ position: "absolute", top: "12px",
        left: at(v.lo) + "px", width: (at(v.hi) - at(v.lo)) + "px",
        height: "3px", borderRadius: "2px", background: verdict(v),
        opacity: "0.3" }),
      div({ position: "absolute", top: "8px", left: (at(v.mean) - 5) + "px",
            width: "11px", height: "11px", borderRadius: "50%",
            background: verdict(v), border: "2px solid white",
            boxSizing: "border-box", boxShadow: "0 0 0 1px " + verdict(v) })),
    div({ textAlign: "right", color: verdict(v), fontWeight: "bold",
          fontFamily: "ui-monospace, monospace" },
      (v.mean > 0 ? "+" : "") + v.mean.toFixed(1) + "%"))),
  div({ display: "grid", gridTemplateColumns: "150px 1fr 64px",
        fontSize: "9px", color: "#aab2bd", marginTop: "2px" },
    div(), div({ position: "relative", width: W + "px", height: "12px" },
      ...[-5, 0, 5, 10].map((v) => div({ position: "absolute",
        left: at(v) + "px", transform: "translateX(-50%)" },
        (v > 0 ? "+" : "") + v + "%"))), div()),
));
```

</details>

## Box model

Four nested rings, each with its values on its own edges.

![](images/gallery/box-model.png?framed)

<details>
<summary>Code</summary>

```js
const { div } = consolepro;

const label = (t) => div({ fontSize: "10px", color: "#8a8a8a",
  textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "7px" }, t);

const edge = (side, v) => div({ position: "absolute",
  ...(side === "top" ? { top: "2px", left: "0", right: "0", textAlign: "center" } : {}),
  ...(side === "bottom" ? { bottom: "2px", left: "0", right: "0", textAlign: "center" } : {}),
  ...(side === "left" ? { left: "3px", top: "50%", transform: "translateY(-50%)" } : {}),
  ...(side === "right" ? { right: "3px", top: "50%", transform: "translateY(-50%)" } : {}),
  fontSize: "9px", color: "#5b4a2f" }, v);

const ring = (name, tint, pad, values, child) => div({ background: tint,
    padding: pad, position: "relative", border: "1px solid rgba(0,0,0,.12)",
    fontFamily: "ui-monospace, monospace" },
  div({ position: "absolute", top: "2px", left: "4px", fontSize: "9px",
        color: "#6b5a3c", fontWeight: "bold" }, name),
  ...["top", "right", "bottom", "left"].map((s, i) => edge(s, values[i])),
  child);

console.log(div(label("div.card · box model"),
  div({ display: "inline-block" },
    ring("margin", "#f9cc9d", "22px", ["16", "auto", "16", "auto"],
      ring("border", "#fdd28c", "18px", ["1", "1", "1", "1"],
        ring("padding", "#c3d08b", "18px", ["12", "20", "12", "20"],
          div({ background: "#8bb7cd", padding: "20px 26px", textAlign: "center",
                border: "1px solid rgba(0,0,0,.12)", fontSize: "11px",
                color: "#20323c", fontFamily: "ui-monospace, monospace" },
            "320 × 180")))))));
```

</details>

## Audio waveform

Canvas: mirrored bars, a tinted selection, a playhead with a triangle cap.

![](images/gallery/audio-waveform.png?framed)

<details>
<summary>Code</summary>

```js
const { div } = consolepro;

const label = (t) => div({ fontSize: "10px", color: "#8a8a8a",
  textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "7px" }, t);

const c = document.createElement("canvas");
c.width = 880; c.height = 140;
const g = c.getContext("2d");
g.scale(2, 2);
const N = 146, MID = 35;
const amp = (i) => {
  const t = i / N;
  const env = Math.sin(t * Math.PI) * (0.55 + 0.45 * Math.sin(t * 19));
  return Math.max(0.04, Math.abs(env) * (0.5 + 0.5 * Math.abs(Math.sin(i * 2.7))));
};
const SEL = [42, 96];
g.fillStyle = "#eaf2fb";
g.fillRect(SEL[0] * 3, 0, (SEL[1] - SEL[0]) * 3, 70);
for (let i = 0; i < N; i++) {
  const h = amp(i) * 30;
  const inSel = i >= SEL[0] && i <= SEL[1];
  g.fillStyle = inSel ? "#2f7fd4" : "#b9c4d0";
  g.fillRect(i * 3, MID - h, 2, h * 2);
}
g.strokeStyle = "#c0392b"; g.lineWidth = 1.5;
g.beginPath(); g.moveTo(70 * 3, 0); g.lineTo(70 * 3, 70); g.stroke();
g.fillStyle = "#c0392b";
g.beginPath(); g.moveTo(70 * 3 - 4, 0); g.lineTo(70 * 3 + 4, 0);
g.lineTo(70 * 3, 6); g.closePath(); g.fill();

console.log(div(label("intro.mp3 · 0:12 selected"),
  div({ width: "440px", height: "70px", borderRadius: "4px",
        border: "1px solid #d7dce2", overflow: "hidden",
        backgroundImage: 'url("' + c.toDataURL() + '")',
        backgroundSize: "440px 70px" }),
  div({ display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
        width: "440px", fontSize: "9px", color: "#aab2bd", marginTop: "3px" },
    ...["0:00", "0:11", "0:22", "0:33"].map((t) => div(t))),
));
```

</details>

## Railroad diagram

An optional branch is an arc that leaves the line and rejoins it.

![](images/gallery/railroad-diagram.png?framed)

<details>
<summary>Code</summary>

```js
const { div, span } = consolepro;

const label = (t) => div({ fontSize: "10px", color: "#8a8a8a",
  textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "9px" }, t);

const LINE = "#b6bec9";
// Whole pixels: a fractional border and a fractional height round
// differently, so a border-drawn arc and an element-drawn track would meet
// at a step.
const BAR = 2;
const ARC = 22;   // how far a branch leaves the line — it has to clear
const TURN = 10;

const node = (t, kind) => div({ padding: "3px 9px",
  borderRadius: kind === "class" ? "11px" : "3px",
  border: BAR + "px solid " + (kind === "class" ? "#8e44ad" : "#2980b9"),
  background: "white", fontFamily: "ui-monospace, monospace",
  fontSize: "11px", color: "#24292f", whiteSpace: "nowrap" }, t);
const track = (w) => div({ width: w + "px", height: BAR + "px",
  background: LINE });
const cap = () => div({ width: "7px", height: "7px", borderRadius: "50%",
  background: LINE });

// The arc's legs stop at 50%, which is where the track runs, and the
// wrapper carries no padding — the line would break either side of it.
const branch = (child, { below = false, times = null } = {}) => {
  const side = below
    ? { top: "50%", borderBottom: BAR + "px solid " + LINE,
        borderBottomLeftRadius: TURN + "px",
        borderBottomRightRadius: TURN + "px" }
    : { bottom: "50%", borderTop: BAR + "px solid " + LINE,
        borderTopLeftRadius: TURN + "px", borderTopRightRadius: TURN + "px" };
  return div({ position: "relative", display: "flex", alignItems: "center" },
    div({ position: "absolute", left: "0", right: "0", height: ARC + "px",
          boxSizing: "border-box", borderLeft: BAR + "px solid " + LINE,
          borderRight: BAR + "px solid " + LINE, ...side },
      times == null ? null : div({ position: "absolute", bottom: "-7px",
        left: "0", right: "0", textAlign: "center" },
        span({ fontSize: "9px", color: "#8a8a8a", background: "#fdfdfd",
               padding: "0 4px" }, times))),
    track(18), child, track(18));
};

const plain = (t) => div({ fontSize: "11px", color: "#8a8a8a",
  fontFamily: "ui-monospace, monospace", marginBottom: "9px" }, t);
console.log(div(plain("/^(https?):\\/\\/([\\w.-]+)(\\/\\S*)?$/"),
  div({ display: "flex", alignItems: "center", padding: "26px 0 34px" },
    cap(), track(12),
    node("https?", "class"), track(12),
    node("://"), track(12),
    branch(node("[\\w.-]", "class"), { below: true, times: "1+" }), track(12),
    branch(node("/\\S*")), track(12),
    cap())));
```

</details>

## Query plan

Depth as indentation, cost as a bar on one shared scale.

![](images/gallery/query-plan.png?framed)

<details>
<summary>Code</summary>

```js
const { div, span } = consolepro;

const label = (t) => div({ fontSize: "10px", color: "#8a8a8a",
  textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "9px" }, t);

const plan = [
  [0, "Sort", "orders.created_at DESC", 1240, 18.4],
  [1, "Hash Join", "users.id = orders.user_id", 1240, 14.1],
  [2, "Seq Scan", "orders", 4200, 6.2],
  [2, "Hash", "", 300, 3.1],
  [3, "Index Scan", "users_pkey", 300, 1.9],
];
const SLOW = 18.4;
console.log(div(label("explain analyze · 18.4ms"),
  div({ fontFamily: "ui-monospace, monospace", fontSize: "11px" },
    ...plan.map(([d, op, detail, rows, ms]) => div({ display: "grid",
        gridTemplateColumns: "1fr 92px 96px", alignItems: "center",
        height: "21px", borderBottom: "1px solid #f0f2f5" },
      div({ whiteSpace: "nowrap", overflow: "hidden" },
        span({ color: "#c8ccd2", whiteSpace: "pre" },
          "   ".repeat(d) + (d ? "└─ " : "")),
        span({ fontWeight: "bold", color: "#24292f" }, op),
        detail === "" ? null : span({ color: "#8a8a8a" }, "  " + detail)),
      div({ textAlign: "right", color: "#5b6472", paddingRight: "10px" },
        rows.toLocaleString() + " rows"),
      div({ position: "relative", height: "12px", background: "#f0f2f5",
            borderRadius: "2px" },
        div({ position: "absolute", left: "0", top: "0", bottom: "0",
              width: (ms / SLOW * 100) + "%", borderRadius: "2px",
              background: ms / SLOW > 0.6 ? "#e8590c" : "#f5a524" }),
        div({ position: "absolute", right: "5px", top: "0", bottom: "0",
              display: "flex", alignItems: "center",
              paddingTop: "2px", boxSizing: "border-box", lineHeight: "1",
              fontSize: "9px", color: "#3d2600" }, ms + "ms")))))));
```

</details>

## Retainer path

Why an object is still alive, with the leak flagged.

![](images/gallery/retainer-path.png?framed)

<details>
<summary>Code</summary>

```js
const { div, span } = consolepro;

const label = (t) => div({ fontSize: "10px", color: "#8a8a8a",
  textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "9px" }, t);

const chain = [
  ["Window", "window", "—", false],
  ["Object", "appState", "12 kB", false],
  ["Map", "appState.tiles", "4.3 MB", false],
  ["Array", "entry[1]", "4.2 MB", false],
  ["HTMLCanvasElement", "tile #482", "4.2 MB", true],
];
const link = () => div({ width: "2px", height: "13px", background: "#c8ccd2",
  marginLeft: "22px", position: "relative" },
  div({ position: "absolute", bottom: "-1px", left: "-3px", width: "8px",
        height: "8px", background: "#c8ccd2",
        clipPath: "polygon(50% 100%, 0 0, 100% 0)" }));

console.log(div(label("retainers of tile #482 · 4.2 MB"),
  ...chain.flatMap(([type, name, size, leak], i) => [
    i === 0 ? null : link(),
    div({ display: "inline-grid", gridTemplateColumns: "auto 1fr auto",
          alignItems: "center", gap: "9px", width: "420px",
          border: "1px solid " + (leak ? "#f0b6b0" : "#dfe3e8"),
          background: leak ? "#fff5f4" : "white",
          borderRadius: "5px", padding: "5px 10px",
          fontFamily: "ui-monospace, monospace", fontSize: "11px" },
      span({ color: "white", background: leak ? "#c0392b" : "#8a94a1",
             borderRadius: "3px", fontSize: "10px", fontWeight: "bold",
             // More above than below: the type names have no descenders, so
             // the ink sits high in a line box padded evenly.
             lineHeight: "1", padding: "3px 6px 1px" }, type),
      span({ color: "#5b6472" }, name),
      span({ color: leak ? "#c0392b" : "#8a8a8a",
             fontWeight: leak ? "bold" : "normal" }, size)),
  ])));
```

</details>

## Colour palette

Computes WCAG contrast from the hex and grades itself.

![](images/gallery/colour-palette.png?framed)

<details>
<summary>Code</summary>

```js
const { div, span } = consolepro;

const label = (t) => div({ fontSize: "10px", color: "#8a8a8a",
  textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "9px" }, t);

const luminance = (hex) => {
  const v = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
};
const ratio = (hex, other) => {
  const a = luminance(hex), b = other === "white" ? 1 : 0;
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};
// 4.5:1 is the bar for body text, 3:1 only for large text — so the middle
// band is weaker than AA, not better than it.
const grade = (r) => r >= 7 ? "AAA" : r >= 4.5 ? "AA" : r >= 3 ? "AA lg" : "fail";
const chip = (r) => span({ fontSize: "9px", fontWeight: "bold",
  borderRadius: "3px", lineHeight: "1", padding: "3px 4px 2px",
  background: r >= 4.5 ? "#e6ffec" : r >= 3 ? "#fff8c5" : "#ffebe9",
  color: r >= 4.5 ? "#1a7f37" : r >= 3 ? "#7d4e00" : "#cf222e" }, grade(r));

const reading = (caption, r) => div({ display: "flex",
    justifyContent: "space-between", alignItems: "center",
    gap: "6px", marginTop: "4px", whiteSpace: "nowrap" },
  span(caption),
  span({ display: "flex", alignItems: "center", gap: "5px" },
    span({ color: "#98a1ae" }, r.toFixed(1)), chip(r)));

const swatch = (name, hex) => {
  const onWhite = ratio(hex, "white"), onBlack = ratio(hex, "black");
  return div({ border: "1px solid #e3e8ee", borderRadius: "6px",
      overflow: "hidden" },
    div({ background: hex, height: "46px", display: "grid",
          placeItems: "center", color: onBlack > onWhite ? "#000" : "#fff",
          fontFamily: "ui-monospace, monospace", fontSize: "11px" }, hex),
    div({ padding: "6px 8px", fontSize: "10px", color: "#5b6472" },
      div({ fontWeight: "bold" }, name),
      div({ color: "#98a1ae", fontSize: "9px" }, "as text, against"),
      reading("white", onWhite),
      reading("black", onBlack)));
};

console.log(div(label("brand palette · wcag · lg = large text only"),
  div({ display: "grid", gridTemplateColumns: "repeat(3, 172px)", gap: "10px" },
    swatch("primary", "#2980b9"), swatch("success", "#1a7f37"),
    swatch("warning", "#f5a524"), swatch("danger", "#c0392b"),
    swatch("muted", "#95a0b3"))));
```

</details>

## Compositing layers

perspective on the parent, translateZ on each layer, and a layer is however many rectangles it actually covers.

![](images/gallery/compositing-layers.png?framed)

<details>
<summary>Code</summary>

```js
const { div, span } = consolepro;

const label = (t) => div({ fontSize: "10px", color: "#8a8a8a",
  textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "10px" }, t);

const layers = [
  { name: "#page", tint: "#dbe7f3", size: "2.1 MB", rects: [[0, 0, 230, 130]] },
  { name: "header (sticky)", tint: "#cfe3d4", size: "180 kB",
    rects: [[0, 0, 230, 20]] },
  { name: ".card (will-change)", tint: "#f3e4cf", size: "340 kB",
    rects: [[12, 84, 64, 40], [83, 84, 64, 40], [154, 84, 64, 40]] },
  { name: ".modal", tint: "#e6dcf3", size: "620 kB", rects: [[36, 44, 148, 74]] },
  { name: "video (promoted)", tint: "#f6d3d3", size: "8.2 MB",
    rects: [[54, 56, 90, 40]] },
];

const plane = (tint) => ([x, y, w, h]) => div({ position: "absolute",
  left: x + "px", top: y + "px", width: w + "px", height: h + "px",
  background: tint, border: "1px solid rgba(0,0,0,.22)",
  boxShadow: "0 10px 18px rgba(0,0,0,.12)" });

const stack = div({ perspective: "900px", width: "330px", height: "215px" },
  div({ position: "relative", height: "100%", transformStyle: "preserve-3d",
        transform: "rotateX(54deg) rotateZ(-32deg)" },
    ...layers.map((layer, i) => div({ position: "absolute",
        left: "40px", top: "40px", width: "230px", height: "130px",
        transform: "translateZ(" + i * 28 + "px)" },
      ...layer.rects.map(plane(layer.tint))))));

// A console message is only as wide as its content, so 1fr has nothing to
// divide unless the legend is given a width.
const legend = div({ width: "205px", display: "grid",
    gridTemplateColumns: "auto 1fr auto", gap: "4px 8px", alignItems: "center",
    fontSize: "10px", fontFamily: "ui-monospace, monospace", color: "#2c3540" },
  ...layers.slice().reverse().flatMap(({ name, tint, size, rects }) => [
    div({ width: "9px", height: "9px", background: tint, borderRadius: "2px",
          border: "1px solid rgba(0,0,0,.25)" }),
    div({ whiteSpace: "nowrap" }, name, rects.length > 1
      ? span({ color: "#98a1ae" }, " ×" + rects.length) : null),
    div({ color: "#6b7480" }, size),
  ]));

console.log(div(label("compositing layers · " + layers.length),
  div({ display: "flex", alignItems: "center", gap: "14px" }, stack, legend)));
```

</details>

## Coverage ribbons

One linear-gradient with hard stops at the executed byte ranges. Note the explicit width: a console message shrinks to its content, so 1fr has nothing to expand into.

![](images/gallery/coverage-ribbons.png?framed)

<details>
<summary>Code</summary>

```js
const { div } = consolepro;

const label = (t) => div({ fontSize: "10px", color: "#8a8a8a",
  textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "10px" }, t);

const ranges = [[0, 18], [26, 41], [58, 63], [72, 100]];
const stops = [];
let at = 0;
for (const [from, to] of ranges) {
  if (from > at) stops.push("#e9ecef " + at + "%", "#e9ecef " + from + "%");
  stops.push("#2f9e44 " + from + "%", "#2f9e44 " + to + "%");
  at = to;
}
if (at < 100) stops.push("#e9ecef " + at + "%", "#e9ecef 100%");

const ribbon = (name, gradient, used) => div({ display: "grid",
    gridTemplateColumns: "150px 1fr 52px", alignItems: "center",
    gap: "10px", height: "24px", fontSize: "11px", width: "470px" },
  div({ fontFamily: "ui-monospace, monospace", color: "#5b6472",
        whiteSpace: "nowrap", overflow: "hidden" }, name),
  div({ height: "11px", borderRadius: "3px",
        background: "linear-gradient(to right, " + gradient + ")" }),
  div({ textAlign: "right", fontFamily: "ui-monospace, monospace",
        color: used < 50 ? "#c0392b" : "#1a7f37" }, used + "%"));

console.log(div(label("code coverage · 4 files"),
  ribbon("app.js", stops.join(", "), 57),
  ribbon("vendor.js", "#e9ecef 0%, #e9ecef 8%, #2f9e44 8%, #2f9e44 22%, #e9ecef 22%, #e9ecef 100%", 14),
  ribbon("router.js", "#2f9e44 0%, #2f9e44 74%, #e9ecef 74%, #e9ecef 100%", 74),
  ribbon("analytics.js", "#e9ecef 0%, #e9ecef 100%", 0)));
```

</details>

## Filmstrip

Paint progress with the web-vitals marks underneath.

![](images/gallery/filmstrip.png?framed)

<details>
<summary>Code</summary>

```js
const { div } = consolepro;

const label = (t) => div({ fontSize: "10px", color: "#8a8a8a",
  textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "10px" }, t);

const frames = [
  ["0ms", "#f1f3f5", ""],
  ["180ms", "linear-gradient(#dfe6ee 0 34%, #f1f3f5 34%)", "fp"],
  ["420ms", "linear-gradient(#dfe6ee 0 34%, #cdd8e4 34% 62%, #f1f3f5 62%)", "fcp"],
  ["980ms", "linear-gradient(#dfe6ee 0 34%, #b6c7da 34% 62%, #e3e9f0 62%)", "lcp"],
  ["1.4s", "linear-gradient(#dfe6ee 0 34%, #b6c7da 34% 62%, #dbe4ed 62%)", ""],
];
console.log(div(label("filmstrip · lcp at 980ms"),
  div({ display: "flex", gap: "8px" },
    ...frames.map(([t, bg, mark]) => div({},
      div({ width: "78px", height: "56px", background: bg,
            border: "1px solid #d7dce2", borderRadius: "3px" }),
      div({ fontSize: "9px", color: "#8a8a8a", marginTop: "4px",
            textAlign: "center", fontFamily: "ui-monospace, monospace" }, t),
      mark === "" ? null : div({ fontSize: "9px", fontWeight: "bold",
        textAlign: "center", marginTop: "2px",
        color: mark === "lcp" ? "#c0392b" : "#1a7f37" }, mark.toUpperCase()))))));
```

</details>

## State machine

The reset edge is two strokes and one rounded corner; the active state carries a shadow ring.

![](images/gallery/state-machine.png?framed)

<details>
<summary>Code</summary>

```js
const { div } = consolepro;

const label = (t) => div({ fontSize: "10px", color: "#8a8a8a",
  textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "10px" }, t);

const INK = "#8a94a1";
const BAR = 2;              // stroke width
const HEAD = 7;             // arrowhead length
const TURN = 5;             // corner radius
const GAP = 5;              // breathing room between an edge and a state
const LABEL = 8;            // gap between a stroke and its label
const TEXT = 12;            // the line box of 10px text

const STATES = {
  idle:    { x: 60,  y: 40,  w: 70 },
  loading: { x: 222, y: 40,  w: 96, active: true },
  ready:   { x: 390, y: 40,  w: 78 },
  error:   { x: 222, y: 140, w: 78 },
};
const H = 26;
const left = (s) => s.x - s.w / 2, right = (s) => s.x + s.w / 2;
const top = (s) => s.y - H / 2, bottom = (s) => s.y + H / 2;

const state = (name, { x, y, w, active }) => div({ position: "absolute",
  left: (x - w / 2) + "px", top: (y - H / 2) + "px",
  width: w + "px", height: H + "px", boxSizing: "border-box",
  borderRadius: (H / 2) + "px", border: "2px solid " + (active ? "#2980b9" : "#c8ccd2"),
  background: active ? "#2980b9" : "white",
  color: active ? "white" : "#5b6472", fontWeight: "bold",
  fontFamily: "ui-monospace, monospace", fontSize: "11px",
  lineHeight: (H - 4) + "px", textAlign: "center" }, name);

// Same two rules as the sequence diagram: a line stops where its arrowhead
// starts, and a rounded corner needs a stroke on both of its sides.
const APEX = {
  right: ["translate(-100%, -50%)", "polygon(0 0, 100% 50%, 0 100%)"],
  down: ["translate(-50%, -100%)", "polygon(0 0, 100% 0, 50% 100%)"],
  up: ["translate(-50%, 0)", "polygon(50% 0, 100% 100%, 0 100%)"],
};
const head = (x, y, dir) => div({ position: "absolute",
  left: x + "px", top: y + "px", width: HEAD + "px", height: HEAD + "px",
  background: INK, transform: APEX[dir][0], clipPath: APEX[dir][1] });

const stroke = (x, y, w, h) => div({ position: "absolute", left: x + "px",
  top: y + "px", width: w + "px", height: h + "px", background: INK });

const caption = (attributes, text) => div({ position: "absolute",
  fontSize: "10px", color: "#6b7480", whiteSpace: "nowrap", ...attributes }, text);

const along = (x1, x2, cy, side) => ({ left: x1 + "px", width: (x2 - x1) + "px",
  textAlign: "center", top: (side < 0 ? cy - BAR / 2 - LABEL - TEXT
                                      : cy + BAR / 2 + LABEL) + "px" });

const beside = (cx, y1, y2, side) => ({
  top: ((y1 + y2) / 2 - TEXT / 2) + "px",
  ...(side < 0
    ? { left: (cx - BAR / 2 - LABEL - 60) + "px", width: "60px", textAlign: "right" }
    : { left: (cx + BAR / 2 + LABEL) + "px" }) });

const hEdge = (x1, x2, cy, text) => div(
  stroke(x1, cy - BAR / 2, x2 - HEAD - x1, BAR),
  head(x2, cy, "right"),
  caption(along(x1, x2, cy, -1), text));

const vEdge = (cx, y1, y2, text, side) => {
  const down = y2 > y1;
  const from = down ? y1 : y2 + HEAD, to = down ? y2 - HEAD : y1;
  return div(
    stroke(cx - BAR / 2, from, BAR, to - from),
    head(cx, y2, down ? "down" : "up"),
    text == null ? null : caption(beside(cx, y1, y2, side), text));
};

const S = STATES;
const resetRun = [S.idle.x + BAR / 2 + TURN, left(S.error) - GAP];

console.log(div(label("upload machine · loading"),
  div({ position: "relative", width: "470px", height: "170px" },
    hEdge(right(S.idle) + GAP, left(S.loading) - GAP, S.idle.y, "start"),
    hEdge(right(S.loading) + GAP, left(S.ready) - GAP, S.ready.y, "done"),
    vEdge(S.error.x + 12, bottom(S.loading) + GAP, top(S.error) - GAP, "fail", 1),
    vEdge(S.error.x - 12, top(S.error) - GAP, bottom(S.loading) + GAP, "retry", -1),

    // reset: out of error's left side, along the bottom, and up into idle.
    stroke(resetRun[0], S.error.y - BAR / 2, resetRun[1] - resetRun[0], BAR),
    div({ position: "absolute", left: (S.idle.x - BAR / 2) + "px",
          top: (S.error.y - BAR / 2 - TURN) + "px",
          width: (TURN + BAR) + "px", height: (TURN + BAR) + "px",
          boxSizing: "border-box", borderLeft: BAR + "px solid " + INK,
          borderBottom: BAR + "px solid " + INK,
          borderBottomLeftRadius: TURN + "px" }),
    vEdge(S.idle.x, S.error.y - BAR / 2 - TURN, bottom(S.idle) + GAP),
    caption(along(resetRun[0], resetRun[1], S.error.y, 1), "reset"),

    ...Object.entries(S).map(([name, s]) => state(name, s)))));
```

</details>

## Font specimen

Canvas measures the real font, and the rules are placed over live HTML text at those offsets.

![](images/gallery/font-specimen.png?framed)

<details>
<summary>Code</summary>

```js
const { div } = consolepro;

const label = (t) => div({ fontSize: "10px", color: "#8a8a8a",
  textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "10px" }, t);

const FONT = '44px Georgia, serif';
const g = document.createElement("canvas").getContext("2d");
g.font = FONT;
const m = g.measureText("Hxg");
const emAscent = m.fontBoundingBoxAscent, emDescent = m.fontBoundingBoxDescent;
const box = emAscent + emDescent;
const baseline = (emAscent / box) * 44;
const capTop = baseline - g.measureText("H").actualBoundingBoxAscent;
const xTop = baseline - g.measureText("x").actualBoundingBoxAscent;
const descBottom = baseline + g.measureText("g").actualBoundingBoxDescent;

const rule = (y, tint, name) => div({ position: "absolute", left: "0",
    right: "0", top: y + "px", borderTop: "1px dashed " + tint },
  div({ position: "absolute", right: "0", top: "-13px", fontSize: "9px",
        color: tint, background: "#fdfdfd", padding: "0 3px" }, name));

console.log(div(label("georgia · 44px"),
  div({ position: "relative", width: "420px", paddingTop: "14px",
        paddingBottom: "14px" },
    div({ position: "relative", height: "44px" },
      div({ fontFamily: "Georgia, serif", fontSize: "44px", lineHeight: "1",
            color: "#24292f" }, "Hamburgefontsiv"),
      rule(0, "#c8ccd2", "em top"),
      rule(capTop, "#2980b9", "cap"),
      rule(xTop, "#16a085", "x-height"),
      rule(baseline, "#c0392b", "baseline"),
      rule(descBottom, "#8e44ad", "descender")))));
```

</details>

## Grid overlay

Numbered line badges, a dashed outline with outline-offset, and the track sizes underneath.

![](images/gallery/grid-overlay.png?framed)

<details>
<summary>Code</summary>

```js
const { div } = consolepro;

const label = (t) => div({ fontSize: "10px", color: "#8a8a8a",
  textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "10px" }, t);

const COLS = [1, 2, 1.4], ROWS = [46, 64];
const SIZES = ["1fr", "2fr", "1.4fr"];
const cellOf = (r, c, name, tint) => div({ background: tint,
  border: "1px solid rgba(0,0,0,.08)", borderRadius: "3px",
  display: "grid", placeItems: "center", fontSize: "10px",
  fontFamily: "ui-monospace, monospace", color: "#3a4450" }, name);

const number = (n, left, top) => div({ position: "absolute",
  left: left, top: top, transform: "translate(-50%, -50%)",
  background: "#8e44ad", color: "white", fontSize: "9px",
  borderRadius: "2px", padding: "0 4px", fontFamily: "ui-monospace, monospace" }, n);

console.log(div(label("grid overlay · 3 × 2"),
  div({ position: "relative", width: "380px", padding: "14px 0 0 0" },
    div({ display: "grid", gridTemplateColumns: "1fr 2fr 1.4fr",
          gridTemplateRows: "46px 64px", gap: "8px",
          outline: "1px dashed #8e44ad", outlineOffset: "3px" },
      cellOf(1, 1, "aside", "#eaf2fb"), cellOf(1, 2, "main", "#e8f6f1"),
      cellOf(1, 3, "ads", "#fdf1e3"),
      cellOf(2, 1, "nav", "#f2ecfa"), cellOf(2, 2, "article", "#e8f6f1"),
      cellOf(2, 3, "related", "#fdf1e3")),
    ...[["1", "0%"], ["2", "27%"], ["3", "68%"], ["4", "100%"]]
      .map(([n, x]) => number(n, x, "9px")),
    div({ display: "grid", gridTemplateColumns: "1fr 2fr 1.4fr", gap: "8px",
          marginTop: "6px", fontSize: "9px", color: "#8e44ad",
          fontFamily: "ui-monospace, monospace", textAlign: "center" },
      ...SIZES.map((s) => div(s))))));
```

</details>

## Sparkline table

Trend, colour and bar heights all derived from each row's own series.

![](images/gallery/sparkline-table.png?framed)

<details>
<summary>Code</summary>

```js
const { div, span, grid } = consolepro;

const label = (t) => div({ fontSize: "10px", color: "#8a8a8a",
  textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "10px" }, t);

const { row, cell } = grid;
const box = cell.extend({ padding: "4px 10px", background: "white",
  fontFamily: "ui-monospace, monospace", fontSize: "11px" });
const head_ = box.extend({ fontWeight: "bold", background: "#f5f7fa",
  color: "#6b7480", fontSize: "10px", textTransform: "uppercase",
  letterSpacing: "0.5px", lineHeight: "1", paddingTop: "7px",
  paddingBottom: "5px" });

const spark = (values, tint) => {
  const max = Math.max(...values);
  return div({ display: "grid", gridAutoFlow: "column",
      gridAutoColumns: "3px", gap: "1px", alignItems: "end",
      height: "16px" },
    ...values.map((v) => div({ height: Math.max(2, v / max * 16) + "px",
      background: tint, borderRadius: "1px" })));
};
const trend = (values) => {
  const delta = (values.at(-1) - values[0]) / values[0] * 100;
  const up = delta >= 0;
  return span({ color: up ? "#1a7f37" : "#cf222e", fontWeight: "bold" },
    (up ? "▲ " : "▼ ") + Math.abs(delta).toFixed(0) + "%");
};

const rows = [
  ["/", [82, 88, 91, 86, 95, 104, 112, 118]],
  ["/pricing", [41, 44, 39, 46, 52, 49, 58, 61]],
  ["/docs", [120, 118, 112, 99, 91, 86, 78, 71]],
  ["/blog", [12, 18, 31, 44, 39, 52, 68, 84]],
];

console.log(div(label("page views · last 8 weeks"),
  grid({ gap: "1px", background: "#e3e8ee", borderRadius: "6px",
         overflow: "hidden", border: "1px solid #dfe3e8",
         display: "grid", gridTemplateColumns: "120px 90px 1fr 60px" },
    row(head_("page"), head_("trend"), head_("last 8 weeks"),
        head_({ textAlign: "right" }, "now")),
    ...rows.map(([name, values]) => row(
      box(name),
      box(trend(values)),
      box(spark(values, values.at(-1) >= values[0] ? "#2f9e44" : "#cf222e")),
      box({ textAlign: "right", fontWeight: "bold" }, String(values.at(-1))))))));
```

</details>

## Service worker dashboard

A panel rather than a line: a conic-gradient donut, three figures on one baseline, and a table with the bars drawn into the cells.

![](images/gallery/service-worker-dashboard.png?framed)

<details>
<summary>Code</summary>

```js
const { div, span, grid } = consolepro;

const SLATE = "#3d4756", INK = "#1f2937", MUTED = "#98a1ae", LINE = "#e3e8ee";
const TEAL = "#0f9d76", BLUE = "#2f7fd4";
const { row, cell } = grid;

const dot = span({ display: "inline-block", width: "7px", height: "7px",
borderRadius: "50%", background: "#3ddc97", marginRight: "7px",
verticalAlign: "middle", boxShadow: "0 0 0 3px rgba(61,220,151,.25)" });

const caption = (t) => div({ fontSize: "9px", color: MUTED,
textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: "5px" }, t);

// A donut, drawn with a conic gradient and a white plug in the middle.
const donut = (percent, color) => div({
  width: "52px", height: "52px", borderRadius: "50%",
  background: "conic-gradient(" + color + " 0 " + percent + "%, #e9edf1 " + percent + "% 100%)",
  display: "grid", placeItems: "center" },
div({ width: "38px", height: "38px", borderRadius: "50%", background: "white",
      display: "grid", placeItems: "center",
      fontSize: "12px", fontWeight: "bold", color: INK }, percent + "%"),
);

const tile = (...children) => div({ padding: "10px 14px", background: "white",
display: "grid", alignContent: "center", justifyItems: "center",
textAlign: "center" }, ...children);
// Every tile's top block is the same height, so the captions below them
// land on one baseline however tall their contents are.
const slot = (child) => div({ height: "52px", display: "grid",
placeItems: "center" }, child);
const figure = (value, unit, color) =>
div({ fontSize: "25px", fontWeight: "bold", color, lineHeight: "1.1" },
  value, unit == null ? null : span({ fontSize: "13px", marginLeft: "1px" }, unit));

const box = cell.extend({ padding: "4px 11px", background: "white" });
// Uppercase leaves the descent space empty, so the caps ride high in the
// line box: more top padding than bottom is what centres them.
const head = box.extend({ fontWeight: "bold", background: "#f5f7fa",
                        color: "#6b7480", fontSize: "10px", lineHeight: "1",
                        paddingTop: "7px", paddingBottom: "5px",
                        textTransform: "uppercase", letterSpacing: "0.5px" });
const filled = (percent, tint) => ({
background: "linear-gradient(to right, " + tint + " " + percent + ", white " + percent + ")",
});

console.log(div({ display: "inline-block", background: "white",
                   borderRadius: "9px", overflow: "hidden", minWidth: "400px",
                   boxShadow: "0 2px 10px rgba(31,41,55,.18)" },

  div({ background: "linear-gradient(135deg, #3d4756, #55627a)",
        color: "white", padding: "7px 13px",
        display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center" },
    span(dot, span({ fontWeight: "bold", letterSpacing: "0.6px" }, "SERVICE WORKER")),
    span({ fontSize: "11px", color: "#b9c2d0" }, "v4 · active 4m"),
  ),

  div({ display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
        gap: "1px", background: LINE },
    tile(caption("hit rate"), slot(donut(94, TEAL))),
    tile(caption("requests"), slot(figure("312", null, SLATE))),
    tile(caption("served offline"), slot(figure("1.8", " MB", BLUE))),
  ),

  grid({ gap: "1px", background: LINE, borderTop: "1px solid " + LINE,
         display: "grid", // 4:1:1, two thirds then a sixth each.
         gridTemplateColumns: "4fr 1fr 1fr" },
    row(head("cache"), head("files"), head("size")),
    row(box("app-shell-v4"), box({ textAlign: "right" }, "12"),
        box({ textAlign: "right", ...filled("23%", "#e3edf9") }, "412 KB")),
    row(box("images-v1"), box({ textAlign: "right" }, "48"),
        box({ textAlign: "right", ...filled("78%", "#e3edf9") }, "1.4 MB")),
    row(box({ colspan: 3, background: "#f7f9fb", color: MUTED,
              fontSize: "11px" }, "60 files · 1.8 MB")),
  ),
));
```

</details>

## Header diff

Two objects in, classified same / changed / added at log time.

![](images/gallery/header-diff.png?framed)

<details>
<summary>Code</summary>

```js
const { div } = consolepro;

const label = (t) => div({ fontSize: "10px", color: "#8a8a8a",
  textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "10px" }, t);

const before = {
  "cache-control": "no-store",
  "content-encoding": "gzip",
  "content-type": "text/html; charset=utf-8",
  "server": "nginx/1.24",
  "x-cache": "MISS",
};
const after = {
  "cache-control": "public, max-age=3600, immutable",
  "content-encoding": "br",
  "content-type": "text/html; charset=utf-8",
  "server": "nginx/1.24",
  "x-cache": "HIT",
  "vary": "accept-encoding",
};

const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort();
const headerRow = (k) => {
  const a = before[k], b = after[k];
  const state = a === b ? "same" : a === undefined ? "added" : "changed";
  const tint = { same: "transparent", added: "#e6ffec", changed: "#fff8c5" }[state];
  return div({ display: "grid", gridTemplateColumns: "148px 1fr 1fr",
      gap: "10px", background: tint, padding: "2px 8px",
      fontFamily: "ui-monospace, monospace", fontSize: "11px",
      borderBottom: "1px solid #f0f2f5" },
    div({ color: "#6b7480" }, k),
    div({ color: state === "same" ? "#8a94a1" : "#cf222e",
          textDecoration: state === "changed" ? "line-through" : "none",
          whiteSpace: "nowrap", overflow: "hidden" }, a === undefined ? "—" : a),
    div({ color: state === "same" ? "#8a94a1" : "#1a7f37",
          whiteSpace: "nowrap", overflow: "hidden" }, b === undefined ? "—" : b));
};

console.log(div(label("response headers · before → after"),
  div({ width: "560px", border: "1px solid #dfe3e8", borderRadius: "6px",
        overflow: "hidden" },
    div({ display: "grid", gridTemplateColumns: "148px 1fr 1fr", gap: "10px",
          padding: "4px 8px", background: "#f5f7fa", fontSize: "10px",
          color: "#6b7480", textTransform: "uppercase",
          letterSpacing: "0.5px", fontWeight: "bold" },
      div("header"), div("before"), div("after")),
    ...keys.map(headerRow))));
```

</details>

## Interaction timeline

Bar size from duration; anything over 200ms labels itself in red. Absolutely-positioned children need an ancestor with real height, or they escape the box.

![](images/gallery/interaction-timeline.png?framed)

<details>
<summary>Code</summary>

```js
const { div, span } = consolepro;

const label = (t) => div({ fontSize: "10px", color: "#8a8a8a",
  textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "10px" }, t);

const events = [
  ["click", 120, 38, "#2980b9"], ["keydown", 380, 12, "#16a085"],
  ["keydown", 520, 9, "#16a085"], ["click", 900, 212, "#c0392b"],
  ["scroll", 1500, 22, "#8e44ad"], ["click", 2100, 46, "#2980b9"],
];
const SPAN = 2400;
console.log(div(label("interactions · inp 212ms"),
  div({ position: "relative", width: "520px", height: "80px" },
    div({ position: "absolute", left: "0", right: "0", top: "44px",
          borderTop: "1px solid #dfe3e8" }),
    // The wrapper needs a height, or "bottom" resolves against nothing and
    // the bars climb out of the timeline.
    ...events.map(([kind, t, dur, tint], i) => div({ position: "absolute",
        left: (t / SPAN * 100) + "%", top: "0", height: "80px" },
      div({ width: Math.max(3, dur / 7) + "px",
            height: Math.max(6, Math.min(30, dur / 7)) + "px",
            background: tint, borderRadius: "2px",
            position: "absolute", bottom: "36px", opacity: "0.85" }),
      div({ position: "absolute", top: "40px", width: "9px", height: "9px",
            marginLeft: "-3px", borderRadius: "50%", background: tint,
            border: "2px solid #fdfdfd", boxSizing: "border-box" }),
      div({ position: "absolute", top: (i % 2 ? "66px" : "54px"),
            marginLeft: "-3px",
            fontSize: "9px", color: "#8a94a1", whiteSpace: "nowrap",
            fontFamily: "ui-monospace, monospace" },
        dur > 200 ? span({ color: "#c0392b", fontWeight: "bold" }, dur + "ms")
                  : kind))))));
```

</details>

## Event loop trace

Tasks sized by duration against a frame budget drawn once.

![](images/gallery/event-loop-trace.png?framed)

<details>
<summary>Code</summary>

```js
const { div } = consolepro;

const label = (t) => div({ fontSize: "10px", color: "#8a8a8a",
  textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "10px" }, t);

const FRAME = 16.7, SPAN = 60;
const tasks = [
  ["render", 0, 5.2, "#2f7fd4"], ["timer", 5.2, 1.1, "#12a594"],
  ["parse JSON", 6.3, 21.4, "#c0392b"], ["style", 27.7, 3.1, "#8e44ad"],
  ["layout", 30.8, 4.4, "#f5a524"], ["paint", 35.2, 2.8, "#2f9e44"],
  ["idle", 38, 22, "#dfe3e8"],
];
console.log(div(label("event loop · 1 long task"),
  div({ position: "relative", width: "540px", height: "62px" },
    div({ position: "absolute", left: (FRAME / SPAN * 100) + "%", top: "0",
          bottom: "18px", borderLeft: "2px dashed #c0392b" },
      div({ position: "absolute", top: "-1px", left: "5px", fontSize: "9px",
            color: "#c0392b", fontWeight: "bold", whiteSpace: "nowrap" },
        "16.7ms budget")),
    div({ position: "absolute", left: "0", right: "0", top: "20px",
          height: "26px", display: "flex", borderRadius: "3px",
          overflow: "hidden" },
      ...tasks.map(([name, start, dur, tint]) => div({
          width: (dur / SPAN * 100) + "%", background: tint,
          borderRight: "1px solid rgba(255,255,255,.7)",
          display: "grid", placeItems: "center", overflow: "hidden",
          fontSize: "9px", color: tint === "#dfe3e8" ? "#8a94a1" : "white",
          fontFamily: "ui-monospace, monospace", whiteSpace: "nowrap" },
        dur > 3 ? name : "")),
    ),
    div({ position: "absolute", left: "0", right: "0", top: "50px",
          fontSize: "9px", color: "#8a94a1",
          fontFamily: "ui-monospace, monospace" },
      "parse JSON blocked for 21.4ms — 4.7ms over budget"))));
```

</details>

## Dependency graph

Edges trim to each node's box, so vertical and diagonal links work too. The cycle is traced in red.

![](images/gallery/dependency-graph.png?framed)

<details>
<summary>Code</summary>

```js
const { div } = consolepro;

const label = (t) => div({ fontSize: "10px", color: "#8a8a8a",
  textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "10px" }, t);

const NW = 50, NH = 13;   // half width, half height
const NODES = {
  "app.js":    [64, 26],  "router.js": [216, 26],  "store.js": [368, 26],
  "auth.js":   [64, 116], "api.js":    [216, 116], "utils.js": [368, 116],
};
const EDGES = [
  ["app.js", "router.js", true], ["router.js", "store.js", true],
  ["store.js", "api.js", true], ["api.js", "auth.js", true],
  ["auth.js", "app.js", true], ["api.js", "utils.js", false],
];
const CYCLE = new Set(["app.js", "router.js", "store.js", "api.js", "auth.js"]);

// Where the line leaves the box: the smaller of the two axis ratios.
const onEdge = (dx, dy) => {
  const t = Math.min(dx === 0 ? Infinity : NW / Math.abs(dx),
                     dy === 0 ? Infinity : NH / Math.abs(dy));
  return [dx * t, dy * t];
};

const edge = (from, to, bad) => {
  const [x1, y1] = NODES[from], [x2, y2] = NODES[to];
  const dx = x2 - x1, dy = y2 - y1;
  const [ox, oy] = onEdge(dx, dy);
  const sx = x1 + ox, sy = y1 + oy, ex = x2 - ox, ey = y2 - oy;
  const len = Math.hypot(ex - sx, ey - sy) - 9;
  const angle = Math.atan2(ey - sy, ex - sx) * 180 / Math.PI;
  const tint = bad ? "#c0392b" : "#c8ccd2";
  return div({ position: "absolute", left: sx + "px", top: (sy - 1) + "px",
      width: Math.max(0, len) + "px", height: "2px", background: tint,
      transformOrigin: "left center", transform: "rotate(" + angle + "deg)" },
    div({ position: "absolute", right: "-8px", top: "-3px", width: "8px",
          height: "8px", background: tint,
          clipPath: "polygon(0 0, 100% 50%, 0 100%)" }));
};

console.log(div(label("imports · 1 cycle"),
  div({ position: "relative", width: "440px", height: "150px" },
    ...EDGES.map(([a, b, bad]) => edge(a, b, bad)),
    ...Object.entries(NODES).map(([name, [x, y]]) => div({
        position: "absolute", left: (x - NW) + "px", top: (y - NH) + "px",
        width: (NW * 2) + "px", height: (NH * 2) + "px", boxSizing: "border-box",
        display: "grid", placeItems: "center",
        borderRadius: "4px", fontSize: "10px",
        fontFamily: "ui-monospace, monospace", whiteSpace: "nowrap",
        background: CYCLE.has(name) ? "#fff5f4" : "white",
        border: "1.5px solid " + (CYCLE.has(name) ? "#e8a9a2" : "#d7dce2"),
        color: CYCLE.has(name) ? "#c0392b" : "#5b6472" }, name)))));
```

</details>

## Typed array bitmap

One div per value, coloured by magnitude — a buffer you can look at.

![](images/gallery/typed-array-bitmap.png?framed)

<details>
<summary>Code</summary>

```js
const { div } = consolepro;

const label = (t) => div({ fontSize: "10px", color: "#8a8a8a",
  textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "10px" }, t);

const W = 40, H = 16;
const data = new Uint8Array(W * H);
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const d = Math.hypot(x - 20, (y - 8) * 2.1);
    data[y * W + x] = Math.max(0, 255 - d * 17 + (x * y % 7) * 6);
  }
}
console.log(div(label("Uint8Array(640) · heat"),
  div({ display: "grid", gridTemplateColumns: "repeat(" + W + ", 9px)",
        gridAutoRows: "9px", gap: "1px" },
    ...[...data].map((v) => div({
      background: "rgb(" + Math.round(20 + v * 0.85) + ","
        + Math.round(24 + v * 0.35) + "," + Math.round(90 - v * 0.2) + ")" }))),
  div({ fontSize: "9px", color: "#8a94a1", marginTop: "6px",
        fontFamily: "ui-monospace, monospace" },
    "min 0 · max 255 · mean " +
    Math.round([...data].reduce((a, b) => a + b, 0) / data.length))));
```

</details>

