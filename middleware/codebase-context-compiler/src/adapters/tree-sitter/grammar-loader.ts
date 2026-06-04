/**
 * Tree-sitter grammar loader (Architecture D5). Wraps web-tree-sitter (wasm) so
 * no native compilation is required. Grammars come from the prebuilt
 * tree-sitter-wasms package. Languages are loaded lazily and cached.
 */
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
// web-tree-sitter@0.22 is CJS; default import yields the Parser class whose
// static `init()` and `Language` become available after initialisation.
import Parser from 'web-tree-sitter';

const require = createRequire(import.meta.url);
const wasmDir = join(dirname(require.resolve('tree-sitter-wasms/package.json')), 'out');

const GRAMMAR_FILE: Record<string, string> = {
  typescript: 'tree-sitter-typescript.wasm',
  tsx: 'tree-sitter-tsx.wasm',
  javascript: 'tree-sitter-javascript.wasm',
  python: 'tree-sitter-python.wasm',
};

let initialised = false;
const cache = new Map<string, any>();

export async function getParserFor(grammar: string): Promise<any | null> {
  const file = GRAMMAR_FILE[grammar];
  if (!file) return null;
  if (!initialised) {
    await (Parser as any).init();
    initialised = true;
  }
  let lang = cache.get(grammar);
  if (!lang) {
    lang = await (Parser as any).Language.load(join(wasmDir, file));
    cache.set(grammar, lang);
  }
  const parser = new (Parser as any)();
  parser.setLanguage(lang);
  return parser;
}

/** Maps a file extension to the grammar key used above. */
export function grammarForExtension(ext: string): string | null {
  switch (ext) {
    case '.ts': case '.mts': case '.cts': return 'typescript';
    case '.tsx': return 'tsx';
    case '.js': case '.mjs': case '.cjs': case '.jsx': return 'javascript';
    case '.py': case '.pyi': return 'python';
    default: return null;
  }
}
