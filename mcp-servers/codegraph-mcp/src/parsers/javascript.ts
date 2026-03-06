import * as fs from "fs";
import * as path from "path";

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
export function parseJavaScriptDependencies(filePath: string, rootDir?: string): string[] {
  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch {
    return [];
  }

  const importPaths = new Set<string>();
  const dir = path.dirname(filePath);
  const tsConfig = rootDir ? loadTsConfig(rootDir) : null;

  const importPatterns = [
    /import\s+(?:[\w*{},\s]+\s+from\s+)?['"]([^'"]+)['"]/g,  // static import
    /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,                   // require()
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,                    // dynamic import()
    /export\s+(?:[\w*{},\s]+\s+from\s+)?['"]([^'"]+)['"]/g,   // re-export
  ];

  for (const pattern of importPatterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content)) !== null) {
      resolveImport(match[1], dir, filePath, rootDir, tsConfig, importPaths);
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

function resolveImport(
  importPath: string,
  dir: string,
  sourceFile: string,
  rootDir: string | undefined,
  tsConfig: TsConfig | null,
  result: Set<string>
): void {
  // Skip URLs
  if (importPath.startsWith("http://") || importPath.startsWith("https://")) return;

  // 1. Try relative imports first (./foo, ../bar)
  if (importPath.startsWith(".") || importPath.startsWith("..")) {
    const resolved = resolveJsImport(importPath, dir);
    if (resolved && resolved !== sourceFile) {
      result.add(resolved);
    }
    return;
  }

  // 2. Try TypeScript path aliases (e.g. @/models/User, @components/Button)
  if (tsConfig?.hasPaths) {
    const resolved = resolveWithTsPaths(importPath, rootDir!, tsConfig);
    if (resolved && resolved !== sourceFile) {
      result.add(resolved);
      return;
    }
  }

  // 3. Try baseUrl resolution (e.g. "models/User" when baseUrl is "src")
  if (tsConfig?.baseUrl) {
    const resolved = resolveWithBaseUrl(importPath, tsConfig.baseUrl);
    if (resolved && resolved !== sourceFile) {
      result.add(resolved);
      return;
    }
  }

  // 4. Skip bare package specifiers (express, fs, lodash, etc.)
  // These are npm packages or Node built-ins, not project files.
  // We only reach here if alias and baseUrl resolution both failed.
}
