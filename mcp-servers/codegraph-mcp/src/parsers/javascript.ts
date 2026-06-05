import * as fs from "fs";
import * as path from "path";

import { ImportResolution } from "../types.js";

// ============================================================
// tsconfig.json Resolution
// ============================================================

interface TsConfig {
  baseUrl: string | null;
  paths: Record<string, string[]>;
  hasPaths: boolean;
}

const tsConfigCache = new Map<string, TsConfig | null>();

/**
 * Load and parse tsconfig.json from a root directory.
 * Extracts compilerOptions.baseUrl and compilerOptions.paths.
 * Results are cached per rootDir.
 */
function loadTsConfig(rootDir: string): TsConfig | null {
  if (tsConfigCache.has(rootDir)) return tsConfigCache.get(rootDir)!;

  const tsConfigPath = path.join(rootDir, "tsconfig.json");

  try {
    const raw = fs.readFileSync(tsConfigPath, "utf-8");
    // Strip single-line comments while preserving strings containing //
    const stripped = raw.replace(
      /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|(\/\/.*$)/gm,
      (match, comment) => (comment ? "" : match)
    );
    const parsed = JSON.parse(stripped);
    const compilerOptions = parsed?.compilerOptions ?? {};

    const paths = compilerOptions.paths ?? {};
    const config: TsConfig = {
      baseUrl: compilerOptions.baseUrl
        ? path.resolve(rootDir, compilerOptions.baseUrl)
        : null,
      paths,
      hasPaths: Object.keys(paths).length > 0,
    };

    tsConfigCache.set(rootDir, config);
    return config;
  } catch {
    tsConfigCache.set(rootDir, null);
    return null;
  }
}

/**
 * Try to resolve an import path using tsconfig.json paths aliases.
 * E.g. "@/models/User" → "src/models/User" when paths has "@/*": ["src/*"]
 */
function resolveWithTsPaths(
  importPath: string,
  rootDir: string,
  tsConfig: TsConfig
): string | null {
  const baseDir = tsConfig.baseUrl ?? rootDir;

  for (const [pattern, mappings] of Object.entries(tsConfig.paths)) {
    // Patterns are either exact ("@utils") or wildcard ("@/*")
    if (pattern.endsWith("/*")) {
      const prefix = pattern.slice(0, -2); // "@" from "@/*"
      if (importPath.startsWith(prefix + "/")) {
        const rest = importPath.slice(prefix.length + 1);
        for (const mapping of mappings) {
          const mappingBase = mapping.endsWith("/*") ? mapping.slice(0, -2) : mapping;
          const candidate = path.resolve(baseDir, mappingBase, rest);
          const resolved = resolveAbsoluteCandidate(candidate);
          if (resolved) return resolved;
        }
      }
    } else if (pattern === importPath) {
      // Exact match
      for (const mapping of mappings) {
        const candidate = path.resolve(baseDir, mapping);
        const resolved = resolveAbsoluteCandidate(candidate);
        if (resolved) return resolved;
      }
    }
  }

  return null;
}

/**
 * Try to resolve an import path using tsconfig.json baseUrl.
 * E.g. "models/User" → "<baseUrl>/models/User"
 */
function resolveWithBaseUrl(
  importPath: string,
  baseUrl: string
): string | null {
  const candidate = path.resolve(baseUrl, importPath);
  return resolveAbsoluteCandidate(candidate);
}

/**
 * Resolve an already-absolute candidate path, trying extensions and index files.
 */
function resolveAbsoluteCandidate(candidate: string): string | null {
  return resolveJsImport(candidate, path.dirname(candidate));
}

/**
 * Clear the tsconfig cache (useful for re-scans).
 */
export function clearTsConfigCache(): void {
  tsConfigCache.clear();
}

// ============================================================
// Parser
// ============================================================

/**
 * Extracts all import/require paths from a JS or TS file.
 * Handles: import ... from '...', require('...'), dynamic import('...')
 * Resolves relative imports, TypeScript path aliases, and baseUrl imports.
 */
