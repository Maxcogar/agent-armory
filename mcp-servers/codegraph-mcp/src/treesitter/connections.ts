import * as fs from "fs";
import * as path from "path";
import Parser from "tree-sitter";

import { DependencyGraph } from "../types.js";
import { parseSource } from "./parser.js";
import { cppFunctionName } from "./symbols.js";
import { goModuleName, resolveGoPackageDir } from "../parsers/golang.js";
import { getTransitiveDependencies } from "../graph.js";
import { SymbolGraphBuilder, enclosingDeclKey } from "./graphbuilder.js";
import type { SymbolGraph } from "../tscompiler/connections.js";

// ============================================================
// Symbol-to-symbol reference graph for Python / C++ (tree-sitter)
// ============================================================
//
// The TypeScript compiler gives precise symbol references for TS/JS. For Python
// and C++ there is no such compiler here, so we resolve references from the data
// already extracted: a file's imports tell us exactly which symbol an imported
// name binds to, and (for C++) a file's includes tell us which files declare the
// functions it can call. We then walk each top-level declaration's body and, for
// every identifier that resolves to a known symbol, record an edge. The result
// has the same shape as the TS graph, so `trace_symbol` can merge them.

type Node = Parser.SyntaxNode;

export function computeTreeSitterConnections(graph: DependencyGraph): SymbolGraph {
  const b = new SymbolGraphBuilder();

  for (const node of graph.nodes.values()) {
    const lang = node.language;
    if (lang !== "python" && lang !== "cpp" && lang !== "arduino") continue;

    let code: string;
    try {
      code = fs.readFileSync(node.path, "utf-8");
    } catch {
      continue;
    }
    const tree = parseSource(lang, code);
    if (!tree) continue;
    b.covered.add(node.path);

    // Resolution maps: a used name -> the symbol key it binds to.
    const localResolve = new Map<string, string>(); // named import: local -> `${file}#${imported}`
    const moduleAlias = new Map<string, string>(); // namespace/module import: alias -> file
    for (const e of node.imports ?? []) {
      if (e.resolution !== "internal" || !e.to) continue;
      for (const s of e.specifiers) {
        if (s.kind === "named") localResolve.set(s.local, `${e.to}#${s.imported}`);
        else moduleAlias.set(s.local, e.to);
      }
    }
    const sameFile = new Map<string, string>();
    for (const sym of node.symbols ?? []) {
      const key = `${node.path}#${sym.name}`;
      sameFile.set(sym.name, key);
      b.setInfo(key, node.path, sym.name, sym.line);
    }
    // C++ resolves calls by name against symbols declared in #included files.
    const includeResolve = new Map<string, string>();
    if (lang === "cpp" || lang === "arduino") {
      for (const dep of node.dependencies) {
        const dn = graph.nodes.get(dep);
        if (!dn?.symbols) continue;
        for (const sym of dn.symbols) {
          const key = `${dep}#${sym.name}`;
          if (!includeResolve.has(sym.name)) includeResolve.set(sym.name, key);
          b.setInfo(key, dep, sym.name, sym.line);
        }
      }
    }

    // `from mod import *` makes every name of `mod` resolvable directly.
    const starResolve = new Map<string, string>();
    for (const e of node.imports ?? []) {
      if (e.resolution !== "internal" || !e.to) continue;
      if (!e.specifiers.some((s) => s.kind === "namespace" && s.local === "*")) continue;
      const target = graph.nodes.get(e.to);
      if (target?.symbols) {
        for (const sym of target.symbols) {
          const key = `${e.to}#${sym.name}`;
          if (!starResolve.has(sym.name)) starResolve.set(sym.name, key);
          b.setInfo(key, e.to, sym.name, sym.line);
        }
      }
    }

    const moduleKey = b.moduleKey(node.path);
    const resolveName = (name: string): string | null =>
      localResolve.get(name) ?? sameFile.get(name) ?? includeResolve.get(name) ?? starResolve.get(name) ?? null;

    const ATTR = lang === "python" ? "attribute" : "field_expression";
    const OBJ = lang === "python" ? "object" : "argument";
    const MEM = lang === "python" ? "attribute" : "field";

    const topName = (n: Node): string | null => {
      if (lang === "python") {
        if (n.type === "function_definition" || n.type === "class_definition") {
          const p = n.parent;
          if (p && (p.type === "module" || (p.type === "decorated_definition" && p.parent?.type === "module"))) {
            return n.childForFieldName("name")?.text ?? null;
          }
        }
        return null;
      }
      if (n.type === "function_definition" && n.parent?.type === "translation_unit") {
        return cppFunctionName(n.childForFieldName("declarator")) ?? null;
      }
      return null;
    };

    const walk = (n: Node, enclosing: string): void => {
      let encl = enclosing;
      const tn = topName(n);
      if (tn) {
        encl = `${node.path}#${tn}`;
        b.setInfo(encl, node.path, tn, n.startPosition.row + 1);
      }
      if (n.type === ATTR) {
        const obj = n.childForFieldName(OBJ);
        const mem = n.childForFieldName(MEM);
        if (obj && obj.type === "identifier" && mem && moduleAlias.has(obj.text)) {
          b.addEdge(encl, `${moduleAlias.get(obj.text)}#${mem.text}`);
        }
        // Recurse into the object only — skip the member identifier.
        if (obj) walk(obj, encl);
        return;
      }
      if (n.type === "identifier") {
        const tgt = resolveName(n.text);
        if (tgt) b.addEdge(encl, tgt);
      }
      for (const c of n.namedChildren) walk(c, encl);
    };
    walk(tree.rootNode, moduleKey);
  }

  return b.result();
}

