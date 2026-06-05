import Parser from "tree-sitter";

import { Language, SymbolNode, SymbolKind } from "../types.js";
import { parseSource } from "./parser.js";
import { extractImportsFromTree } from "./imports.js";

// ============================================================
// Symbol extraction (top-level declarations)
// ============================================================
//
// Extracts module-level declarations (the things a file can export and another
// file can import). Nested/local declarations are intentionally ignored — they
// are never part of the module's surface. Reads syntax only; whether a symbol is
// actually *used* is a separate, cross-file question (see the liveness tools).

type Node = Parser.SyntaxNode;
const lineOf = (n: Node): number => n.startPosition.row + 1;

// ---------- JavaScript / TypeScript ----------

const TS_DECL: Record<string, { kind: SymbolKind; isType: boolean }> = {
  function_declaration: { kind: "function", isType: false },
  generator_function_declaration: { kind: "function", isType: false },
  class_declaration: { kind: "class", isType: false },
  abstract_class_declaration: { kind: "class", isType: false },
  interface_declaration: { kind: "interface", isType: true },
  type_alias_declaration: { kind: "type", isType: true },
  enum_declaration: { kind: "enum", isType: false },
};

function isJsDecl(type: string): boolean {
  return (
    type in TS_DECL || type === "lexical_declaration" || type === "variable_declaration"
  );
}

function jsDeclSymbols(node: Node, exported: boolean): SymbolNode[] {
  const meta = TS_DECL[node.type];
  if (meta) {
    const name = node.childForFieldName("name")?.text;
    return name ? [{ name, kind: meta.kind, exported, isType: meta.isType, line: lineOf(node) }] : [];
  }
  if (node.type === "lexical_declaration" || node.type === "variable_declaration") {
    const kind: SymbolKind = /^\s*const\b/.test(node.text) ? "const" : "variable";
    const out: SymbolNode[] = [];
    for (const d of node.descendantsOfType("variable_declarator")) {
      const nameNode = d.childForFieldName("name");
      if (nameNode && nameNode.type === "identifier") {
        out.push({ name: nameNode.text, kind, exported, isType: false, line: lineOf(d) });
      }
    }
    return out;
  }
  return [];
}

function extractJsSymbols(root: Node): SymbolNode[] {
  const symbols: SymbolNode[] = [];
  const exportedNames = new Set<string>();

  for (const child of root.namedChildren) {
    if (child.type === "export_statement") {
      const decl =
        child.childForFieldName("declaration") ??
        child.namedChildren.find((c) => isJsDecl(c.type));
      if (decl) {
        symbols.push(...jsDeclSymbols(decl, true));
        continue;
      }
      // `export { a, b as c }` (no source): mark named locals as exported.
      const clause = child.namedChildren.find((c) => c.type === "export_clause");
      if (clause) {
        for (const spec of clause.namedChildren) {
          if (spec.type !== "export_specifier") continue;
          const n = spec.childForFieldName("name")?.text;
          if (n) exportedNames.add(n);
        }
      }
      continue;
    }
    if (isJsDecl(child.type)) symbols.push(...jsDeclSymbols(child, false));
  }

  if (exportedNames.size > 0) {
    for (const s of symbols) if (exportedNames.has(s.name)) s.exported = true;
  }
  return symbols;
}

// ---------- Python ----------

function extractPySymbols(root: Node): SymbolNode[] {
  const symbols: SymbolNode[] = [];
  for (const child of root.namedChildren) {
    const def =
      child.type === "decorated_definition"
        ? child.childForFieldName("definition") ?? child.namedChildren[child.namedChildren.length - 1]
        : child;
    if (def.type === "function_definition") {
      const name = def.childForFieldName("name")?.text;
      if (name) symbols.push({ name, kind: "function", exported: true, isType: false, line: lineOf(def) });
    } else if (def.type === "class_definition") {
      const name = def.childForFieldName("name")?.text;
      if (name) symbols.push({ name, kind: "class", exported: true, isType: false, line: lineOf(def) });
    }
  }
  return symbols;
}

// ---------- C / C++ / Arduino (best-effort) ----------

