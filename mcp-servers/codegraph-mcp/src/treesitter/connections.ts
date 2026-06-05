import * as fs from "fs";
import Parser from "tree-sitter";

import { DependencyGraph, Language } from "../types.js";
import { parseSource } from "./parser.js";
import { cppFunctionName } from "./symbols.js";
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
    covered.add(node.path);

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
      setInfo(key, node.path, sym.name, sym.line);
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
          setInfo(key, dep, sym.name, sym.line);
        }
      }
    }

    const moduleKey = `${node.path}#(module)`;
    setInfo(moduleKey, node.path, "(module top-level)", 0);
    const resolveName = (name: string): string | null =>
      localResolve.get(name) ?? sameFile.get(name) ?? includeResolve.get(name) ?? null;

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
        setInfo(encl, node.path, tn, n.startPosition.row + 1);
      }
      if (n.type === ATTR) {
        const obj = n.childForFieldName(OBJ);
        const mem = n.childForFieldName(MEM);
        if (obj && obj.type === "identifier" && mem && moduleAlias.has(obj.text)) {
          addEdge(encl, `${moduleAlias.get(obj.text)}#${mem.text}`);
        }
        // Recurse into the object only — skip the member identifier.
        if (obj) walk(obj, encl);
        return;
      }
      if (n.type === "identifier") {
        const tgt = resolveName(n.text);
        if (tgt) addEdge(encl, tgt);
      }
      for (const c of n.namedChildren) walk(c, encl);
    };
    walk(tree.rootNode, moduleKey);
  }

  return { uses, usedBy, info, covered };
}