// ============================================================
// Ruby connections (require-closure-scoped name resolution)
// ============================================================
//
// Ruby has no per-import name binding — required code is global — so a reference
// resolves by name within the file's require-transitive closure (the files it
// can actually see). A name that's unique in that closure resolves precisely; an
// ambiguous one is left unresolved (we never invent a link). Ruby's pervasive
// runtime metaprogramming is why Ruby is excluded from dead-code *claims*, not
// from connection tracing.

export function computeRubyConnections(graph: DependencyGraph): SymbolGraph {
  const b = new SymbolGraphBuilder();

  for (const node of graph.nodes.values()) {
    if (node.language !== "ruby" || !node.symbols) continue;
    let code: string;
    try {
      code = fs.readFileSync(node.path, "utf-8");
    } catch {
      continue;
    }
    const tree = parseSource("ruby", code);
    if (!tree) continue;
    b.covered.add(node.path);

    // Files this file can see: itself + everything it transitively requires.
    const visible = new Set<string>([node.path, ...getTransitiveDependencies(graph, node.path)]);
    const byName = new Map<string, string[]>();
    for (const f of visible) {
      const fn = graph.nodes.get(f);
      if (!fn?.symbols) continue;
      for (const sym of fn.symbols) {
        const key = `${f}#${sym.name}`;
        (byName.get(sym.name) ?? byName.set(sym.name, []).get(sym.name)!).push(key);
        b.setInfo(key, f, sym.name, sym.line);
      }
    }
    const ownNames = new Set(node.symbols.map((s) => s.name));
    const resolve = (name: string): string | null => {
      if (ownNames.has(name)) return `${node.path}#${name}`;
      const keys = byName.get(name);
      return keys && keys.length === 1 ? keys[0] : null;
    };

    // Attribute each reference to its enclosing class/module/method (structural),
    // falling back to the file's module-load scope at top level.
    const moduleKey = b.moduleKey(node.path);
    const walk = (n: Node, enclosing: string): void => {
      const declKey = enclosingDeclKey("ruby", n, node.path);
      const encl = declKey ?? enclosing;
      if ((n.type === "constant" || n.type === "identifier") && n.namedChildCount === 0) {
        const target = resolve(n.text);
        if (target) b.addEdge(encl, target);
      }
      for (const c of n.namedChildren) walk(c, encl);
    };
    walk(tree.rootNode, moduleKey);
  }

  return b.result();
}

