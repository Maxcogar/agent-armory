import * as fs from "fs";
import * as path from "path";

/**
 * Extracts all import/require paths from a JS or TS file.
 * Handles: import ... from '...', require('...'), dynamic import('...')
 * Only returns relative paths (starting with . or ..) — skips node_modules.
 */
export function parseJavaScriptDependencies(filePath: string): string[] {
  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch {
    return [];
  }

  const importPaths = new Set<string>();
  const dir = path.dirname(filePath);

  // Static import: import ... from '...' or import '...'
  const staticImport = /import\s+(?:[\w*{},\s]+\s+from\s+)?['"]([^'"]+)['"]/g;
  let match: RegExpExecArray | null;
  while ((match = staticImport.exec(content)) !== null) {
    addIfRelative(match[1], dir, filePath, importPaths);
  }

  // require('...')
  const requirePattern = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = requirePattern.exec(content)) !== null) {
    addIfRelative(match[1], dir, filePath, importPaths);
  }

  // Dynamic import('...')
  const dynamicImport = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = dynamicImport.exec(content)) !== null) {
    addIfRelative(match[1], dir, filePath, importPaths);
  }

  // export ... from '...'
  const reExport = /export\s+(?:[\w*{},\s]+\s+from\s+)?['"]([^'"]+)['"]/g;
  while ((match = reExport.exec(content)) !== null) {
    addIfRelative(match[1], dir, filePath, importPaths);
  }

  return Array.from(importPaths);
}

/**
 * Resolve a relative import path to an absolute file path.
 * Tries common extensions and index files.
 */
export function resolveJsImport(importPath: string, fromDir: string): string | null {
  const extensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
  const resolved = path.resolve(fromDir, importPath);

  // Try exact path first
  if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
    return resolved;
  }

  // Try with extensions
  for (const ext of extensions) {
    const withExt = resolved + ext;
    if (fs.existsSync(withExt)) return withExt;
  }

  // Try as directory with index file
  for (const ext of extensions) {
    const indexFile = path.join(resolved, `index${ext}`);
    if (fs.existsSync(indexFile)) return indexFile;
  }

  return null;
}

function addIfRelative(
  importPath: string,
  dir: string,
  sourceFile: string,
  result: Set<string>
): void {
  // Skip node_modules, absolute paths, URLs
  if (!importPath.startsWith(".") && !importPath.startsWith("..")) return;

  const resolved = resolveJsImport(importPath, dir);
  if (resolved && resolved !== sourceFile) {
    result.add(resolved);
  }
}