/**
 * Remove line (`//`) and block (slash-star) comments from JS/TS source so that
 * commented-out imports are not counted as real dependencies. String and
 * template literals are preserved so their contents (which may legitimately
 * contain `//` or import-like text) are untouched.
 */
export function stripJsComments(src: string): string {
  return src.replace(
    /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|\/\*[\s\S]*?\*\/|\/\/[^\n]*/g,
    (m) => (m[0] === '"' || m[0] === "'" || m[0] === "`" ? m : " ")
  );
}

export function parseJavaScriptDependencies(filePath: string, rootDir?: string): string[] {
  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch {
    return [];
  }

  content = stripJsComments(content);

  const importPaths = new Set<string>();
  const dir = path.dirname(filePath);

  const importPatterns = [
    /import\s+(?:[\w*{},\s]+\s+from\s+)?['"]([^'"]+)['"]/g,  // static import
    /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,                   // require()
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,                    // dynamic import()
    /export\s+(?:[\w*{},\s]+\s+from\s+)?['"]([^'"]+)['"]/g,   // re-export
  ];

  for (const pattern of importPatterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content)) !== null) {
      resolveImport(match[1], dir, filePath, rootDir, importPaths);
    }
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

  // TypeScript Node16/NodeNext module resolution requires writing
  // relative imports with a .js (or .mjs/.cjs/.jsx) extension even when
  // the actual source file is .ts (or .mts/.cts/.tsx). If the literal
  // path doesn't exist, try swapping the JS extension for its TS counterpart.
  const jsToTsExt: Record<string, string[]> = {
    ".js": [".ts", ".tsx"],
    ".jsx": [".tsx"],
    ".mjs": [".mts"],
    ".cjs": [".cts"],
  };
  const ext = path.extname(resolved);
  if (ext && jsToTsExt[ext]) {
    const base = resolved.slice(0, -ext.length);
    for (const tsExt of jsToTsExt[ext]) {
      const candidate = base + tsExt;
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return candidate;
      }
    }
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

/**
 * Resolve a single import specifier to a project file, classifying the result.
 *
 * This is the single source of truth for JS/TS module resolution, shared by the
 * legacy `dependencies` extraction (via {@link resolveImport}) and the
 * tree-sitter `imports` edges, so the two can never diverge on resolution.
 *
 *   - `internal`   — resolved to a project file (`to` is its absolute path)
 *   - `unresolved` — a relative import that pointed at no existing file (a bug)
 *   - `external`   — a bare package specifier or URL (npm/PyPI/builtin)
 */
export function resolveJsModule(
  raw: string,
  fromDir: string,
  rootDir?: string
): { to: string | null; resolution: ImportResolution } {
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return { to: null, resolution: "external" };
  }

  // Relative imports (./foo, ../bar). A relative import that fails to resolve is
  // a broken reference, not an external package.
  if (raw.startsWith(".")) {
    const resolved = resolveJsImport(raw, fromDir);
    return resolved
      ? { to: resolved, resolution: "internal" }
      : { to: null, resolution: "unresolved" };
  }

  const tsConfig = rootDir ? loadTsConfig(rootDir) : null;

  // TypeScript path aliases (e.g. @/models/User).
  if (tsConfig?.hasPaths && rootDir) {
    const resolved = resolveWithTsPaths(raw, rootDir, tsConfig);
    if (resolved) return { to: resolved, resolution: "internal" };
  }

  // baseUrl resolution (e.g. "models/User" when baseUrl is "src").
  if (tsConfig?.baseUrl) {
    const resolved = resolveWithBaseUrl(raw, tsConfig.baseUrl);
    if (resolved) return { to: resolved, resolution: "internal" };
  }

  // A bare specifier that matched no alias/baseUrl is an external package.
  return { to: null, resolution: "external" };
}

function resolveImport(
  importPath: string,
  dir: string,
  sourceFile: string,
  rootDir: string | undefined,
  result: Set<string>
): void {
  const { to, resolution } = resolveJsModule(importPath, dir, rootDir);
  if (resolution === "internal" && to && to !== sourceFile) {
    result.add(to);
  }
}