// ============================================================
// Precise Go connections (package-scoped — no global collisions)
// ============================================================
//
// Go references resolve by package: identifiers in the same directory share the
// package scope (so a call to another file's function in the same package
// resolves precisely), and `alias.Member` resolves to `Member` in the imported
// package's directory. Resolution is scoped to the package, so unlike the
// name-based fallback it cannot mis-resolve a colliding name in another package.

export function computeGoConnections(graph: DependencyGraph): SymbolGraph {
  const b = new SymbolGraphBuilder();

  const moduleName = goModuleName(graph.rootDir);
  // Parse each Go file once; index symbols by directory and record each
  // directory's *declared* package name (which need not match the dir name).
  const dirSymbols = new Map<string, Map<string, string>>();
  const dirPackageName = new Map<string, string>();
  const parsed: { node: { path: string; imports?: { resolution: string; raw: string; specifiers: { local: string }[] }[]; symbols?: { name: string; line: number }[] }; root: Node }[] = [];
  for (const node of graph.nodes.values()) {
    if (node.language !== "go" || !node.symbols) continue;
    let code: string;
    try {
      code = fs.readFileSync(node.path, "utf-8");
    } catch {
      continue;
    }
    const tree = parseSource("go", code);
    if (!tree) continue;
    parsed.push({ node, root: tree.rootNode });
    const dir = path.dirname(node.path);
    let m = dirSymbols.get(dir);
    if (!m) dirSymbols.set(dir, (m = new Map()));
    for (const sym of node.symbols) {
      const key = `${node.path}#${sym.name}`;
      if (!m.has(sym.name)) m.set(sym.name, key);
      b.setInfo(key, node.path, sym.name, sym.line);
    }
    if (!dirPackageName.has(dir)) {
      const pkg = tree.rootNode.descendantsOfType("package_clause")[0]?.namedChild(0)?.text;
      if (pkg) dirPackageName.set(dir, pkg);
    }
  }

  for (const { node, root } of parsed) {
    b.covered.add(node.path);

    const sameDir = dirSymbols.get(path.dirname(node.path)) ?? new Map<string, string>();
    const aliasDir = new Map<string, Map<string, string>>();
    for (const e of node.imports ?? []) {
      if (e.resolution !== "internal") continue;
      const d = resolveGoPackageDir(e.raw, graph.rootDir, moduleName);
      const syms = d ? dirSymbols.get(d) : undefined;
      if (!syms) continue;
      // Register under the import's local name AND the package's declared name,
      // so `pkg.Sym` resolves even when the package name != the directory name.
      const local = e.specifiers[0]?.local;
      if (local) aliasDir.set(local, syms);
      const pkg = d ? dirPackageName.get(d) : undefined;
      if (pkg) aliasDir.set(pkg, syms);
    }

    const moduleKey = b.moduleKey(node.path);
    const walk = (n: Node, enclosing: string): void => {
      const declKey = enclosingDeclKey("go", n, node.path);
      const encl = declKey ?? enclosing;
      if (n.type === "selector_expression") {
        const operand = n.childForFieldName("operand");
        const field = n.childForFieldName("field");
        if (operand && field && operand.type === "identifier" && aliasDir.has(operand.text)) {
          const target = aliasDir.get(operand.text)!.get(field.text);
          if (target) b.addEdge(encl, target);
          walk(operand, encl);
          return;
        }
      }
      if (n.type === "identifier") {
        // A bare identifier matching a package-level name is a use of it. A local
        // variable that shadows that name would be counted here too, but only in
        // the safe direction: at worst it over-counts a use (making a symbol look
        // live), which can never produce a *false dead* — the one verdict this
        // tool guarantees. Disambiguating would need full local-scope tracking,
        // which precise dead-code detection does not require.
        const target = sameDir.get(n.text);
        if (target) b.addEdge(encl, target);
      }
      for (const c of n.namedChildren) walk(c, encl);
    };
    walk(root, moduleKey);
  }

  return b.result();
}
