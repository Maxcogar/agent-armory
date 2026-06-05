import * as fs from "fs";
import Parser from "tree-sitter";

import { DependencyGraph, Language, SymbolNode } from "../types.js";
import { parseSource } from "./parser.js";
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

interface NsConfig {
  sep: string;
  /** Node types whose text is a leaf identifier that may name a type. */
  refTypes: ReadonlySet<string>;
  namespaceOf(root: Node): string | null;
  /** Imports as { fqn } (single type) or { namespace, wildcard:true }. */
  importsOf(root: Node): { fqn?: string; namespace?: string; alias?: string }[];
}

const TYPE_KINDS: ReadonlySet<string> = new Set(["class", "interface", "enum", "type"]);

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

const CONFIGS: Partial<Record<Language, NsConfig>> = { java: JAVA, csharp: CSHARP, php: PHP };

const NS_LANGS: ReadonlySet<Language> = new Set<Language>(["java", "csharp", "php"]);

export function computeNamespacedConnections(graph: DependencyGraph): SymbolGraph {
  const uses = new Map<string, Set<string>>();
  const usedBy = new Map<string, Set<string>>();
  const info = new Map<string, { file: string; name: string; line: number }>();
  const covered = new Set<string>();
  const ensure = (m: Map<string, Set<string>>, k: string): Set<string> => {
    let s = m.get(k);
    if (!s) m.set(k, (s = new Set()));
    return s;
  };
  const addEdge = (from: string, to: string): void => {
    if (from === to) return;
    ensure(uses, from).add(to);
    ensure(usedBy, to).add(from);
  };
  const setInfo = (key: string, file: string, name: string, line: number): void => {
    if (!info.has(key)) info.set(key, { file, name, line });
  };

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
    const namespace = cfg.namespaceOf(tree.rootNode) ?? "";
    parsed.push({ file: node.path, language: node.language, root: tree.rootNode, namespace, symbols: node.symbols });

    for (const sym of node.symbols) {
      const key = `${node.path}#${sym.name}`;
      setInfo(key, node.path, sym.name, sym.line);
      if (!TYPE_KINDS.has(sym.kind)) continue;
      const fqn = joinNs(namespace, sym.name, cfg.sep);
      if (!fqnIndex.has(fqn)) fqnIndex.set(fqn, key);
      (nsTypes.get(namespace) ?? nsTypes.set(namespace, []).get(namespace)!).push({ name: sym.name, key });
    }
  }

  for (const p of parsed) {
    const cfg = CONFIGS[p.language]!;
    covered.add(p.file);
    const moduleKey = `${p.file}#(module)`;
    setInfo(moduleKey, p.file, "(module top-level)", 0);

    // simple name -> key, from same-namespace types, imports, and the file's own
    // declarations (so a method/type referencing another in the same file links).
    const nameToKey = new Map<string, string>();
    for (const t of nsTypes.get(p.namespace) ?? []) nameToKey.set(t.name, t.key);
    for (const imp of cfg.importsOf(p.root)) {
      if (imp.fqn) {
        const key = fqnIndex.get(imp.fqn);
        if (key) nameToKey.set(imp.alias ?? imp.fqn.split(cfg.sep).pop()!, key);
      } else if (imp.namespace) {
        for (const t of nsTypes.get(imp.namespace) ?? []) nameToKey.set(t.name, t.key);
      }
    }
    for (const s of p.symbols) nameToKey.set(s.name, `${p.file}#${s.name}`);
    if (nameToKey.size === 0) continue;

    const syms = [...p.symbols].sort((a, b) => a.line - b.line);
    const ownerAt = (line: number): string => {
      let o = moduleKey;
      for (const s of syms) {
        if (s.line <= line) o = `${p.file}#${s.name}`;
        else break;
      }
      return o;
    };

    const stack: Node[] = [p.root];
    while (stack.length > 0) {
      const n = stack.pop()!;
      if (n.namedChildCount === 0 && cfg.refTypes.has(n.type)) {
        const key = nameToKey.get(n.text);
        if (key) addEdge(ownerAt(n.startPosition.row + 1), key);
      }
      for (const c of n.namedChildren) stack.push(c);
    }
  }

  return { uses, usedBy, info, covered };
}

export { NS_LANGS };
