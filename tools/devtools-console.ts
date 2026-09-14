/**
 * Screenshots the Chrome devtools console.
 *
 * Devtools can't be screenshotted as browser UI, because it isn't a page. But
 * the devtools frontend *is* a web page, so we open it as an ordinary tab
 * pointed at the tab we want inspected, and screenshot that tab.
 *
 * Everything devtools-specific lives here, behind `openDevtoolsConsole`.
 */

import puppeteer from "puppeteer";
import type { Browser, Page } from "puppeteer";

/**
 * Chrome serves a frontend matching itself on its own debugging port, so
 * there's no external service to fetch and no version skew. The
 * `devtoolsFrontendUrl` in `/json/list` can't be used as-is — Chrome for
 * Testing points it at chrome-devtools-frontend.appspot.com, a different
 * origin and a different revision — but the target id in the same response is.
 *
 * `devtools_app.html`, not the `inspector.html` that `/json/list` names: for a
 * target reached over a websocket, `inspector.html` is the remote-device app,
 * which spends most of the window on a screencast of the inspected page and
 * squeezes the panels into a column beside it.
 */
const FRONTEND_PATH = "/devtools/devtools_app.html";

/**
 * Devtools settings live in the frontend origin's localStorage, so ticking
 * "Enable custom formatters" by hand — and the preconfigured Chrome profile
 * that would have to preserve it — is replaced by writing the key and
 * reloading into it.
 *
 * Setting names have changed between Chrome versions. These were read off the
 * build Puppeteer bundles, by resolving them through the frontend's own
 * registry from a tab sitting on it:
 *
 *     const Common = await import("./core/common/common.js");
 *     Common.Settings.Settings.instance().moduleSetting("custom-formatters");
 *
 * If a Chrome upgrade stops the formatter rendering, re-read them that way.
 */
const CUSTOM_FORMATTERS_SETTING = "custom-formatters";
const THEME_SETTING = "ui-theme";

/**
 * Off, so that typing at the prompt leaves nothing in the picture but what was
 * typed: no greyed-out preview of the result under the line, no autocomplete
 * popup hanging over the output.
 */
const QUIET_PROMPT_SETTINGS = {
  "console-eager-eval": false,
  "console-history-autocomplete": false,
  "console-autocomplete-on-enter": false,
};

const THEMES = { light: "default", dark: "dark" } as const;

/**
 * Retina. The width is the console's width — what a block-level message
 * stretches to, what a long one wraps at, and how much empty panel a
 * panel-framed shot carries around its content.
 */
const VIEWPORT = { width: 620, height: 760, deviceScaleFactor: 2 };

/** Breathing room around the cropped message, in CSS pixels. */
const PADDING = 6;

const TIMEOUT = 30_000;

/** How long the message count has to hold still before a shot is taken, in ms. */
const SETTLE = 250;

/**
 * `--no-sandbox`: Chrome's sandbox needs privileges a container typically
 * doesn't grant, and this browser is thrown away after loading one page the
 * caller wrote itself.
 *
 * `--remote-allow-origins`: the debugging endpoint answers a websocket
 * handshake carrying an `Origin` header with 403 unless the origin is allowed,
 * and a page always sends one — so serving the frontend from the debugging
 * port doesn't avoid the flag, it only makes the origin predictable. The port
 * isn't known until Chrome has picked one, which is after the flag has to be
 * passed, so this allows any origin. Nothing outside this process knows the
 * port.
 */
const CHROME_ARGS = ["--no-sandbox", "--remote-allow-origins=*"];

export interface DevtoolsConsoleOptions {
  /** The page to inspect. Snippets are evaluated in it. */
  url: string;
  theme?: keyof typeof THEMES;
}

export interface CaptureOptions {
  /**
   * A line to type at the console prompt once the snippet has run, so the
   * picture shows the exchange — the echoed line and what came back. One line
   * only: the prompt takes a newline as "run it".
   */
  prompt?: string;
  /**
   * Frame the panel — tab strip, output, and the prompt waiting underneath —
   * instead of cropping to the messages. For a picture of the console rather
   * than of a message.
   */
  panel?: boolean;
}

export interface DevtoolsConsole {
  /**
   * Runs `snippet` in the inspected page and writes a PNG of what the console
   * printed for it, cropped to the messages themselves.
   *
   * The snippet is a function body, called with whatever the page left on
   * `globalThis.consolefmt` as its `consolefmt` argument.
   */
  capture(snippet: string, screenshotPath: string, options?: CaptureOptions): Promise<void>;
  close(): Promise<void>;
}

export async function openDevtoolsConsole({
  url,
  theme = "light",
}: DevtoolsConsoleOptions): Promise<DevtoolsConsole> {
  // No `pipe: true`: the frontend reconnects over a websocket named in its own
  // URL, so Chrome has to be listening on a TCP port. Puppeteer picks a free
  // one, which keeps this off 9222 and clear of any Chrome already running.
  const browser = await puppeteer.launch({ args: CHROME_ARGS });

  try {
    const port = new URL(browser.wsEndpoint()).port;
    const inspected = await openInspectedPage(browser, url);
    const frontend = await openFrontend(browser, port, inspected.url(), theme);

    return {
      capture: (snippet, screenshotPath, options = {}) =>
        capture(inspected, frontend, snippet, screenshotPath, options),
      close: () => browser.close(),
    };
  } catch (error) {
    await browser.close();
    throw error;
  }
}

