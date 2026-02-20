import * as fs from "fs";
import * as path from "path";

/**
 * Extracts all #include paths from C++/Arduino files.
 * Handles: #include "local.h" (relative includes only — skips system includes like <Arduino.h>)
 */
export function parseCppDependencies(filePath: string, searchDirs: string[]): string[] {
  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch {
    return [];
  }

  const importPaths = new Set<string>();
  const fileDir = path.dirname(filePath);

  // Only match quoted includes (local files), not angle-bracket includes (system/library)
  const localInclude = /^\s*#include\s+"([^"]+)"/gm;
  let match: RegExpExecArray | null;

  while ((match = localInclude.exec(content)) !== null) {
    const includePath = match[1];
    const resolved = resolveCppInclude(includePath, fileDir, searchDirs);
    if (resolved && resolved !== filePath) {
      importPaths.add(resolved);
    }
  }

  return Array.from(importPaths);
}

/**
 * Resolve a C++ #include path to an absolute file path.
 * Searches: file's own directory first, then provided search directories.
 */
export function resolveCppInclude(
  includePath: string,
  fileDir: string,
  searchDirs: string[]
): string | null {
  // Try relative to the including file first
  const relativePath = path.resolve(fileDir, includePath);
  if (fs.existsSync(relativePath)) return relativePath;

  // Try each search directory
  for (const dir of searchDirs) {
    const candidate = path.resolve(dir, includePath);
    if (fs.existsSync(candidate)) return candidate;
  }

  return null;
}

/**
 * Collect all search directories for a C++ project
 * (all directories containing .h or .hpp files within rootDir).
 */
export function collectCppSearchDirs(rootDir: string): string[] {
  const dirs = new Set<string>([rootDir]);

  function walk(dir: string): void {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.isDirectory() && !shouldSkipDir(entry.name)) {
        const subDir = path.join(dir, entry.name);
        walk(subDir);
      } else if (
        entry.isFile() &&
        (entry.name.endsWith(".h") || entry.name.endsWith(".hpp"))
      ) {
        dirs.add(dir);
      }
    }
  }

  walk(rootDir);
  return Array.from(dirs);
}

function shouldSkipDir(name: string): boolean {
  return [
    "node_modules",
    ".git",
    ".vscode",
    "build",
    "dist",
    ".pio",
    "Arduino",
  ].includes(name);
}