export function cppFunctionName(declarator: Node | null): string | undefined {
  if (!declarator) return undefined;
  const fd =
    declarator.type === "function_declarator"
      ? declarator
      : declarator.descendantsOfType("function_declarator")[0];
  if (!fd) return undefined;
  const inner = fd.childForFieldName("declarator");
  if (inner && (inner.type === "identifier" || inner.type === "field_identifier")) return inner.text;
  return fd.descendantsOfType(["identifier", "field_identifier"])[0]?.text;
}

function extractCppSymbols(root: Node): SymbolNode[] {
  const symbols: SymbolNode[] = [];
  const seen = new Set<string>();
  const push = (name: string | undefined, kind: SymbolKind, line: number): void => {
    if (name && !seen.has(name)) {
      seen.add(name);
      symbols.push({ name, kind, exported: true, isType: false, line });
    }
  };
  for (const fn of root.descendantsOfType("function_definition")) {
    push(cppFunctionName(fn.childForFieldName("declarator")), "function", lineOf(fn));
  }
  // Function prototypes in headers: a `declaration` whose declarator is a
  // function_declarator (e.g. `int readSensor();`). These are the header's API.
  for (const decl of root.descendantsOfType("declaration")) {
    const d = decl.childForFieldName("declarator");
    if (d && (d.type === "function_declarator" || d.descendantsOfType("function_declarator").length > 0)) {
      push(cppFunctionName(d), "function", lineOf(decl));
    }
  }
  for (const spec of root.descendantsOfType(["class_specifier", "struct_specifier"])) {
    push(spec.childForFieldName("name")?.text, "class", lineOf(spec));
  }
  return symbols;
}

// ---------- Go / Rust / Java / Ruby / C# / PHP (table-driven) ----------

interface DeclSpec {
  types: string[];
  kind: SymbolKind;
  isType?: boolean;
}

const LANG_DECLS: Partial<Record<Language, DeclSpec[]>> = {
  go: [
    { types: ["function_declaration"], kind: "function" },
    // Receiver methods are called through instances (needs type inference to
    // resolve cross-file), so mark them `method` and keep them out of dead-code.
    { types: ["method_declaration"], kind: "method" },
    { types: ["type_spec"], kind: "class" },
  ],
  rust: [
    { types: ["function_item"], kind: "function" },
    { types: ["struct_item", "enum_item", "union_item"], kind: "class" },
    { types: ["trait_item"], kind: "interface", isType: true },
    { types: ["type_item"], kind: "type", isType: true },
    { types: ["const_item", "static_item"], kind: "const" },
    { types: ["mod_item"], kind: "class" },
  ],
  java: [
    { types: ["class_declaration", "record_declaration"], kind: "class" },
    { types: ["interface_declaration"], kind: "interface", isType: true },
    { types: ["enum_declaration"], kind: "enum" },
    { types: ["method_declaration"], kind: "method" },
  ],
  ruby: [
    { types: ["class", "module"], kind: "class" },
    { types: ["method", "singleton_method"], kind: "method" },
  ],
  csharp: [
    { types: ["class_declaration", "record_declaration", "struct_declaration"], kind: "class" },
    { types: ["interface_declaration"], kind: "interface", isType: true },
    { types: ["enum_declaration"], kind: "enum" },
    { types: ["method_declaration"], kind: "method" },
  ],
  php: [
    { types: ["function_definition"], kind: "function" },
    { types: ["class_declaration", "trait_declaration"], kind: "class" },
    { types: ["interface_declaration"], kind: "interface", isType: true },
    { types: ["enum_declaration"], kind: "enum" },
    { types: ["method_declaration"], kind: "method" },
  ],
};

function isExported(language: Language, node: Node, name: string): boolean {
  switch (language) {
    case "go":
      return /^[A-Z]/.test(name); // Go: capitalized identifiers are exported
    case "rust":
      return node.children.some((c) => c.type === "visibility_modifier");
    case "java":
    case "csharp":
      return /(^|\W)public(\W|$)/.test(node.text.slice(0, 160));
    default:
      return true; // Ruby, PHP, etc. — top-level is callable
  }
}

function hasAncestorType(node: Node, types: ReadonlySet<string>): boolean {
  for (let p = node.parent; p; p = p.parent) if (types.has(p.type)) return true;
  return false;
}

const RUST_METHOD_PARENTS: ReadonlySet<string> = new Set(["impl_item", "trait_item"]);