async function openInspectedPage(browser: Browser, url: string): Promise<Page> {
  // Reuse the tab Chrome opens on launch, so `/json/list` holds two page
  // targets and not three.
  const [page = await browser.newPage()] = await browser.pages();
  await page.goto(url, { waitUntil: "load" });
  return page;
}

async function openFrontend(
  browser: Browser,
  port: string,
  inspectedUrl: string,
  theme: keyof typeof THEMES,
): Promise<Page> {
  const targetId = await findTargetId(port, inspectedUrl);
  const frontendUrl =
    `http://127.0.0.1:${port}${FRONTEND_PATH}` +
    `?ws=127.0.0.1:${port}/devtools/page/${targetId}`;

  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);

  // Settings are read at boot, so they have to be in place before the load
  // that counts: write them on the first one, then reload into them.
  await page.goto(frontendUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate(
    (settings: Record<string, unknown>) => {
      for (const [key, value] of Object.entries(settings)) {
        localStorage.setItem(key, JSON.stringify(value));
      }
    },
    {
      [CUSTOM_FORMATTERS_SETTING]: true,
      [THEME_SETTING]: THEMES[theme],
      ...QUIET_PROMPT_SETTINGS,
    },
  );
  await page.reload({ waitUntil: "domcontentloaded" });

  await showConsolePanel(page);
  return page;
}

/**
 * The one thing Puppeteer doesn't expose is the inspected tab's target id, and
 * `/json/list` has it.
 */
async function findTargetId(port: string, inspectedUrl: string): Promise<string> {
  const response = await fetch(`http://127.0.0.1:${port}/json/list`);
  const targets = (await response.json()) as { id: string; type: string; url: string }[];
  const target = targets.find((t) => t.type === "page" && t.url === inspectedUrl);

  if (!target) {
    throw new Error(`No debuggable page target for ${inspectedUrl}.`);
  }
  return target.id;
}

/**
 * Driving the frontend through its own modules, rather than through its DOM,
 * which is a tree of shadow roots with no stable handles in it. They're
 * imported by URL at runtime, so this is written as a string: there's nothing
 * on disk to typecheck it against.
 */
function frontendModule(singleton: string, call: string): string {
  return `import("./ui/legacy/legacy.js")
    .then((UI) => UI.${singleton}.instance().${call})`;
}

/** Devtools opens on Elements. A panel is a view, and the frontend can show one. */
async function showConsolePanel(page: Page): Promise<void> {
  await page.waitForSelector("pierce/.tabbed-pane", { timeout: TIMEOUT });
  await page.evaluate(frontendModule("ViewManager.ViewManager", "showView('console')"));
  await page.waitForSelector("pierce/#console-prompt", { timeout: TIMEOUT });
}

/**
 * The console lives inside shadow roots, so its parts are reached by walking
 * them rather than with a plain selector.
 *
 * `console-message-text` is a message's own content. The row around it is as
 * wide as the console and ends in a link to wherever the message was logged
 * from — here, the harness's own eval frame — so cropping to the text is what
 * leaves a picture of the message and nothing else.
 */
function inConsole(
  expression: string,
  className: string = "console-message-text",
): string {
  return `
    (() => {
      const all = (root, found = []) => {
        for (const element of root.querySelectorAll("*")) {
          found.push(element);
          if (element.shadowRoot) all(element.shadowRoot, found);
        }
        return found;
      };
      const messages = all(document).filter(
        (element) => element.classList.contains("${className}"),
      );
      return ${expression};
    })()
  `;
}

