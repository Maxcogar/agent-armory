import * as fs from "fs";
import Parser from "tree-sitter";

import { DependencyGraph, Language, SymbolNode, ImportEdge } from "../types.js";
import { parseSource } from "./parser.js";
import { rustCrateRoot, rustModulePath } from "../parsers/rust.js";
import { SymbolGraphBuilder, enclosingDeclKey } from "./graphbuilder.js";
import type { SymbolGraph } from "../tscompiler/connections.js";

// ============================================================
// Precise connections for fully-qualified-name languages (Java / C# / PHP)
// ============================================================
//
// These languages name a type by namespace/package + simple name. Resolution is
// exact: a global index maps each fully-qualified type name to its declaration,
// and within a file a simple name resolves through (a) explicit imports, (b)
// same-namespace types, (c) wildcard/`using` imports of a whole namespace. A
// colliding simple name in a different namespace can't mis-resolve, because the
// import pins the namespace. Cross-file references in these languages are
// type-to-type (instance method calls need type inference we don't do), so the
// index and edges are over types, attributed to the enclosing declaration.

type Node = Parser.SyntaxNode;

interface NsCtx {
  filePath: string;
  crateRoot: string | null;
}

interface NsConfig {
  sep: string;
  /** Node types whose text is a leaf identifier that may name a type. */
  refTypes: ReadonlySet<string>;
  /** Symbol kinds to put in the cross-file index (types; Rust adds functions). */
  indexKinds?: ReadonlySet<string>;
  namespaceOf(root: Node, ctx: NsCtx): string | null;
  /** Imports as { fqn } (single name) or { namespace } (whole namespace/wildcard). */
  importsOf(root: Node): { fqn?: string; namespace?: string; alias?: string }[];
}

const TYPE_KINDS: ReadonlySet<string> = new Set(["class", "interface", "enum", "type"]);
const RUST_INDEX_KINDS: ReadonlySet<string> = new Set(["class", "interface", "enum", "type", "function", "const"]);

function joinNs(ns: string, name: string, sep: string): string {
  return ns ? ns + sep + name : name;
}

// ---------- per-language extractors ----------

const JAVA: NsConfig = {
  sep: ".",
  refTypes: new Set(["type_identifier", "identifier"]),
  namespaceOf: (root) => root.descendantsOfType("package_declaration")[0]?.namedChild(0)?.text ?? null,
  importsOf: (root) => {
    const out: { fqn?: string; namespace?: string }[] = [];
    for (const imp of root.descendantsOfType("import_declaration")) {
      const scoped = imp.namedChildren.find((c) => c.type === "scoped_identifier" || c.type === "identifier");
      if (!scoped) continue;
      if (imp.namedChildren.some((c) => c.type === "asterisk")) out.push({ namespace: scoped.text });
      else out.push({ fqn: scoped.text });
    }
    return out;
  },
};

const CSHARP: NsConfig = {
  sep: ".",
  refTypes: new Set(["identifier"]),
  namespaceOf: (root) => {
    const ns = root.descendantsOfType(["namespace_declaration", "file_scoped_namespace_declaration"])[0];
    return ns?.childForFieldName("name")?.text ?? null;
  },
  importsOf: (root) => {
    const out: { namespace?: string; fqn?: string; alias?: string }[] = [];
    for (const u of root.descendantsOfType("using_directive")) {
      const name = u.childForFieldName("name") ?? u.namedChildren.find((c) => c.type === "qualified_name" || c.type === "identifier");
      if (name) out.push({ namespace: name.text });
    }
    return out;
  },
};

const PHP: NsConfig = {
  sep: "\\",
  refTypes: new Set(["name"]),
  namespaceOf: (root) => root.descendantsOfType("namespace_definition")[0]?.childForFieldName("name")?.text ?? null,
  importsOf: (root) => {
    const out: { fqn?: string; alias?: string }[] = [];
    for (const decl of root.descendantsOfType("namespace_use_declaration")) {
      for (const clause of decl.descendantsOfType("namespace_use_clause")) {
        const q = clause.namedChildren.find((c) => c.type === "qualified_name" || c.type === "name");
        if (!q) continue;
        const aliasNode = clause.childForFieldName("alias");
        out.push({ fqn: q.text.replace(/^\\/, ""), alias: aliasNode?.text });
      }
    }
    return out;
  },
};

