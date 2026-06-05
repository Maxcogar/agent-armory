import * as fs from "fs";

import { Language, ImportEdge, SymbolNode } from "../types.js";
import { parseSource } from "./parser.js";
import { extractImportsFromTree } from "./imports.js";
import { extractSymbolsFromTree } from "./symbols.js";
import { resolveImports, isGrammarLanguage, ImportResolveContext } from "./edges.js";

// ============================================================
// Single-parse file analysis (imports + symbols from one tree)
// ============================================================
//
// Parses each file once and derives both the resolved import edges and the
// declared symbols, so the symbol layer adds no extra parse over the import
// layer. Returns nulls for languages without a grammar (config/unknown), so a
// caller can leave those FileNode fields unset.

export interface FileAnalysis {
  imports: ImportEdge[] | null;
  symbols: SymbolNode[] | null;
}

export function analyzeFile(
  filePath: string,
  language: Language,
  ctx: ImportResolveContext
): FileAnalysis {
  if (!isGrammarLanguage(language)) return { imports: null, symbols: null };

  let code: string;
  try {
    code = fs.readFileSync(filePath, "utf-8");
  } catch {
    return { imports: [], symbols: [] };
  }

  const tree = parseSource(language, code);
  if (!tree) return { imports: [], symbols: [] };

  const root = tree.rootNode;
  const imports = resolveImports(filePath, language, extractImportsFromTree(language, root), ctx);
  const symbols = extractSymbolsFromTree(language, root);
  return { imports, symbols };
}
