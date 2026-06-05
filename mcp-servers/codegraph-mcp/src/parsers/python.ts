import * as fs from "fs";
import * as path from "path";

import { ImportResolution } from "../types.js";

/**
 * Extracts all import paths from a Python file.
 * Handles: import x, from x import y, relative imports (from . import x)
 */
export function parsePythonDependencies(filePath: string, rootDir: string): string[] {
  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch {
    return [];
  }

  const importPaths = new Set<string>();
  const fileDir = path.dirname(filePath);
  const packageRoot = findPythonPackageRoot(filePath, rootDir);

  // from .module import x  OR  from ..module import x (relative).
  // Allow leading indentation so conditional/function-level imports are caught.
  const relativeImport = /^[ \t]*from\s+(\.+)([\w.]*)\s+import\s+/gm;
  let match: RegExpExecArray | null;

  while ((match = relativeImport.exec(content)) !== null) {
    const dots = match[1].length;
    const moduleName = match[2];
    const resolved = resolveRelativePythonImport(filePath, dots, moduleName);
    if (resolved) importPaths.add(resolved);
  }

  // from package.module import x (absolute)
  const absoluteFromImport = /^[ \t]*from\s+([\w][\w.]*)\s+import\s+/gm;
  while ((match = absoluteFromImport.exec(content)) !== null) {
    const modulePath = match[1];
    if (!modulePath.startsWith(".")) {
      const resolved = resolveAbsolutePythonImport(modulePath, packageRoot || rootDir, rootDir);
      if (resolved) importPaths.add(resolved);
    }
  }

  // import module  /  import a, b  /  import a as alias (absolute).
  // The character class must NOT include \s (it matches newlines, which would
  // make a single `import` greedily swallow every following import line and
  // resolve to nothing). Restrict intra-statement whitespace to spaces/tabs.
  const directImport = /^[ \t]*import\s+([\w][\w., \t]*)/gm;
  while ((match = directImport.exec(content)) !== null) {
    // Handle "import a, b, c"
    const modules = match[1].split(",").map((m) => m.trim().split(" ")[0]);
    for (const mod of modules) {
      if (mod && !mod.includes(".")) {
        const resolved = resolveAbsolutePythonImport(mod, packageRoot || rootDir, rootDir);
        if (resolved) importPaths.add(resolved);
      } else if (mod && mod.includes(".")) {
        const resolved = resolveAbsolutePythonImport(mod, packageRoot || rootDir, rootDir);
        if (resolved) importPaths.add(resolved);
      }
    }
  }

  // Remove self-references
  return Array.from(importPaths).filter((p) => p !== filePath);
}

/**
 * Resolve a single Python module specifier (as written, e.g. ".mod", "..pkg.sub",
 * "os") to a project file, classifying the result. Reuses the same relative/
 * absolute resolvers as {@link parsePythonDependencies}. An absolute import that
 * resolves to no project file is `external` (stdlib/third-party); a relative one
 * that resolves to nothing is `unresolved` (a broken in-package reference).
 */
export function resolvePythonModule(
  raw: string,
  filePath: string,
  rootDir: string
): { to: string | null; resolution: ImportResolution } {
  if (raw.startsWith(".")) {
    let dots = 0;
    while (dots < raw.length && raw[dots] === ".") dots++;
    const moduleName = raw.slice(dots);
    const resolved = resolveRelativePythonImport(filePath, dots, moduleName);
    return resolved
      ? { to: resolved, resolution: "internal" }
      : { to: null, resolution: "unresolved" };
  }
  const packageRoot = findPythonPackageRoot(filePath, rootDir);
  const resolved = resolveAbsolutePythonImport(raw, packageRoot || rootDir, rootDir);
  return resolved
    ? { to: resolved, resolution: "internal" }
    : { to: null, resolution: "external" };
}

/**
 * Walk up the directory tree to find the Python package root
 * (directory without __init__.py, or the rootDir).
 */
function findPythonPackageRoot(filePath: string, rootDir: string): string | null {
  let dir = path.dirname(filePath);
  while (dir !== rootDir && dir !== path.dirname(dir)) {
    const initFile = path.join(dir, "__init__.py");
    const parentInit = path.join(path.dirname(dir), "__init__.py");
    if (fs.existsSync(initFile) && !fs.existsSync(parentInit)) {
      return path.dirname(dir);
    }
    dir = path.dirname(dir);
  }
  return rootDir;
}

function resolveRelativePythonImport(
  fromFile: string,
  dots: number,
  moduleName: string
): string | null {
  let baseDir = path.dirname(fromFile);

  // Each dot goes up one level
  for (let i = 1; i < dots; i++) {
    baseDir = path.dirname(baseDir);
  }

  if (!moduleName) {
    // "from . import x" - refers to the package __init__.py
    const init = path.join(baseDir, "__init__.py");
    return fs.existsSync(init) ? init : null;
  }

  // Convert dots in moduleName to path
  const moduleParts = moduleName.split(".");
  const candidatePath = path.join(baseDir, ...moduleParts);

  // Try as .py file
  const pyFile = candidatePath + ".py";
  if (fs.existsSync(pyFile)) return pyFile;

  // Try as package
  const initFile = path.join(candidatePath, "__init__.py");
  if (fs.existsSync(initFile)) return initFile;

  return null;
}

function resolveAbsolutePythonImport(
  moduleName: string,
  searchBase: string,
  rootDir: string
): string | null {
  const parts = moduleName.split(".");

  // Try from searchBase
  for (const base of [searchBase, rootDir]) {
    const candidatePath = path.join(base, ...parts);

    const pyFile = candidatePath + ".py";
    if (fs.existsSync(pyFile)) return pyFile;

    const initFile = path.join(candidatePath, "__init__.py");
    if (fs.existsSync(initFile)) return initFile;
  }

  return null;
}