function collectRustUse(
  node: Node,
  prefix: string,
  out: { fqn?: string; namespace?: string; alias?: string }[]
): void {
  const withPrefix = (s: string): string => (prefix ? `${prefix}::${s}` : s);
  switch (node.type) {
    case "identifier":
    case "scoped_identifier":
    case "crate":
      out.push({ fqn: withPrefix(node.text) });
      break;
    case "use_as_clause": {
      const pathNode = node.childForFieldName("path") ?? node.namedChild(0);
      if (pathNode) out.push({ fqn: withPrefix(pathNode.text), alias: node.childForFieldName("alias")?.text });
      break;
    }
    case "use_wildcard": {
      const p = node.namedChild(0);
      out.push({ namespace: p ? withPrefix(p.text) : prefix });
      break;
    }
    case "scoped_use_list": {
      const pathNode = node.childForFieldName("path");
      const list = node.childForFieldName("list") ?? node.namedChildren.find((c) => c.type === "use_list");
      const base = pathNode ? withPrefix(pathNode.text) : prefix;
      if (list) for (const item of list.namedChildren) collectRustUse(item, base, out);
      break;
    }
    case "use_list":
      for (const item of node.namedChildren) collectRustUse(item, prefix, out);
      break;
    case "self":
      if (prefix) out.push({ namespace: prefix });
      break;
  }
}

const RUST: NsConfig = {
  sep: "::",
  refTypes: new Set(["identifier", "type_identifier"]),
  indexKinds: RUST_INDEX_KINDS,
  namespaceOf: (_root, ctx) => rustModulePath(ctx.filePath, ctx.crateRoot),
  importsOf: (root) => {
    const out: { fqn?: string; namespace?: string; alias?: string }[] = [];
    for (const use of root.descendantsOfType("use_declaration")) {
      const arg = use.namedChildren.find((c) => c.type !== "visibility_modifier");
      if (arg) collectRustUse(arg, "", out);
    }
    return out;
  },
};

const CONFIGS: Partial<Record<Language, NsConfig>> = { java: JAVA, csharp: CSHARP, php: PHP, rust: RUST };

const NS_LANGS: ReadonlySet<Language> = new Set<Language>(["java", "csharp", "php", "rust"]);

export function computeNamespacedConnections(graph: DependencyGraph): SymbolGraph {
  const b = new SymbolGraphBuilder();

  // Parse each file once; collect namespace + type symbols; build the FQN index.
  interface Parsed {
    file: string;
    language: Language;
    root: Node;
    namespace: string;
    symbols: SymbolNode[];
  }
  const parsed: Parsed[] = [];
  const fqnIndex = new Map<string, string>(); // fully-qualified type name -> key
  const nsTypes = new Map<string, { name: string; key: string }[]>(); // namespace -> types

  const crateRoot = rustCrateRoot(
    [...graph.nodes.values()].filter((n) => n.language === "rust").map((n) => n.path)
  );

  for (const node of graph.nodes.values()) {
    const cfg = CONFIGS[node.language];
    if (!cfg || !node.symbols) continue;
    let code: string;
    try {
      code = fs.readFileSync(node.path, "utf-8");
    } catch {
      continue;
    }
    const tree = parseSource(node.language, code);
    if (!tree) continue;
    const namespace = cfg.namespaceOf(tree.rootNode, { filePath: node.path, crateRoot }) ?? "";
    parsed.push({ file: node.path, language: node.language, root: tree.rootNode, namespace, symbols: node.symbols });

    const indexKinds = cfg.indexKinds ?? TYPE_KINDS;
    for (const sym of node.symbols) {
      const key = `${node.path}#${sym.name}`;
      b.setInfo(key, node.path, sym.name, sym.line);
      if (!indexKinds.has(sym.kind)) continue;
      const fqn = joinNs(namespace, sym.name, cfg.sep);
      if (!fqnIndex.has(fqn)) fqnIndex.set(fqn, key);
      (nsTypes.get(namespace) ?? nsTypes.set(namespace, []).get(namespace)!).push({ name: sym.name, key });
    }
  }

  // name lookup within a namespace, for the prefix fallback below.
  const nsTypeByName = new Map<string, Map<string, string>>();
  for (const [ns, types] of nsTypes) {
    const m = new Map<string, string>();
    for (const t of types) if (!m.has(t.name)) m.set(t.name, t.key);
    nsTypeByName.set(ns, m);
  }
  // Resolve a fully-qualified name, falling back to the final segment within the
  // longest matching module/namespace prefix. This handles names declared in an
  // inline `mod {}` (Rust) or nested namespace whose own module path isn't a
  // file: `crate::a::b::Item` resolves to `Item` in module `crate::a` when `b`
  // is an inline submodule of that file.
  const resolveFqn = (fqn: string, sep: string): string | null => {
    const exact = fqnIndex.get(fqn);
    if (exact) return exact;
    const parts = fqn.split(sep);
    const name = parts[parts.length - 1];
    for (let i = parts.length - 1; i >= 1; i--) {
      const k = nsTypeByName.get(parts.slice(0, i).join(sep))?.get(name);
      if (k) return k;
    }
    return null;
  };

  for (const p of parsed) {
    const cfg = CONFIGS[p.language]!;
    b.covered.add(p.file);
    const moduleKey = b.moduleKey(p.file);

    // simple name -> key, from same-namespace types, imports, and the file's own
    // declarations (so a method/type referencing another in the same file links).
    const nameToKey = new Map<string, string>();
    for (const t of nsTypes.get(p.namespace) ?? []) nameToKey.set(t.name, t.key);
    for (const imp of cfg.importsOf(p.root)) {
      if (imp.fqn) {
        const key = resolveFqn(imp.fqn, cfg.sep);
        if (key) nameToKey.set(imp.alias ?? imp.fqn.split(cfg.sep).pop()!, key);
      } else if (imp.namespace) {
        for (const t of nsTypes.get(imp.namespace) ?? []) nameToKey.set(t.name, t.key);
      }
    }
    for (const s of p.symbols) nameToKey.set(s.name, `${p.file}#${s.name}`);
    if (nameToKey.size === 0) continue;

    // Attribute each leaf type reference to its enclosing declaration (the type,
    // method, or function it sits in), structurally — not by line proximity.
    const walk = (n: Node, enclosing: string): void => {
      const declKey = enclosingDeclKey(p.language, n, p.file);
      const encl = declKey ?? enclosing;
      if (n.namedChildCount === 0 && cfg.refTypes.has(n.type)) {
        const key = nameToKey.get(n.text);
        if (key) b.addEdge(encl, key);
      }
      for (const c of n.namedChildren) walk(c, encl);
    };
    walk(p.root, moduleKey);
  }

  return b.result();
}

