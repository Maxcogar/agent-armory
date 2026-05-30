import * as fs from "fs";
import * as path from "path";

/**
 * Resolve a pip requirements file's LOCAL edges, returning absolute paths.
 * PyPI requirements (`flask==2.0`, `requests`, VCS/URL installs) are skipped —
 * only local references produce edges:
 *   - `-r/--requirement FILE`     -> the referenced requirements file
 *   - `-e/--editable PATH` (local) -> the local package's requirements.txt, if any
 *   - bare local path requirements (`./pkg`, `../pkg`, `/abs`, `file:./pkg`)
 *
 * An editable/local directory edge targets that directory's requirements.txt
 * (the only manifest kind tracked here); if absent, no edge is produced.
 */
export function parseRequirementsTxtDependencies(filePath: string): string[] {
  let content: string;
  try {
    content = fs.readFileSync(filePath, "utf-8");
  } catch {
    return [];
  }

  const dir = path.dirname(filePath);
  const targets = new Set<string>();

  for (const rawLine of content.split(/\r?\n/)) {
    const line = stripComment(rawLine).trim();
    if (!line) continue;

    // -r / --requirement: a referenced requirements file.
    let m = /^(?:-r|--requirement)[=\s]+(.+)$/.exec(line);
    if (m) {
      const target = path.resolve(dir, stripFilePrefix(m[1].trim()));
      if (target !== filePath) targets.add(target);
      continue;
    }

    // -e / --editable: only when the argument is a local path (not a VCS URL).
    m = /^(?:-e|--editable)[=\s]+(.+)$/.exec(line);
    const candidate = m ? m[1].trim() : line;
    const spec = stripFilePrefix(candidate);
    if (isLocalPath(spec)) {
      const resolved = resolveLocalRequirement(dir, spec);
      if (resolved && resolved !== filePath) targets.add(resolved);
    }
  }

  return [...targets];
}

function stripComment(line: string): string {
  const hash = line.indexOf("#");
  return hash === -1 ? line : line.slice(0, hash);
}

function stripFilePrefix(spec: string): string {
  return spec.startsWith("file:") ? spec.slice("file:".length) : spec;
}

function isLocalPath(spec: string): boolean {
  return (
    spec.startsWith("./") ||
    spec.startsWith("../") ||
    spec.startsWith("/") ||
    spec === "." ||
    spec === ".."
  );
}

/**
 * A local requirement directory edge targets its requirements.txt; a file
 * reference targets the file directly.
 */
function resolveLocalRequirement(fromDir: string, spec: string): string | null {
  const abs = path.resolve(fromDir, spec);
  let stat: fs.Stats;
  try {
    stat = fs.statSync(abs);
  } catch {
    return null;
  }
  if (stat.isDirectory()) {
    const req = path.join(abs, "requirements.txt");
    return fs.existsSync(req) ? req : null;
  }
  return abs;
}
