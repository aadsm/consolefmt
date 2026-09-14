/**
 * Colours a JavaScript snippet, as HTML, using the TypeScript parser that is
 * already here for the screenshots. Runs at build time, so the page ships the
 * markup and loads no highlighter of its own.
 *
 * The parser does the hard part: template literals with substitutions in them,
 * and the slash that could be division or a regular expression. Whitespace and
 * comments are what is left between tokens.
 */

import ts from "typescript";

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;" };
const escape = (text: string): string => text.replace(/[&<>]/g, (c) => ESCAPES[c]!);

/** The classes the page styles. Everything else is left plain. */
function classOf(kind: ts.SyntaxKind): string | undefined {
  if (kind >= ts.SyntaxKind.FirstKeyword && kind <= ts.SyntaxKind.LastKeyword) return "k";
  if (kind === ts.SyntaxKind.NumericLiteral) return "n";
  if (kind === ts.SyntaxKind.RegularExpressionLiteral) return "r";
  if (
    kind === ts.SyntaxKind.StringLiteral ||
    (kind >= ts.SyntaxKind.NoSubstitutionTemplateLiteral &&
      kind <= ts.SyntaxKind.TemplateTail)
  ) {
    return "s";
  }
  return undefined;
}

const wrap = (className: string | undefined, text: string): string =>
  className === undefined ? escape(text) : `<span class="${className}">${escape(text)}</span>`;

export function highlight(code: string): string {
  const file = ts.createSourceFile("example.js", code, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  let out = "";
  let position = 0;

  /** What sits between two tokens: whitespace, and the comments worth colouring. */
  const trivia = (upTo: number): void => {
    const text = code.slice(position, upTo);
    out += text.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, (comment) => wrap("c", comment));
    position = upTo;
  };

  const walk = (node: ts.Node): void => {
    const children = node.getChildren(file);
    if (children.length > 0) {
      children.forEach(walk);
      return;
    }
    trivia(node.getStart(file));
    out += wrap(classOf(node.kind), code.slice(node.getStart(file), node.end));
    position = node.end;
  };

  walk(file);
  trivia(code.length);
  return out;
}
