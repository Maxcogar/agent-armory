// Runtime floor check (Step 2, AD-2). The floor is 22.16.0 because that is the
// Node release whose built-in SQLite ships FTS5 (V7) and module-level backup()
// (V17) — the capabilities the stores rely on. Called from `init` (Step 31) and
// `status` (Step 33); this step delivers the function and its test, not the
// wiring. (The raw module specifier is named only in src/stores/adapter.ts, the
// single-importer seam the sqlite_single_importer convention test enforces.)

const FLOOR = '22.16.0';

/**
 * Throw a plain-language Error naming the current and required versions when
 * `version` is below the 22.16.0 floor. The comparison is a real numeric SemVer
 * compare (major, then minor, then patch) — not a string compare, under which
 * "22.9.0" would sort after "22.16.0" and a below-floor runtime would slip
 * through.
 */
export function assertRuntime(version: string = process.versions.node): void {
  if (compareCore(version, FLOOR) < 0) {
    throw new Error(
      `ctxoracle requires Node.js >= ${FLOOR}, but the current runtime is ${version}. ` +
        `Upgrade Node: the floor is ${FLOOR} because the built-in SQLite's FTS5 and backup() ship there.`
    );
  }
}

/** Compare the major.minor.patch cores of two version strings. */
function compareCore(a: string, b: string): number {
  const pa = parseCore(a);
  const pb = parseCore(b);
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i];
  }
  return 0;
}

function parseCore(v: string): [number, number, number] {
  const core = v.replace(/^v/, '').split('-', 1)[0]!.split('+', 1)[0]!;
  const parts = core.split('.');
  const nums = [0, 1, 2].map((i) => Number.parseInt(parts[i] ?? '0', 10));
  if (nums.some((n) => Number.isNaN(n))) {
    throw new Error(`ctxoracle: unparseable Node version string: ${JSON.stringify(v)}`);
  }
  return [nums[0]!, nums[1]!, nums[2]!];
}
