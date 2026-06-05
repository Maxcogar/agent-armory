import * as fs from "fs";
import * as path from "path";

import { Language, ImportEdge, SymbolNode, Endpoint, Channel } from "../types.js";
import { parseSource } from "./parser.js";
import { extractImportsFromTree } from "./imports.js";
import { extractSymbolsFromTree } from "./symbols.js";
import { extractEndpoints, extractChannels } from "./surface.js";
import { resolveImports, isGrammarLanguage, ImportResolveContext } from "./edges.js";

// ============================================================
// Single-parse file analysis (imports + symbols + surface)
// ============================================================
//
// Parses each file once and derives import edges, declared symbols, HTTP
// endpoints, and cross-language channels — so every layer shares one parse.
// Returns nulls for languages without a grammar (config/unknown).

export interface FileAnalysis {
  imports: ImportEdge[] | null;
  symbols: SymbolNode[] | null;
  endpoints: Endpoint[] | null;
  channels: Channel[] | null;
}

const EMPTY: FileAnalysis = { imports: null, symbols: null, endpoints: null, channels: null };

export function analyzeFile(
  filePath: string,
  language: Language,
  ctx: ImportResolveContext
): FileAnalysis {
  if (!isGrammarLanguage(language)) return EMPTY;

  let code: string;
  try {
    code = fs.readFileSync(filePath, "utf-8");
  } catch {
    return { imports: [], symbols: [], endpoints: [], channels: [] };
  }

  const tree = parseSource(language, code);
  if (!tree) return { imports: [], symbols: [], endpoints: [], channels: [] };

  const root = tree.rootNode;
  const relPath = path.relative(ctx.rootDir, filePath);
  return {
    imports: resolveImports(filePath, language, extractImportsFromTree(language, root), ctx),
    symbols: extractSymbolsFromTree(language, root),
    endpoints: extractEndpoints(language, root, relPath),
    channels: extractChannels(language, root),
  };
}
