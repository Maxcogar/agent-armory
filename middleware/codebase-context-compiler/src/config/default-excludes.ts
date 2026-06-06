/**
 * Default exclude rules and boundary/language inference (Spec FR21, Constraint
 * "configurable excluded paths"). Excludes keep dependencies, build outputs,
 * generated files, binaries, and VCS internals out of the index.
 */
import type { FileBoundary } from '../core/domain/repository-map.js';

export const DEFAULT_EXCLUDES: string[] = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/build/**',
  '**/out/**',
  '**/coverage/**',
  '**/_recycle_bin/**',
  '**/recycle_bin/**',
  '**/.backup*/**',
  '**/backup-*/**',
  '**/.next/**',
  '**/.venv/**',
  '**/venv/**',
  '**/__pycache__/**',
  '**/.codememory/**',
  '**/.context/**',
  '**/.pio/**',
  '**/.platformio/**',
  '**/rag/**',
  '**/chroma_db/**',
  '**/volumes/**',
  '**/backend/logs/**',
  '**/*.min.js',
  '**/*.log',
  '**/*.lock',
  '**/package-lock.json',
  '**/pnpm-lock.yaml',
  '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.ico', '**/*.pdf',
  '**/*.zip', '**/*.gz', '**/*.tar', '**/*.wasm', '**/*.so', '**/*.dll', '**/*.node',
  '**/*.exe', '**/*.sqlite', '**/*.sqlite3', '**/*.db', '**/*.data',
];

const LANGUAGE_BY_EXT: Record<string, string> = {
  '.ts': 'typescript', '.tsx': 'typescript', '.mts': 'typescript', '.cts': 'typescript',
  '.js': 'javascript', '.jsx': 'javascript', '.mjs': 'javascript', '.cjs': 'javascript',
  '.py': 'python', '.pyi': 'python',
  '.json': 'json', '.md': 'markdown', '.yml': 'yaml', '.yaml': 'yaml',
};

export function languageForPath(path: string): string | null {
  const m = path.match(/(\.[a-z0-9]+)$/i);
  const key = m?.[1]?.toLowerCase();
  return key ? (LANGUAGE_BY_EXT[key] ?? null) : null;
}

const TEST_RE = /(^|\/)(__tests__|tests?)\//i;
const TEST_FILE_RE = /\.(test|spec)\.[a-z0-9]+$/i;
const CONFIG_RE = /(^|\/)(package\.json|tsconfig.*\.json|.*\.config\.[a-z]+|\.[a-z]+rc(\.[a-z]+)?|.*\.ya?ml|.*\.toml|\.env(\..*)?)$/i;
const GENERATED_RE = /(^|\/)(generated|gen|__generated__)\/|\.(d\.ts)$|\.min\.[a-z]+$/i;
const VENDOR_RE = /(^|\/)(vendor|third_party|thirdparty)\//i;
const DOC_RE = /(^|\/)(docs?)\/|\.(md|mdx|rst|txt)$/i;

export function boundaryForPath(path: string): FileBoundary {
  if (VENDOR_RE.test(path)) return 'vendor';
  if (GENERATED_RE.test(path)) return 'generated';
  if (TEST_RE.test(path) || TEST_FILE_RE.test(path)) return 'test';
  if (CONFIG_RE.test(path)) return 'config';
  if (DOC_RE.test(path)) return 'doc';
  if (languageForPath(path)) return 'source';
  return 'unknown';
}
