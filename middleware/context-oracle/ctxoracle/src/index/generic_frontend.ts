// Generic line-based frontend (Step 15, AD-12, L6). Deliberately weaker than a
// grammar: definition-shaped lines only, and no import edges, which is what
// keeps a generic-frontend candidate out of the Reuse dominance count.
import type { LanguageFrontend } from './frontend.js';
import type { SymbolRow } from '../types/index_types.js';

const DEF = [
  { re: /^\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/, kind: 'function' },
  { re: /^\s*(?:export\s+)?class\s+([A-Za-z_$][\w$]*)/, kind: 'class' },
  { re: /^\s*def\s+([A-Za-z_]\w*)/, kind: 'function' },
  { re: /^\s*(?:pub\s+)?fn\s+([A-Za-z_]\w*)/, kind: 'function' },
  { re: /^\s*(?:function\s+)?([A-Za-z_][\w-]*)\s*\(\)\s*\{/, kind: 'function' },
];

export const genericFrontend: LanguageFrontend = {
  lang: 'generic',
  parse(_path, content) {
    const text = content.toString('utf8');
    const symbols: SymbolRow[] = [];
    let offset = 0;
    for (const line of text.split('\n')) {
      for (const d of DEF) {
        const m = d.re.exec(line);
        if (m !== null) {
          const name = m[1] as string;
          const start = offset + line.indexOf(name);
          symbols.push({ name, kind: d.kind, spanStart: start, spanEnd: start + name.length });
          break;
        }
      }
      offset += Buffer.byteLength(line, 'utf8') + 1;
    }
    return { symbols, imports: [] };
  },
};
