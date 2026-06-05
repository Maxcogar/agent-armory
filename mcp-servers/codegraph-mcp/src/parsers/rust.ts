import * as fs from "fs";
import * as path from "path";

// ============================================================
// Rust module resolution (path convention)
// ============================================================
//
// Rust maps modules to files: the crate root is lib.rs/main.rs, `foo.rs` (or
// `foo/mod.rs`) is module `foo`, etc. So a file's module path is determined by
// its location relative to the crate root, and a `use crate::a::b::Item` path
// resolves to the file for module `crate::a::b`. This mirrors how Go/Java map
// import paths to files.

/** The crate root directory: the dir containing lib.rs (preferred) or main.rs. */
export function rustCrateRoot(files: string[]): string | null {
  let lib: string | null = null;
  let main: string | null = null;
  for (const f of files) {
    const b = path.basename(f);
    if (b === "lib.rs") lib = lib ?? path.dirname(f);
    else if (b === "main.rs") main = main ?? path.dirname(f);
  }
  return lib ?? main;
}

/** The module path (`crate::a::b`) of a Rust file by convention, or null if it
 *  is outside the crate root. */
export function rustModulePath(filePath: string, crateRoot: string | null): string | null {
  if (!crateRoot) return null;
  const rel = path.relative(crateRoot, filePath).replace(/\\/g, "/");
  if (rel.startsWith("..")) return null;
  const base = path.basename(rel);
  if (base === "lib.rs" || base === "main.rs") return "crate";
  let parts = rel.replace(/\.rs$/, "").split("/");
  if (base === "mod.rs") parts = parts.slice(0, -1);
  return ["crate", ...parts].join("::");
}

/** File-level dependencies from `mod name;` declarations (sibling module files). */
export function parseRustDependencies(filePath: string): string[] {
  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch {
    return [];
  }
  const dir = path.dirname(filePath);
  const deps = new Set<string>();
  for (const m of content.matchAll(/^\s*(?:pub\s+(?:\([^)]*\)\s+)?)?mod\s+([A-Za-z_]\w*)\s*;/gm)) {
    const name = m[1];
    for (const cand of [path.join(dir, `${name}.rs`), path.join(dir, name, "mod.rs")]) {
      if (fs.existsSync(cand)) {
        deps.add(cand);
        break;
      }
    }
  }
  return [...deps];
}
