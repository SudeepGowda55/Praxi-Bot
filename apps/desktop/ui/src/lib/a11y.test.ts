import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import ts from "typescript";

// Accessibility guards. jsx-a11y is not a dependency, so this scans the component sources for
// icon-only <button>/<a> elements (no text, literal or `{...}` expression, among children) that
// have no accessible name (aria-label / aria-labelledby) or, for buttons, no tooltip (title).

const ROOTS = ["src/components", "src/views", "src/overlay"];
const NAMED_ATTRS = new Set(["aria-label", "aria-labelledby"]);

function walk(dir: string, out: string[]): void {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith(".tsx")) out.push(p);
  }
}

function hasName(attrs: ts.JsxAttributes): boolean {
  return attrs.properties.some(
    (p) =>
      ts.isJsxSpreadAttribute(p) ||
      (ts.isJsxAttribute(p) && NAMED_ATTRS.has(p.name.getText()))
  );
}

function hasText(children: readonly ts.JsxChild[]): boolean {
  return children.some((c) => {
    if (ts.isJsxText(c)) return /\S/.test(c.text);
    if (ts.isJsxExpression(c)) return c.expression !== undefined;
    if (ts.isJsxElement(c)) {
      const tag = c.openingElement.tagName.getText();
      // Plain HTML wrappers (<span>) carry text; capitalised ones are components.
      return /^[a-z]/.test(tag) ? hasText(c.children) : false;
    }
    return false;
  });
}

function hasAttr(attrs: ts.JsxAttributes, name: string): boolean {
  return attrs.properties.some(
    (p) => ts.isJsxSpreadAttribute(p) || (ts.isJsxAttribute(p) && p.name.getText() === name)
  );
}

// <button>/<a> elements, open or self-closing, with no visible text among their children.
function iconOnly(file: string, tags: string[]): { at: string; attrs: ts.JsxAttributes }[] {
  const src = ts.createSourceFile(
    file,
    readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );
  const found: { at: string; attrs: ts.JsxAttributes }[] = [];
  const visit = (n: ts.Node): void => {
    const el = ts.isJsxElement(n) ? n.openingElement : ts.isJsxSelfClosingElement(n) ? n : undefined;
    if (el && tags.includes(el.tagName.getText()) && !(ts.isJsxElement(n) && hasText(n.children))) {
      const { line } = src.getLineAndCharacterOfPosition(n.getStart());
      found.push({ at: `${file}:${line + 1}`, attrs: el.attributes });
    }
    ts.forEachChild(n, visit);
  };
  visit(src);
  return found;
}

function componentFiles(): string[] {
  const files: string[] = [];
  for (const r of ROOTS) walk(r, files);
  return files;
}

test("every icon-only button or link has an aria-label", () => {
  const bad = componentFiles()
    .flatMap((f) => iconOnly(f, ["button", "a"]))
    .filter((b) => !hasName(b.attrs))
    .map((b) => b.at);
  assert.deepEqual(bad, []);
});

test("every icon-only button has a tooltip (title)", () => {
  const bad = componentFiles()
    .flatMap((f) => iconOnly(f, ["button"]))
    .filter((b) => !hasAttr(b.attrs, "title"))
    .map((b) => b.at);
  assert.deepEqual(bad, []);
});

test("inline form errors are announced (role=alert)", () => {
  const files: string[] = [];
  for (const r of ROOTS) walk(r, files);
  const bad = files.flatMap((f) =>
    readFileSync(f, "utf8")
      .split("\n")
      .flatMap((line, i) =>
        /className=\{formStyles\.error\}/.test(line) && !/role=/.test(line) ? [`${f}:${i + 1}`] : []
      )
  );
  assert.deepEqual(bad, []);
});
