// Must-fail fixture for T-9-2 (Step 9). Every call below is a knowledge write
// with the provenance argument omitted; each is a TypeScript error, so the whole
// file must fail to compile. The project build excludes test/build/fixtures, so
// this file is only ever compiled by compileFixture, which expects a non-zero
// exit. (No @ts-expect-error here on purpose — that would SUPPRESS the errors and
// let the file compile, which is exactly what T-9-2 is designed to catch.)

import type { Store } from '../../../src/stores/adapter.js';
import { filesDao } from '../../../src/stores/dao/files.js';
import { symbolsDao } from '../../../src/stores/dao/symbols.js';
import { testMapDao } from '../../../src/stores/dao/test_map.js';
import { landminesDao } from '../../../src/stores/dao/landmines.js';
import { invariantsDao } from '../../../src/stores/dao/invariants.js';
import { humanFactsDao } from '../../../src/stores/dao/human_facts.js';
import { lessonsDao } from '../../../src/stores/dao/lessons.js';

declare const store: Store;

filesDao(store).upsert({ path: 'a', lang: 'ts', zone: 'source', contentHash: 'h', mtime: 1 });
symbolsDao(store).replaceForFile(1, [{ name: 'x', kind: 'function', spanStart: 0, spanEnd: 1 }]);
testMapDao(store).replaceForFile(1, [{ regionGlob: 'g', source: 's' }]);
// Reopened 2026-09-26 (Step 9 build delta): `landmines.upsert` is removed; the
// landmine knowledge writers are `createHuman` and `rebuildMinerKinds`.
landminesDao(store).createHuman({ fileId: 1, evidence: 'e' });
landminesDao(store).rebuildMinerKinds([{ kind: 'revert_chain', fileId: 1, evidence: 'e' }]);
invariantsDao(store).create({ description: 'd' }, []);
humanFactsDao(store).create({ statement: 's', targetKind: 'file', targetRef: 'a', statedAt: 1 });
lessonsDao(store).create({ statement: 's' });
