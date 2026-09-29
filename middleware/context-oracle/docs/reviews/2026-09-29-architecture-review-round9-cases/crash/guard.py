# guard.py <test-rebuild.mjs> — the three statements outside any check() that the three
# crash-killed mutants reach, made non-throwing, so the test's checks decide. Nothing else changes.
import sys
p = sys.argv[1]; s = open(p).read()
rep = [
 ("""const pRep = JSON.parse(np.prepare("SELECT detail_json FROM faults WHERE code = 'store_rebuilt'").get().detail_json);""",
  """const pRep = JSON.parse(np.prepare("SELECT detail_json FROM faults WHERE code = 'store_rebuilt'").get()?.detail_json ?? '{"unplaced":[],"legacyDigests":{},"legacyCounts":{}}');"""),
 ("""const gRep = JSON.parse(ng.prepare("SELECT value FROM global_meta WHERE key = 'store_rebuilt'").get().value);""",
  """const gRep = JSON.parse(ng.prepare("SELECT value FROM global_meta WHERE key = 'store_rebuilt'").get()?.value ?? '{"unplaced":[],"legacyDigests":{},"legacyCounts":{}}');"""),
 ("""const n = (p, q) => { const x = ro(p); const v = x.prepare(q).get().n; x.close(); return v; };""",
  """const n = (p, q) => { let x; try { x = ro(p); } catch { return null; } const v = x.prepare(q).get().n; x.close(); return v; };"""),
]
for a, b in rep:
    assert s.count(a) == 1, a
    s = s.replace(a, b, 1)
open(p, 'w').write(s)