/**
 * Populate `node.imports` for the FQN languages (Java/C#/PHP/Rust) with
 * internal/external resolution, so list_external_dependencies and
 * find_broken_imports cover them. An import that resolves to a project type
 * (via the FQN index) or namespace is internal; otherwise it is external
 * (stdlib/third-party). Mutates the nodes.
 */
export function resolveNamespacedImports(graph: DependencyGraph): void {
  const crateRoot = rustCrateRoot(
    [...graph.nodes.values()].filter((n) => n.language === "rust").map((n) => n.path)
  );
  const fqnToFile = new Map<string, string>();
  const namespaces = new Set<string>();
  const parsed: { node: { path: string }; root: Node; cfg: NsConfig; imports?: ImportEdge[] }[] = [];

  for (const node of graph.nodes.values()) {
    const cfg = CONFIGS[node.language];
    if (!cfg || !node.symbols) continue;
    let code: string;
    try {
      code = fs.readFileSync(node.path, "utf-8");
    } catch {
      continue;
    }
    const tree = parseSource(node.language, code);
    if (!tree) continue;
    const namespace = cfg.namespaceOf(tree.rootNode, { filePath: node.path, crateRoot }) ?? "";
    namespaces.add(namespace);
    parsed.push({ node, root: tree.rootNode, cfg });
    const indexKinds = cfg.indexKinds ?? TYPE_KINDS;
    for (const sym of node.symbols) {
      if (!indexKinds.has(sym.kind)) continue;
      const fqn = joinNs(namespace, sym.name, cfg.sep);
      if (!fqnToFile.has(fqn)) fqnToFile.set(fqn, node.path);
    }
  }

  for (const p of parsed) {
    const edges: ImportEdge[] = [];
    for (const imp of p.cfg.importsOf(p.root)) {
      let to: string | null = null;
      let resolution: ImportEdge["resolution"];
      let raw: string;
      if (imp.fqn) {
        raw = imp.fqn;
        to = fqnToFile.get(imp.fqn) ?? null;
        resolution = to ? "internal" : "external";
      } else if (imp.namespace) {
        raw = imp.namespace;
        resolution = namespaces.has(imp.namespace) ? "internal" : "external";
      } else {
        continue;
      }
      if (to === p.node.path) continue;
      edges.push({ raw, kind: "value", specifiers: [], line: 0, to, resolution });
    }
    (graph.nodes.get(p.node.path) as { imports?: ImportEdge[] }).imports = edges;
  }
}

export { NS_LANGS };
