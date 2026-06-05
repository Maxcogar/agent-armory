import * as path from "path";
import ts from "typescript";

// ============================================================
// Authoritative TS/JS export liveness (TypeScript compiler)
// ============================================================
//
// Phase 1 liveness is syntactic and returns `ambiguous` for re-export barrels
// and namespace imports. This module resolves those authoritatively: it builds a
// real TypeScript Program and, by resolving every identifier usage to the symbol
// it binds (following `export *` barrels, namespace imports, and aliases), learns
// which exported symbols are referenced from *another* file. An export with no
// such reference is genuinely unused; one with a reference is used. No ambiguity.

export interface TsLiveness {
  /** Keys `${absFile}#${exportName}` referenced from a different file. */
  usedExternally: Set<string>;
  /** Absolute paths the Program actually covers (TS/JS source files). */
  covered: Set<string>;
}

export function loadCompilerOptions(rootDir: string): ts.CompilerOptions {
  const base: ts.CompilerOptions = {
    allowJs: true,
    checkJs: false,
    noEmit: true,
    skipLibCheck: true,
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    allowImportingTsExtensions: true,
  };
  const configPath = ts.findConfigFile(rootDir, ts.sys.fileExists, "tsconfig.json");
  if (!configPath) return base;
  try {
    const read = ts.readConfigFile(configPath, ts.sys.readFile);
    const parsed = ts.parseJsonConfigFileContent(read.config ?? {}, ts.sys, path.dirname(configPath));
    // Keep the project's paths/baseUrl, but force noEmit/allowJs so any project compiles.
    return { ...parsed.options, ...base, baseUrl: parsed.options.baseUrl, paths: parsed.options.paths };
  } catch {
    return base;
  }
}

/** True when `id` is the declared name of its declaration (not a usage). */
export function isDeclarationName(id: ts.Identifier): boolean {
  const p = id.parent as ts.Node & { name?: ts.Node };
  return !!p && "name" in p && p.name === id &&
    (ts.isFunctionDeclaration(p) || ts.isClassDeclaration(p) || ts.isInterfaceDeclaration(p) ||
      ts.isTypeAliasDeclaration(p) || ts.isEnumDeclaration(p) || ts.isVariableDeclaration(p) ||
      ts.isMethodDeclaration(p) || ts.isPropertyDeclaration(p) || ts.isParameter(p));
}

/**
 * Build the Program over `tsJsFiles` and return which exported symbols are
 * referenced cross-file. Defensive: any failure yields an empty result so the
 * caller falls back to the syntactic verdict rather than crashing.
 */
/** Build a TypeScript Program over the given files, or null on failure. Exposed
 *  so callers can build it once and share it across the liveness + connection
 *  passes instead of paying for two full programs. */
export function createTsProgram(rootDir: string, tsJsFiles: string[]): ts.Program | null {
  if (tsJsFiles.length === 0) return null;
  try {
    return ts.createProgram(tsJsFiles, loadCompilerOptions(rootDir));
  } catch {
    return null;
  }
}

export function computeTsLiveness(
  rootDir: string,
  tsJsFiles: string[],
  sharedProgram?: ts.Program | null
): TsLiveness {
  const covered = new Set(tsJsFiles.map((f) => path.resolve(f)));
  const usedExternally = new Set<string>();
  if (tsJsFiles.length === 0) return { usedExternally, covered };

  const program = sharedProgram ?? createTsProgram(rootDir, tsJsFiles);
  if (!program) return { usedExternally, covered };
  const checker = program.getTypeChecker();

  const record = (id: ts.Identifier, curFile: string): void => {
    let sym = checker.getSymbolAtLocation(id);
    if (!sym) return;
    if (sym.flags & ts.SymbolFlags.Alias) {
      try {
        sym = checker.getAliasedSymbol(sym);
      } catch {
        /* keep the alias symbol */
      }
    }
    for (const decl of sym.declarations ?? []) {
      const declFile = path.resolve(decl.getSourceFile().fileName);
      if (!covered.has(declFile) || declFile === curFile) continue;
      usedExternally.add(`${declFile}#${sym.getName()}`);
    }
  };

  for (const sf of program.getSourceFiles()) {
    if (sf.isDeclarationFile) continue;
    const curFile = path.resolve(sf.fileName);
    if (!covered.has(curFile)) continue;
    const visit = (node: ts.Node): void => {
      if (ts.isIdentifier(node) && !isDeclarationName(node)) record(node, curFile);
      ts.forEachChild(node, visit);
    };
    ts.forEachChild(sf, visit);
  }

  return { usedExternally, covered };
}
