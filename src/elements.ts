/**
 * The element value produced by `element()`, and the rules for reading its
 * arguments.
 */

/** The only tags the Custom Formatters API renders. Everything else is composed. */
export const nativeTagNames = ["div", "span", "ol", "li", "table", "tr", "td"] as const;

export type NativeTagName = (typeof nativeTagNames)[number];

export type Style = Record<string, string | number>;

/**
 * Attributes are CSS properties, written flat. `style` is reserved, and takes
 * either a CSS string or an object.
 */
export type Attributes = Record<string, unknown> & {
  style?: string | Style;
};

/** Anything that can be a child. Objects that aren't attributes stay live. */
export type Child = Element | string | number | boolean | object | null | undefined;

export type PresentChild = Exclude<Child, null | undefined>;

export class Element {
  readonly name: string;
  readonly attributes: Attributes;
  readonly children: readonly PresentChild[];

  constructor(name: string, attributes: Attributes, children: readonly Child[]) {
    this.name = name;
    this.attributes = attributes;
    this.children = children.filter(isPresent);
  }
}

/**
 * `element("span", { color: "red" }, "hello")`
 *
 * The first argument is the attributes when it's a plain object, and a child
 * otherwise. Every remaining argument is exactly one child — arrays don't
 * flatten, so an array is logged as itself.
 */
export function element(name: string, ...args: readonly Child[]): Element {
  assertNativeTagName(name);

  const [attributes, children] = readArguments(args);
  return new Element(name, attributes, children);
}

/** Splits a call's arguments into its attributes and its children. */
export function readArguments(
  args: readonly Child[],
): [Attributes, readonly Child[]] {
  const [first, ...rest] = args;
  return isAttributes(first) ? [first, rest] : [{}, args];
}

/**
 * Attributes are plain objects. Elements, arrays and class instances are
 * children, which leaves one shape unreachable: an object as the first child.
 * Write `span({}, user)` for that.
 */
export function isAttributes(value: Child): value is Attributes {
  return typeof value === "object" && value !== null && value.constructor === Object;
}

function isPresent(child: Child): child is PresentChild {
  return child !== null && child !== undefined;
}

function assertNativeTagName(name: string): asserts name is NativeTagName {
  if (!(nativeTagNames as readonly string[]).includes(name)) {
    throw new Error(
      `consolepro: <${name}> isn't rendered by the Custom Formatters API. ` +
        `Compose it from ${nativeTagNames.join(", ")}.`,
    );
  }
}
