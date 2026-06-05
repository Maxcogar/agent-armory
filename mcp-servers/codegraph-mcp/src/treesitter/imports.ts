import Parser from "tree-sitter";

import { Language, RawImport, ImportSpecifier } from "../types.js";
import { parseSource } from "./parser.js";

// ============================================================
// Import extraction (syntactic — no path resolution)
// ============================================================
//
// Reads imports/requires/re-exports straight from the parse tree. Because this
// works on real syntax nodes, it is immune to the false positives a regex hits:
// an import-looking line inside a string literal or a comment is never a node,
// so it is never extracted. Path resolution (raw -> file/external) is a separate
// concern handled by the existing language resolvers.

type Node = Parser.SyntaxNode;

const lineOf = (n: Node): number => n.startPosition.row + 1;

/** tree-sitter string nodes include their surrounding quotes/backticks. */
function unquote(text: string): string {
  return text.replace(/^[`'"]/, "").replace(/[`'"]$/, "");
}

/** The string-literal module specifier of an import/export/call node. */
function sourceString(node: Node): Node | null {
  return (
    node.childForFieldName("source") ??
    node.namedChildren.find((c) => c.type === "string") ??
    null
  );
}

// ---------- JavaScript / TypeScript ----------

function parseImportClause(clause: Node, wholeType: boolean): ImportSpecifier[] {
  const specs: ImportSpecifier[] = [];
  for (const child of clause.namedChildren) {
    if (child.type === "identifier") {
      // `import Foo from '...'`
      specs.push({ imported: "default", local: child.text, kind: "default", isType: wholeType });
    } else if (child.type === "namespace_import") {
      // `import * as ns from '...'`
      const id = child.namedChildren.find((c) => c.type === "identifier");
      specs.push({ imported: "*", local: id ? id.text : "*", kind: "namespace", isType: wholeType });
    } else if (child.type === "named_imports") {
      for (const spec of child.namedChildren) {
        if (spec.type !== "import_specifier") continue;
        const nameNode = spec.childForFieldName("name");
        const aliasNode = spec.childForFieldName("alias");
        const imported = nameNode ? nameNode.text : spec.text;
        const local = aliasNode ? aliasNode.text : imported;
        specs.push({ imported, local, kind: "named", isType: wholeType || /^type\s/.test(spec.text) });
      }
    }
  }
  return specs;
}

function parseReExportClause(stmt: Node): ImportSpecifier[] {
  const clause = stmt.namedChildren.find((c) => c.type === "export_clause");
  if (!clause) {
    // `export * from '...'` (no clause) — a namespace re-export.
    return [{ imported: "*", local: "*", kind: "namespace", isType: false }];
  }
  const specs: ImportSpecifier[] = [];
  for (const spec of clause.namedChildren) {
    if (spec.type !== "export_specifier") continue;
    const nameNode = spec.childForFieldName("name");
    const aliasNode = spec.childForFieldName("alias");
    const imported = nameNode ? nameNode.text : spec.text;
    const local = aliasNode ? aliasNode.text : imported;
    specs.push({ imported, local, kind: "named", isType: /^type\s/.test(spec.text) });
  }
  return specs;
}

function extractJsImports(root: Node): RawImport[] {
  const out: RawImport[] = [];

  for (const stmt of root.descendantsOfType("import_statement")) {
    const src = sourceString(stmt);
    if (!src) continue;
    const raw = unquote(src.text);
    const wholeType = /^import\s+type\b/.test(stmt.text);
    const clause = stmt.namedChildren.find((c) => c.type === "import_clause");
    if (!clause) {
      out.push({ raw, kind: "side-effect", specifiers: [], line: lineOf(stmt) });
      continue;
    }
    out.push({
      raw,
      kind: wholeType ? "type" : "value",
      specifiers: parseImportClause(clause, wholeType),
      line: lineOf(stmt),
    });
  }

  // Re-exports carry a `source`; a plain `export { x }` (no source) does not.
  for (const stmt of root.descendantsOfType("export_statement")) {
    const src = sourceString(stmt);
    if (!src) continue;
    out.push({
      raw: unquote(src.text),
      kind: "re-export",
      specifiers: parseReExportClause(stmt),
      line: lineOf(stmt),
    });
  }

  // Dynamic `import('x')` and CommonJS `require('x')`.
  for (const call of root.descendantsOfType("call_expression")) {
    const fn = call.childForFieldName("function");
    if (!fn) continue;
    const isDynamic = fn.type === "import";
    const isRequire = fn.type === "identifier" && fn.text === "require";
    if (!isDynamic && !isRequire) continue;
    const args = call.childForFieldName("arguments");
    const strArg = args?.namedChildren.find((c) => c.type === "string");
    if (!strArg) continue;
    out.push({
      raw: unquote(strArg.text),
      kind: isDynamic ? "dynamic" : "value",
      specifiers: [],
      line: lineOf(call),
    });
  }

  return out;
}

// ---------- Python ----------

function extractPyImports(root: Node): RawImport[] {
  const out: RawImport[] = [];

  for (const stmt of root.descendantsOfType("import_from_statement")) {
    const mod = stmt.childForFieldName("module_name");
    const raw = mod ? mod.text : "";
    if (!raw) continue;
    const specifiers: ImportSpecifier[] = [];
    for (const nameNode of stmt.childrenForFieldName("name")) {
      const aliased = nameNode.type === "aliased_import";
      const imported = aliased ? nameNode.childForFieldName("name")?.text ?? nameNode.text : nameNode.text;
      const local = aliased ? nameNode.childForFieldName("alias")?.text ?? imported : imported;
      specifiers.push({ imported, local, kind: "named", isType: false });
    }
    out.push({ raw, kind: "value", specifiers, line: lineOf(stmt) });
  }

  for (const stmt of root.descendantsOfType("import_statement")) {
    for (const nameNode of stmt.childrenForFieldName("name")) {
      const aliased = nameNode.type === "aliased_import";
      const modNode = aliased ? nameNode.childForFieldName("name") : nameNode;
      const raw = modNode ? modNode.text : nameNode.text;
      if (!raw) continue;
      const local = aliased ? nameNode.childForFieldName("alias")?.text ?? raw : raw;
      out.push({
        raw,
        kind: "value",
        specifiers: [{ imported: raw, local, kind: "default", isType: false }],
        line: lineOf(stmt),
      });
    }
  }

  return out;
}

// ---------- C / C++ / Arduino ----------

function extractCppImports(root: Node): RawImport[] {
  const out: RawImport[] = [];
  for (const inc of root.descendantsOfType("preproc_include")) {
    const pathNode = inc.childForFieldName("path");
    if (!pathNode) continue;
    // Only quoted local includes are project files (system <...> includes are
    // `system_lib_string`, never local) — mirrors the existing cpp resolver.
    if (pathNode.type !== "string_literal") continue;
    out.push({ raw: unquote(pathNode.text), kind: "value", specifiers: [], line: lineOf(inc) });
  }
  return out;
}

/**
 * Extract every import/require/re-export in `code` as {@link RawImport}s (raw
 * specifier + kind + named specifiers), before any path resolution. Returns []
 * for languages without a tree-sitter grammar.
 */
// ---------- Go ----------

function extractGoImports(root: Node): RawImport[] {
  const out: RawImport[] = [];
  for (const spec of root.descendantsOfType("import_spec")) {
    const pathNode = spec.childForFieldName("path");
    if (!pathNode) continue;
    const raw = unquote(pathNode.text);
    const nameNode = spec.childForFieldName("name");
    const explicit = nameNode && nameNode.text !== "_" && nameNode.text !== "." ? nameNode.text : null;
    const alias = explicit ?? raw.split("/").pop() ?? raw;
    out.push({
      raw,
      kind: "value",
      specifiers: [{ imported: "*", local: alias, kind: "namespace", isType: false }],
      line: lineOf(spec),
    });
  }
  return out;
}

export function extractImportsFromTree(language: Language, root: Node): RawImport[] {
  switch (language) {
    case "typescript":
    case "javascript":
      return extractJsImports(root);
    case "python":
      return extractPyImports(root);
    case "cpp":
    case "arduino":
      return extractCppImports(root);
    case "go":
      return extractGoImports(root);
    case "ruby":
      return extractRubyImports(root);
    default:
      return [];
  }
}

// ---------- Ruby ----------

function extractRubyImports(root: Node): RawImport[] {
  const out: RawImport[] = [];
  for (const call of root.descendantsOfType("call")) {
    const fn = call.childForFieldName("method") ?? call.namedChildren.find((c) => c.type === "identifier");
    const name = fn?.text;
    if (name !== "require" && name !== "require_relative") continue;
    const args = call.childForFieldName("arguments") ?? call.namedChildren.find((c) => c.type === "argument_list");
    const content = args?.descendantsOfType("string_content")[0];
    if (!content) continue;
    // Mark require_relative as a relative path so resolution treats it as a file.
    let raw = content.text;
    if (name === "require_relative" && !raw.startsWith(".")) raw = "./" + raw;
    out.push({ raw, kind: "value", specifiers: [], line: lineOf(call) });
  }
  return out;
}

export function extractImports(language: Language, code: string): RawImport[] {
  const tree = parseSource(language, code);
  if (!tree) return [];
  return extractImportsFromTree(language, tree.rootNode);
}
