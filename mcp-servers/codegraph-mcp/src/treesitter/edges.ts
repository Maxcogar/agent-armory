import * as fs from "fs";
import * as path from "path";

import { Language, ImportEdge, RawImport } from "../types.js";
import { extractImports } from "./imports.js";
import { resolveJsModule } from "../parsers/javascript.js";
import { resolvePythonModule } from "../parsers/python.js";
import { resolveCppModule } from "../parsers/cpp.js";

// ============================================================
// Resolved import edges (tree-sitter extraction + shared resolvers)
// ============================================================
//
// Produces the rich ImportEdge list for a file: tree-sitter supplies the raw
// imports (kind + specifiers), and resolution reuses the *same* per-language
// resolvers the legacy `dependencies` path uses, so internal edges here match
// `dependencies` (proven for JS/TS by the integration parity test).

/** What import resolution needs from the scan (a subset of the parse context). */
export interface ImportResolveContext {
  rootDir: string;
  cppSearchDirs: string[];
}

const GRAMMAR_LANGUAGES: ReadonlySet<Language> = new Set<Language>([
  "typescript",
  "javascript",
  "python",
  "cpp",
  "arduino",
]);

export function isGrammarLanguage(language: Language): boolean {
  return GRAMMAR_LANGUAGES.has(language);
}

/**
 * Resolve already-extracted raw imports into edges, reusing the per-language
 * resolvers. Shared by {@link parseFileImports} and the combined single-parse
 * analyzer so resolution lives in one place. Self-imports are dropped.
 */
export function resolveImports(
  filePath: string,
  language: Language,
  raws: RawImport[],
  ctx: ImportResolveContext
): ImportEdge[] {
  const fromDir = path.dirname(filePath);
  const edges: ImportEdge[] = [];
  for (const imp of raws) {
    let to: string | null = null;
    let resolution: ImportEdge["resolution"] = "external";

    switch (language) {
      case "typescript":
      case "javascript":
        ({ to, resolution } = resolveJsModule(imp.raw, fromDir, ctx.rootDir));
        break;
      case "python":
        ({ to, resolution } = resolvePythonModule(imp.raw, filePath, ctx.rootDir));
        break;
      case "cpp":
      case "arduino":
        ({ to, resolution } = resolveCppModule(imp.raw, fromDir, ctx.cppSearchDirs));
        break;
      default:
        continue;
    }

    if (to === filePath) continue;
    edges.push({ ...imp, to, resolution });
  }
  return edges;
}

/**
 * Resolved import edges for a file, or `null` when the language has no
 * tree-sitter grammar (config/unknown). A grammar language with no imports
 * returns `[]` — distinguishing "analyzed, none found" from "not analyzed".
 */
export function parseFileImports(
  filePath: string,
  language: Language,
  ctx: ImportResolveContext
): ImportEdge[] | null {
  if (!GRAMMAR_LANGUAGES.has(language)) return null;
  let code: string;
  try {
    code = fs.readFileSync(filePath, "utf-8");
  } catch {
    return [];
  }
  return resolveImports(filePath, language, extractImports(language, code), ctx);
}
