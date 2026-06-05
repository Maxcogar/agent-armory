import * as fs from "fs";
import * as path from "path";

import { Language, ImportEdge } from "../types.js";
import { extractImports } from "./imports.js";
import { resolveJsModule } from "../parsers/javascript.js";

// ============================================================
// Resolved import edges (tree-sitter extraction + shared resolver)
// ============================================================
//
// Produces the rich ImportEdge list for a file: tree-sitter supplies the raw
// imports (kind + specifiers), and resolution reuses the *same* resolver the
// legacy `dependencies` path uses, so the internal edges here are guaranteed to
// match `dependencies` (proven by the integration parity test).
//
// JS/TS only for now; Python and C++ resolution are wired in a later step.

export function parseFileImports(
  filePath: string,
  language: Language,
  rootDir: string
): ImportEdge[] {
  if (language !== "typescript" && language !== "javascript") return [];

  let code: string;
  try {
    code = fs.readFileSync(filePath, "utf-8");
  } catch {
    return [];
  }

  const fromDir = path.dirname(filePath);
  const edges: ImportEdge[] = [];
  for (const imp of extractImports(language, code)) {
    const { to, resolution } = resolveJsModule(imp.raw, fromDir, rootDir);
    // A file importing itself is not a dependency edge (matches the legacy path).
    if (to === filePath) continue;
    edges.push({ ...imp, to, resolution });
  }
  return edges;
}