function extractTableSymbols(language: Language, root: Node): SymbolNode[] {
  const specs = LANG_DECLS[language];
  if (!specs) return [];
  const out: SymbolNode[] = [];
  const seen = new Set<string>();
  for (const spec of specs) {
    for (const node of root.descendantsOfType(spec.types)) {
      const name = node.childForFieldName("name")?.text;
      if (!name || seen.has(name)) continue;
      seen.add(name);
      // A Rust fn inside an impl/trait is a method (called via an instance —
      // cross-file resolution needs type inference), so keep it out of dead-code.
      const kind =
        language === "rust" && node.type === "function_item" && hasAncestorType(node, RUST_METHOD_PARENTS)
          ? "method"
          : spec.kind;
      out.push({ name, kind, exported: isExported(language, node, name), isType: spec.isType ?? false, line: lineOf(node) });
    }
  }
  return out;
}

export function extractSymbolsFromTree(language: Language, root: Node): SymbolNode[] {
  switch (language) {
    case "typescript":
    case "javascript":
      return extractJsSymbols(root);
    case "python":
      return extractPySymbols(root);
    case "cpp":
    case "arduino":
      return extractCppSymbols(root);
    case "go":
    case "rust":
    case "java":
    case "ruby":
    case "csharp":
    case "php":
      return extractTableSymbols(language, root);
    default:
      return [];
  }
}

export function extractSymbols(language: Language, code: string): SymbolNode[] {
  const tree = parseSource(language, code);
  if (!tree) return [];
  return extractSymbolsFromTree(language, tree.rootNode);
}

// ============================================================
// Unused imports (imported but never referenced in the file body)
// ============================================================

/** Collect identifier usages, not descending into import statements. */
function collectUsages(root: Node, skip: ReadonlySet<string>): Set<string> {
  const used = new Set<string>();
  const stack: Node[] = [root];
  while (stack.length > 0) {
    const n = stack.pop()!;
    if (skip.has(n.type)) continue;
    if (n.type === "identifier" || n.type === "type_identifier") used.add(n.text);
    for (const c of n.namedChildren) stack.push(c);
  }
  return used;
}

const UNUSED_SKIP: Record<string, ReadonlySet<string>> = {
  js: new Set(["import_statement"]),
  py: new Set(["import_statement", "import_from_statement"]),
};

/**
 * Imports whose local binding is never referenced in the file. JS/TS and Python
 * only. Side-effect, dynamic, and re-export imports bind no local name and are
 * skipped. This is syntactic: a name used only via reflection/eval would be a
 * false positive, as it is for any linter.
 */
export function extractUnusedImports(
  language: Language,
  code: string
): { imported: string; local: string; line: number }[] {
  const isJs = language === "typescript" || language === "javascript";
  const isPy = language === "python";
  if (!isJs && !isPy) return [];

  const tree = parseSource(language, code);
  if (!tree) return [];
  const root = tree.rootNode;

  const bindings: { imported: string; local: string; line: number }[] = [];
  for (const imp of extractImportsFromTree(language, root)) {
    if (imp.kind === "side-effect" || imp.kind === "dynamic" || imp.kind === "re-export") continue;
    for (const s of imp.specifiers) bindings.push({ imported: s.imported, local: s.local, line: imp.line });
  }
  if (bindings.length === 0) return [];

  const used = collectUsages(root, UNUSED_SKIP[isJs ? "js" : "py"]);
  return bindings.filter((b) => !used.has(b.local));
}

// ============================================================
// Sibling naming (for surfacing a live sibling next to a dead symbol)
// ============================================================

const SIBLING_SUFFIXES = [
  "Response", "Request", "Result", "Dto", "DTO", "Model", "Type", "Interface",
  "Props", "Args", "Options", "Config", "Service", "Controller", "Handler",
  "Schema", "Entity", "Input", "Output", "Payload", "Params", "Response",
];

/** Strip one trailing role-suffix from a symbol name to get its conceptual stem. */
export function symbolStem(name: string): string {
  for (const suffix of SIBLING_SUFFIXES) {
    if (name.length > suffix.length && name.endsWith(suffix)) {
      return name.slice(0, -suffix.length);
    }
  }
  return name;
}
