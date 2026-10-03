// The default frontend list (Step 15; AD-12, G8, G13; D-plan-29): one
// `treeSitterFrontend(lang)` per grammar that has a query in `QUERIES` and
// appears in `index.ext_to_grammar` (read through the `TuningReader`, never a
// raw global store — G8), sorted by grammar name, then `genericFrontend` last.
// It is the list the `index` verb (Step 28) and `init` (Step 31) pass to
// `runIndex`. A table grammar with no written query is left out, so its
// extension falls to the generic frontend and `lang_capabilities` records
// `generic` for it (G13: coverage measured, not claimed).
import type { LanguageFrontend } from './frontend.js';
import type { TuningReader } from '../types/candidate.js';
import { treeSitterFrontend, QUERIES } from './tree_sitter_frontend.js';
import { genericFrontend } from './generic_frontend.js';

export function defaultFrontends(tuning: TuningReader): LanguageFrontend[] {
  const langs = new Set<string>();
  for (const member of tuning.list('index.ext_to_grammar')) {
    const eq = member.indexOf('=');
    if (eq <= 0) continue;
    const lang = member.slice(eq + 1);
    if (Object.hasOwn(QUERIES, lang)) langs.add(lang);
  }
  return [...[...langs].sort().map((l) => treeSitterFrontend(l)), genericFrontend];
}
