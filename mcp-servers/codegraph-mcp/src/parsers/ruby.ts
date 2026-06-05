import * as fs from "fs";
import * as path from "path";

// ============================================================
// Ruby file resolution (require_relative)
// ============================================================
//
// Ruby's only static file linkage is `require_relative` (a path relative to the
// current file). `require` uses the load path and is treated as external. Ruby
// has no per-import name binding — required code is global — so symbol-level
// resolution is scoped to the require-transitive closure rather than to a
// namespace (see the Ruby connection resolver).

export function parseRubyDependencies(filePath: string): string[] {
  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch {
    return [];
  }
  const dir = path.dirname(filePath);
  const deps = new Set<string>();
  for (const m of content.matchAll(/require_relative\s+['"]([^'"]+)['"]/g)) {
    let p = path.resolve(dir, m[1]);
    if (!p.endsWith(".rb")) p += ".rb";
    deps.add(p);
  }
  return [...deps];
}
