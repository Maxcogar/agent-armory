import * as fs from "fs";
import * as path from "path";

/**
 * Resolve a go.mod's LOCAL edges, returning absolute paths to the go.mod files
 * of locally-replaced modules.
 *
 * Only `replace` directives whose right-hand side is a filesystem path
 * (`./local`, `../local`, or absolute) produce an edge — these are the
 * unambiguous local references. External `require`s and version-only replaces
 * are skipped so the module universe never leaks into the graph.
 *
 * Handles both the single-line form and the parenthesized block form:
 *   replace example.com/old => ./local
 *   replace (
 *     example.com/a => ../a
 *     example.com/b v1.0.0 => ./b
 *   )
 */
export function parseGoModDependencies(filePath: string): string[] {
  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch {
    return [];
  }

  const dir = path.dirname(filePath);
  const targets = new Set<string>();

  // Every `=> <rhs>` is a replace target regardless of single-line vs block
  // form. The RHS is `<path-or-module> [version]`; we take the first token.
  const replaceRhs = /=>\s*(\S+)/g;
  let match: RegExpExecArray | null;
  while ((match = replaceRhs.exec(content)) !== null) {
    const rhs = match[1];
    if (!isLocalPath(rhs)) continue; // version/module replace -> external, skip
    const moduleDir = path.resolve(dir, rhs);
    const goMod = path.join(moduleDir, "go.mod");
    if (goMod !== filePath && fs.existsSync(goMod)) targets.add(goMod);
  }

  return [...targets];
}

function isLocalPath(spec: string): boolean {
  return (
    spec.startsWith("./") ||
    spec.startsWith("../") ||
    spec.startsWith("/") ||
    spec === "." ||
    spec === ".."
  );
}
