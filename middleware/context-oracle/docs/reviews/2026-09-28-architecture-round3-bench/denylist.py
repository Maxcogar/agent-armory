# denylist.py — re-derive AD-12's prose deny-list (38 suffixes) from the pinned
# Linguist files at d0921d1, then list every non-prose Linguist EXTENSION and
# FILENAME that ends (case-insensitively) in a listed suffix: the exceptions.
import yaml
langs = yaml.safe_load(open('web/languages.yml'))
heur = yaml.safe_load(open('web/heuristics.yml'))
prose = {n for n, v in langs.items() if v.get('type') == 'prose'}
owners = {}
for n, v in langs.items():
    for e in v.get('extensions', []) or []:
        owners.setdefault(e.lower(), set()).add(n)
prose_exts = {e for e, o in owners.items() if o & prose}
exclusive = {e for e in prose_exts if owners[e] <= prose}
shared = sorted(prose_exts - exclusive)
fallback_prose = set()
for d in heur['disambiguations']:
    for e in d['extensions']:
        if e.lower() not in shared: continue
        rules = d['rules']; last = rules[-1]
        if 'pattern' not in last and 'named_pattern' not in last and 'and' not in last:
            l = last['language']; l = l if isinstance(l, list) else [l]
            if set(l) <= prose: fallback_prose.add(e.lower())
seed = sorted(exclusive | fallback_prose)
print('seed', len(seed), 'shared', shared, 'fallback-prose', sorted(fallback_prose))
exc_ext, exc_fn = [], []
for n, v in langs.items():
    if n in prose: continue
    for e in v.get('extensions', []) or []:
        for s in seed:
            if e.lower().endswith(s) and e.lower() != s: exc_ext.append((e, n, v.get('type')))
    for f in v.get('filenames', []) or []:
        for s in seed:
            if f.lower().endswith(s): exc_fn.append((f, n, v.get('type')))
print('extension exceptions', exc_ext)
print('filename exceptions', len(exc_fn))
for f in exc_fn: print('  ', f)
print('.fr owners', sorted(owners['.fr']), '.md owners', sorted(owners['.md']), '.txt owners', sorted(owners['.txt']))
