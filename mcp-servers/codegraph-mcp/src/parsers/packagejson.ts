import * as fs from "fs";
import * as path from "path";

const DEP_FIELDS = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];

/**
 * Resolve a package.json's LOCAL dependency edges, returning absolute paths to
 * the package.json files of depended-on in-tree packages.
 *
 * External npm packages are deliberately never linked — pulling in the npm
 * universe would explode the graph. Only two cases produce an edge:
 *   1. `file:`/`link:` specifiers, resolved by path relative to this manifest.
 *   2. Dependencies whose name matches another in-tree package.json (workspace
 *      packages — including the `workspace:` protocol and plain semver refs to a
 *      sibling package), resolved via the `localPackages` name map.
 *
 * Mirrors the JS source parser, which likewise skips bare (external) specifiers.
 */
export function parsePackageJsonDependencies(
  filePath: string,
  localPackages: Map<string, string>
): string[] {
  let pkg: unknown;
  try {
    pkg = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return [];
  }
  if (!pkg || typeof pkg !== "object") return [];

  const dir = path.dirname(filePath);
  const targets = new Set<string>();
  const record = pkg as Record<string, unknown>;

  for (const field of DEP_FIELDS) {
    const deps = record[field];
    if (!deps || typeof deps !== "object") continue;
    for (const [name, rawSpec] of Object.entries(deps as Record<string, unknown>)) {
      const spec = typeof rawSpec === "string" ? rawSpec : "";

      // 1. Path-based local specifiers (file:./pkg, link:../pkg).
      const fileMatch = /^(?:file|link):(.+)$/.exec(spec);
      if (fileMatch) {
        const resolved = resolveLocalPackageJson(dir, fileMatch[1].trim());
        if (resolved && resolved !== filePath) targets.add(resolved);
        continue;
      }

      // 2. Workspace package referenced by name (workspace:* or plain semver).
      const byName = localPackages.get(name);
      if (byName && byName !== filePath) targets.add(byName);
    }
  }

  return [...targets];
}

/**
 * Resolve a `file:`/`link:` spec to the depended-on package's package.json.
 * If the spec points at a directory, the edge targets its package.json; if it
 * points directly at a file, that file is the target.
 */
function resolveLocalPackageJson(fromDir: string, spec: string): string | null {
  const abs = path.resolve(fromDir, spec);
  let stat: fs.Stats;
  try {
    stat = fs.statSync(abs);
  } catch {
    return null;
  }
  if (stat.isDirectory()) {
    const manifest = path.join(abs, "package.json");
    return fs.existsSync(manifest) ? manifest : null;
  }
  return abs;
}