async function capture(
  inspected: Page,
  frontend: Page,
  snippet: string,
  screenshotPath: string,
  { prompt, panel = false }: CaptureOptions,
): Promise<void> {
  await clearConsole(frontend);

  if (snippet.trim() !== "") {
    const failure = await inspected.evaluate((code: string) => {
      try {
        // A snippet is a function body given the library as its one argument,
        // which is how the examples are written: they take what they need from
        // `consolefmt` rather than reaching for globals. Indirect eval so it
        // compiles in global scope, and the call frame keeps its declarations
        // from colliding with the next snippet's.
        const body = (0, eval)(`(function (consolefmt) {${code}})`) as
          (library: unknown) => void;
        body((globalThis as { consolefmt?: unknown }).consolefmt);
        return null;
      } catch (error) {
        return String(error);
      }
    }, snippet);

    if (failure !== null) {
      throw new Error(`Snippet failed: ${failure}\n${snippet}`);
    }
  }

  // A screenshot captures the visible tab, so the frontend has to be the one in
  // front — which is what lets one browser host both tabs.
  await frontend.bringToFront();

  if (prompt !== undefined) {
    await typeAtPrompt(frontend, prompt);
  }

  // Wait for the thing this capture is actually about. When a line was typed,
  // that's its result: the page's own messages are already on screen, so
  // waiting for "any message" would return before the result had rendered.
  //
  // Messages arrive one at a time over the debugging protocol, so a count is
  // only meaningful once it stops going up. Screenshotting the first arrival
  // writes whatever had painted by then, and a snippet that logs ten lines
  // silently loses most of them.
  const printed = inConsole(
    `(() => {
      const now = performance.now();
      const settling = (window.__consolefmtSettling ??= { count: -1, since: now });
      if (settling.count !== messages.length) {
        settling.count = messages.length;
        settling.since = now;
      }
      return messages.length > 0 && now - settling.since > ${SETTLE};
    })()`,
    prompt === undefined ? undefined : "console-user-command-result",
  );

  await frontend.waitForFunction(printed, { timeout: 10_000, polling: 50 }).catch(() => {
    throw new Error(`Nothing was printed:\n${prompt ?? snippet}`);
  });

  // Every message carries a link to where it was logged from, laid out against
  // the right edge. Here that's the harness's own eval frame, so it says
  // nothing — and in a panel-framed shot there's no crop to leave it out of.
  await hideSourceLinks(frontend);
  await stopCaretBlinking(frontend);
  await frontend.evaluate(() => new Promise(requestAnimationFrame));

  const clip = panel ? await panelBox(frontend) : await messagesBox(frontend);
  await frontend.screenshot({ path: screenshotPath as `${string}.png`, clip });
}

/**
 * Types at the console prompt, as the reader would have done by hand. An
 * expression rather than a `console.log` keeps it clean: the console prints
 * the value with no `undefined` after it, and the formatter renders a result
 * just as it renders a logged message.
 */
async function typeAtPrompt(frontend: Page, line: string): Promise<void> {
  const prompt = await frontend.$("pierce/#console-prompt");
  if (prompt === null) {
    throw new Error("consolefmt: no console prompt to type into.");
  }

  await prompt.click();
  // Typed rather than pasted, so the editor highlights it as it would for
  // anyone else. Balanced brackets survive its auto-closing.
  await frontend.keyboard.type(line.trim(), { delay: 8 });
  await frontend.keyboard.press("Enter");
}

/**
 * The prompt's caret blinks, so the same snippet shot twice gives two
 * different pictures and every panel-framed file comes back modified. Dropping
 * the animation leaves the caret drawn, in the same phase every time.
 *
 * The animation is on the layer the cursor sits in, which fades between full
 * and zero opacity. The cursor element inside it never changes.
 */
async function stopCaretBlinking(page: Page): Promise<void> {
  await page.evaluate(
    inConsole(
      `messages.forEach((layer) => { layer.style.animation = "none"; })`,
      "cm-cursorLayer",
    ),
  );
}

async function hideSourceLinks(page: Page): Promise<void> {
  await page.evaluate(
    inConsole(
      `messages.forEach((anchor) => { anchor.style.display = "none"; })`,
      "console-message-anchor",
    ),
  );
}

/**
 * Devtools' own clear, not the page's `console.clear()`, which leaves a
 * "Console was cleared" message behind.
 */
async function clearConsole(page: Page): Promise<void> {
  await page.evaluate(
    frontendModule("ActionRegistry.ActionRegistry", "getAction('console.clear').execute()"),
  );
  await page.waitForFunction(
    inConsole("messages.length === 0", "console-message-wrapper"),
    { timeout: TIMEOUT },
  );
}

/** The panel, from its top down to the prompt the exchange left waiting. */
async function panelBox(page: Page) {
  const bottom = (await page.evaluate(
    inConsole("messages[0].getBoundingClientRect().bottom", "console-prompt-editor-container"),
  )) as number;

  return {
    x: 0,
    y: 0,
    width: page.viewport()?.width ?? 0,
    height: Math.round(bottom + PADDING),
  };
}

/**
 * The crop: the union of everything the messages painted.
 *
 * A message's own box won't do on its own — the row it sits in is as wide as
 * the console, and `console-message-text` is inline, so its rect is a line box
 * and stops short of anything block-level the formatter rendered inside it.
 * What got painted is the descendants, so they're what gets measured.
 */
async function messagesBox(page: Page) {
  const box = (await page.evaluate(
    inConsole(`(() => {
      const boxes = messages
        .flatMap((message) => [message, ...all(message)])
        .map((element) => element.getBoundingClientRect())
        .filter((box) => box.width > 0 && box.height > 0);
      if (boxes.length === 0) return null;
      return {
        left: Math.min(...boxes.map((b) => b.left)),
        top: Math.min(...boxes.map((b) => b.top)),
        right: Math.max(...boxes.map((b) => b.right)),
        bottom: Math.max(...boxes.map((b) => b.bottom)),
      };
    })()`),
  )) as { left: number; top: number; right: number; bottom: number } | null;

  if (!box) {
    throw new Error("The console printed nothing to crop to.");
  }

  return {
    x: box.left - PADDING,
    y: box.top - PADDING,
    width: box.right - box.left + PADDING * 2,
    height: box.bottom - box.top + PADDING * 2,
  };
}
