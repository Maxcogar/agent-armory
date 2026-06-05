import * as fs from "fs";
import * as path from "path";

// ============================================================
// Go import resolution
// ============================================================
//
// Go imports are package *paths* (e.g. "github.com/me/app/internal/store"). A
// path that starts with this module's path (from go.mod's `module` line) is
// internal: strip the prefix and it maps to a directory under the module root,
// whose `.go` files are that package. Anything else (stdlib, third-party) is
// external. Unlike file-based languages, a Go import targets a *directory* of
// files, not a single file.

const moduleNameCache = new Map<string, string | null>();

/** The module path declared in `<rootDir>/go.mod`, or null when absent. */
export function goModuleName(rootDir: string): string | null {
  if (moduleNameCache.has(rootDir)) return moduleNameCache.get(rootDir)!;
  let name: string | null = null;
  try {
    const content = fs.readFileSync(path.join(rootDir, "go.mod"), "utf-8");
    const m = content.match(/^\s*module\s+(\S+)/m);
    if (m) name = m[1];
  } catch {
    /* no go.mod */
  }
  moduleNameCache.set(rootDir, name);
  return name;
}

export function clearGoModuleCache(): void {
  moduleNameCache.clear();
}

/**
 * The absolute package directory an import path resolves to within this module,
 * or null when the import is external (stdlib/third-party) or there is no module.
 */
export function resolveGoPackageDir(
  importPath: string,
  rootDir: string,
  moduleName: string | null
): string | null {
  if (!moduleName) return null;
  if (importPath === moduleName) return rootDir;
  if (importPath.startsWith(moduleName + "/")) {
    return path.join(rootDir, importPath.slice(moduleName.length + 1));
  }
  return null;
}

/** The non-test `.go` files in a package directory (absolute paths). */
export function goPackageFiles(dir: string): string[] {
  try {
    return fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".go") && !f.endsWith("_test.go"))
      .map((f) => path.join(dir, f));
  } catch {
    return [];
  }
}

/** File-level dependencies of a Go file: every `.go` file in each internal
 *  package it imports. (External packages produce no in-graph edge.) */
export function parseGoDependencies(filePath: string, rootDir: string): string[] {
  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch {
    return [];
  }
  const moduleName = goModuleName(rootDir);
  if (!moduleName) return [];

  const deps = new Set<string>();
  for (const m of content.matchAll(/import\s+(?:\(([\s\S]*?)\)|(?:[\w.]+\s+)?"([^"]+)")/g)) {
    const specifiers = m[2] ? [m[2]] : [...(m[1] ?? "").matchAll(/"([^"]+)"/g)].map((s) => s[1]);
    for (const spec of specifiers) {
      const dir = resolveGoPackageDir(spec, rootDir, moduleName);
      if (!dir) continue;
      for (const f of goPackageFiles(dir)) if (f !== filePath) deps.add(f);
    }
  }
  return [...deps];
}
