import * as path from "path";
import ts from "typescript";

import { createTsProgram, isDeclarationName } from "./liveness.js";

// ============================================================
// Symbol-to-symbol reference graph (TypeScript compiler)
// ============================================================
//
// Builds "uses" edges between *symbols* (functions, classes, interfaces, types,
// module-level consts): an edge A -> B means the body of declaration A references
// symbol B. Top-level/module code is attributed to a synthetic `<file>#(module)`
// node (it runs on import). This lets a caller walk the whole connection chain
// in either direction — what reaches a thing, and what a thing reaches — to see
// where a chain ultimately lands or goes cold. No entry points, no setup.

export interface SymbolGraph {
  /** key -> set of keys it uses (downstream). */
  uses: Map<string, Set<string>>;
  /** key -> set of keys that use it (upstream). */
  usedBy: Map<string, Set<string>>;
  /** key -> readable { absolute file, name, 1-based decl line }. */
  info: Map<string, { file: string; name: string; line: number }>;
  /** Absolute TS/JS paths the Program covered. */
  covered: Set<string>;
}

const MODULE = "(module)";

export function computeSymbolConnections(
  rootDir: string,
  tsJsFiles: string[],
  sharedProgram?: ts.Program | null
): SymbolGraph {
  const covered = new Set(tsJsFiles.map((f) => path.resolve(f)));
  const uses = new Map<string, Set<string>>();
  const usedBy = new Map<string, Set<string>>();
  const info = new Map<string, { file: string; name: string; line: number }>();
  if (tsJsFiles.length === 0) return { uses, usedBy, info, covered };

  const program = sharedProgram ?? createTsProgram(rootDir, tsJsFiles);
  if (!program) return { uses, usedBy, info, covered };
  const checker = program.getTypeChecker();

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

  const keyOfSym = (sym: ts.Symbol): string | null => {
    for (const decl of sym.declarations ?? []) {
      const sf = decl.getSourceFile();
      const df = path.resolve(sf.fileName);
      if (!covered.has(df)) continue;
      const name = sym.getName();
      const key = `${df}#${name}`;
      setInfo(key, df, name, sf.getLineAndCharacterOfPosition(decl.getStart()).line + 1);
      return key;
    }
    return null;
  };

  // The nearest module-level declaration name (so nested code attributes to its
  // top-level owner, and we don't treat closures as separate "things").
  const moduleLevelName = (node: ts.Node): string | null => {
    const sf = node.getSourceFile();
    if (
      (ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node) ||
        ts.isTypeAliasDeclaration(node) || ts.isEnumDeclaration(node)) &&
      node.parent === sf
    ) {
      return node.name?.text ?? null;
    }
    if (
      ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) &&
      ts.isVariableDeclarationList(node.parent) && ts.isVariableStatement(node.parent.parent) &&
      node.parent.parent.parent === sf
    ) {
      return node.name.text;
    }
    return null;
  };

  for (const sf of program.getSourceFiles()) {
    if (sf.isDeclarationFile) continue;
    const curFile = path.resolve(sf.fileName);
    if (!covered.has(curFile)) continue;

    const moduleKey = `${curFile}#${MODULE}`;
    setInfo(moduleKey, curFile, "(module top-level)", 0);

    const visit = (node: ts.Node, enclosing: string): void => {
      let encl = enclosing;
      const mln = moduleLevelName(node);
      if (mln) {
        encl = `${curFile}#${mln}`;
        setInfo(encl, curFile, mln, sf.getLineAndCharacterOfPosition(node.getStart()).line + 1);
      }
      if (ts.isIdentifier(node) && !isDeclarationName(node)) {
        let sym = checker.getSymbolAtLocation(node);
        if (sym) {
          if (sym.flags & ts.SymbolFlags.Alias) {
            try {
              sym = checker.getAliasedSymbol(sym);
            } catch {
              /* keep alias */
            }
          }
          const usedKey = keyOfSym(sym);
          if (usedKey) addEdge(encl, usedKey);
        }
      }
      ts.forEachChild(node, (c) => visit(c, encl));
    };
    ts.forEachChild(sf, (n) => visit(n, moduleKey));
  }

  return { uses, usedBy, info, covered };
}
