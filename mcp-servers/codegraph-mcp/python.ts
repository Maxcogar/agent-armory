import * as fs from "fs";
import * as path from "path";

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

  // from .module import x  OR  from ..module import x (relative)
  const relativeImport = /^from\s+(\.+)([\w.]*)\s+import\s+/gm;
  let match: RegExpExecArray | null;

  while ((match = relativeImport.exec(content)) !== null) {
    const dots = match[1].length;
    const moduleName = match[2];
    const resolved = resolveRelativePythonImport(filePath, dots, moduleName);
    if (resolved) importPaths.add(resolved);
  }

  // from package.module import x (absolute)
  const absoluteFromImport = /^from\s+([\w][[\w.]*)\s+import\s+/gm;
  while ((match = absoluteFromImport.exec(content)) !== null) {
    const modulePath = match[1];
    if (!modulePath.startsWith(".")) {
      const resolved = resolveAbsolutePythonImport(modulePath, packageRoot || rootDir, rootDir);
      if (resolved) importPaths.add(resolved);
    }
  }

  // import module (absolute)
  const directImport = /^import\s+([\w][[\w.,\s]*)/gm;
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
