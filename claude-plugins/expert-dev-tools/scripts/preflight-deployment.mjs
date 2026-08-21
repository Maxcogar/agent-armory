#!/usr/bin/env node
// Deployment-provenance preflight (corrections-0.4.0, opining-without-reading-source, Part A).
// Deterministic, dependency-free report of WHICH deployment of a plugin is installed —
// cache path, installed version, marketplace commit — compared, when a working-tree path
// is supplied, against EVERY behavior-bearing file that working tree ships. The canonical
// failure this closes: a live test run against a provably-stale cache, when the answer sat
// in installed_plugins.json the whole time. No agent, no tokens: it reads config files and
// content-digests trees. Exit 0 on CURRENT (or provenance-only), 1 on STALE, 2 on
// unreadable — staleness and unreadability both fail closed.
//
// COVERAGE IS THE CONTRACT. The verdict is only as strong as the set of files it
// compares, and the claims that rest on it (commands/expert.md step 1's bright line)
// are claims about the plugin's BEHAVIOR. Comparing the two manifests alone rendered
// CURRENT over a cache whose workflow script and core skill had been replaced with
// stubs — the most common real staleness is source edited without a version bump,
// which is precisely what a manifest comparison cannot see. COMPARED_TREES therefore
// enumerates every tree that carries executable or instruction content; a new such
// tree in the plugin must be added there or the verdict silently narrows.
//
// Usage: node preflight-deployment.mjs [plugin-name] [working-tree-path]
//   plugin-name        default "expert-dev-tools"; bare name or full "name@marketplace"
//   working-tree-path  the plugin's source checkout to compare against; omit outside
//                      the plugin's own repo (the report is then provenance-only)
// Env: CLAUDE_CONFIG_DIR overrides the config root (default ~/.claude) — also how the
// structural tier drives this script against fixture registries.

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import { join, dirname, isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Every tree whose contents decide what the installed plugin DOES. Anything outside
// this set plus COMPARED_FILES is documentation or test scaffolding, whose staleness
// does not falsify a behavioral claim.
export const COMPARED_TREES = ['agents', 'commands', 'hooks', 'scripts', 'skills', 'workflows'];
export const COMPARED_FILES = ['.claude-plugin/plugin.json', '.mcp.json'];

// The other half of the coverage contract: what is deliberately OUTSIDE the comparison,
// declared rather than merely absent. The header above instructs a maintainer to extend
// COMPARED_TREES when a behavior-bearing tree appears — an instruction nothing could
// enforce, because the failure it warns about is silent by construction (the verdict
// still reads CURRENT and no test reddens). Declaring the exclusions makes the two sets
// a claimed PARTITION of the plugin root, and T-29 asserts that partition is total. A
// new root entry then fails the structural tier until someone classifies it as compared
// or excluded, which is the behavior the header's sentence asks for and could not get.
export const EXCLUDED_TREES = ['docs', 'tests'];
export const EXCLUDED_FILES = ['README.md'];

export function configDir() {
  return process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude');
}

function readJson(path, what, problems) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    problems.push(`${what} unreadable at ${path}: ${e.message}`);
    return null;
  }
}

// Byte-compare one relative file between the cache and the working tree.
// Both absent is not a diff; one-sided presence and differing bytes are.
function fileDiff(rel, cachePath, worktreePath) {
  const a = join(cachePath, rel);
  const b = join(worktreePath, rel);
  const aExists = existsSync(a);
  const bExists = existsSync(b);
  if (!aExists && !bExists) return null;
  if (!aExists) return `${rel}: missing in installed cache`;
  if (!bExists) return `${rel}: missing in working tree`;
  return readFileSync(a).equals(readFileSync(b)) ? null : `${rel}: bytes differ`;
}

// Content digest of one tree: relative path -> sha256 of the file's bytes. An absent
// tree yields an empty map, so "present on one side only" surfaces as added/removed
// entries rather than being silently skipped. Throws on an unreadable directory or
// file — the caller records that as a `problems` entry (UNREADABLE), never as CURRENT.
//
// The directory read is deliberately NOT wrapped. Swallowing it returned an empty map
// for a tree that was never actually read, and two unread trees compare EQUAL — the
// script's one path to a confident CURRENT over a comparison it did not perform, which
// is the same fail-open shape the whole coverage contract above exists to close. An
// unreadable tree is an unreadable environment, and this script reports those.
export function treeDigest(root, rel) {
  const out = new Map();
  const walk = (dir, prefix) => {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const e of entries.sort((x, y) => (x.name < y.name ? -1 : 1))) {
      const p = join(dir, e.name);
      const key = prefix ? `${prefix}/${e.name}` : e.name;
      if (e.isDirectory()) walk(p, key);
      else if (e.isFile()) out.set(key, createHash('sha256').update(readFileSync(p)).digest('hex'));
    }
  };
  if (existsSync(join(root, rel))) walk(join(root, rel), rel);
  return out;
}

// Diff two digest maps into human-readable entries, capped so one wholesale
// divergence cannot bury the report. The count is always exact even when the
// names are elided — a narrowed listing must never read as a narrowed finding.
function digestDiff(rel, cacheMap, treeMap, cap = 5) {
  const names = [];
  for (const [k, v] of treeMap) {
    if (!cacheMap.has(k)) names.push(`${k} (missing in installed cache)`);
    else if (cacheMap.get(k) !== v) names.push(`${k} (bytes differ)`);
  }
  for (const k of cacheMap.keys()) if (!treeMap.has(k)) names.push(`${k} (missing in working tree)`);
  if (names.length === 0) return null;
  names.sort();
  const shown = names.slice(0, cap).join(', ');
  return `${rel}/: ${names.length} file(s) diverge — ${shown}${names.length > cap ? `, +${names.length - cap} more` : ''}`;
}

// Build the provenance report. `problems` collects every unreadable surface; any
// entry makes the run UNREADABLE (fail closed), never a silent partial verdict.
export function preflightDeployment(pluginName, worktreePath, cfgDir = configDir()) {
  const problems = [];
  const registryPath = join(cfgDir, 'plugins', 'installed_plugins.json');
  const registry = readJson(registryPath, 'installed-plugins registry', problems);

  const report = {
    plugin: pluginName,
    config_dir: cfgDir,
    registry: registryPath,
    cache_path: null,
    installed_version: null,
    installed_commit: null,
    worktree_path: worktreePath || null,
    worktree_version: null,
    stale: null,
    diffs: [],
    installs: [],
    problems,
  };

  const plugins = registry && registry.plugins;
  if (registry && (typeof plugins !== 'object' || plugins === null)) {
    problems.push(`registry has no 'plugins' map (version ${registry.version ?? 'unknown'})`);
  }

  let records = [];
  if (plugins) {
    const keys = Object.keys(plugins)
      .filter((k) => k === pluginName || k.split('@')[0] === pluginName)
      .sort();
    if (keys.length === 0) problems.push(`plugin '${pluginName}' not found in ${registryPath}`);
    for (const key of keys) {
      // A registry value of the wrong shape is an UNREADABLE environment, not an
      // absent plugin. Iterating it unguarded threw a TypeError out of main(), and
      // an uncaught throw exits 1 — the STALE code, which commands/expert.md routes
      // to "the plugin is behind and needs updating". Wrong shape, confident answer.
      if (!Array.isArray(plugins[key])) {
        problems.push(`registry entry '${key}' is ${plugins[key] === null ? 'null' : typeof plugins[key]}, not an array of install records`);
        continue;
      }
      for (const rec of plugins[key]) {
        if (!rec || typeof rec !== 'object') {
          problems.push(`registry entry '${key}' contains a non-object install record`);
          continue;
        }
        records.push({ key, rec });
      }
    }
  }

  let worktreeManifest = null;
  if (worktreePath) {
    worktreeManifest = readJson(join(worktreePath, '.claude-plugin', 'plugin.json'), 'working-tree manifest', problems);
    if (worktreeManifest) report.worktree_version = worktreeManifest.version ?? null;
  }

  for (const { key, rec } of records) {
    // Real registries carry absolute installPaths; fixture registries may carry
    // paths relative to the registry file's directory (<config>/plugins/).
    if (typeof rec.installPath !== 'string' || rec.installPath === '') {
      problems.push(`registry record for '${key}' has no usable installPath`);
      continue;
    }
    const cachePath = isAbsolute(rec.installPath) ? rec.installPath : resolve(dirname(registryPath), rec.installPath);
    const cacheManifest = readJson(join(cachePath, '.claude-plugin', 'plugin.json'), `installed cache manifest (${key})`, problems);
    const entry = {
      key,
      scope: rec.scope ?? null,
      cache_path: cachePath,
      installed_version: rec.version ?? null,
      cache_manifest_version: cacheManifest ? cacheManifest.version ?? null : null,
      installed_commit: rec.gitCommitSha ?? null,
      stale: null,
      diffs: [],
    };
    if (worktreePath && worktreeManifest && cacheManifest) {
      if (entry.cache_manifest_version !== report.worktree_version)
        entry.diffs.push(`version: installed cache ${entry.cache_manifest_version} != working tree ${report.worktree_version}`);
      for (const rel of COMPARED_FILES) {
        const d = fileDiff(rel, cachePath, worktreePath);
        if (d) entry.diffs.push(d);
      }
      for (const rel of COMPARED_TREES) {
        // A tree that could not be digested is recorded as a problem and NEVER folded
        // into the diff list: an empty-vs-empty comparison of two unread trees is
        // indistinguishable from agreement, so the only honest verdict is UNREADABLE.
        let cacheTree, treeTree;
        try {
          cacheTree = treeDigest(cachePath, rel);
          treeTree = treeDigest(worktreePath, rel);
        } catch (e) {
          problems.push(`tree '${rel}' could not be read for '${key}': ${e.message}`);
          continue;
        }
        const d = digestDiff(rel, cacheTree, treeTree);
        if (d) entry.diffs.push(d);
      }
      entry.compared = { files: COMPARED_FILES.slice(), trees: COMPARED_TREES.slice() };
      entry.stale = entry.diffs.length > 0;
    }
    report.installs.push(entry);
  }

  // Primary record for the quotable top-level fields: the user-scope install if
  // one exists (the one a plain session runs), else the first record.
  const primary = report.installs.find((i) => i.scope === 'user') || report.installs[0] || null;
  if (primary) {
    report.cache_path = primary.cache_path;
    report.installed_version = primary.installed_version;
    report.installed_commit = primary.installed_commit;
    report.diffs = primary.diffs;
    report.stale = primary.stale;
  }

  if (problems.length > 0) report.verdict = 'UNREADABLE';
  else if (!worktreePath) report.verdict = 'PROVENANCE-ONLY';
  else report.verdict = report.installs.some((i) => i.stale) ? 'STALE' : 'CURRENT';
  return report;
}

// Any throw that reaches here is an environment this script could not read, so it
// exits 2 (UNREADABLE) and never 1. Node's default for an uncaught exception is
// exit 1 — the STALE code — which would report an unreadable environment to the
// owner as the specific, confident, wrong diagnosis "the plugin is behind".
function main() {
  try { run(); } catch (e) {
    console.log(`VERDICT: UNREADABLE (preflight threw: ${e && e.message ? e.message : String(e)})`);
    process.exit(2);
  }
}

function run() {
  const pluginName = process.argv[2] || 'expert-dev-tools';
  const worktreePath = process.argv[3] || null;
  const report = preflightDeployment(pluginName, worktreePath);
  console.log(JSON.stringify(report, null, 2));
  if (report.verdict === 'STALE') {
    console.log(`VERDICT: STALE (installed ${report.installed_version ?? '?'} at ${report.cache_path}; working tree ${report.worktree_version ?? '?'})`);
    process.exit(1);
  }
  if (report.verdict === 'UNREADABLE') {
    console.log(`VERDICT: UNREADABLE (${report.problems.join('; ')})`);
    process.exit(2);
  }
  if (report.verdict === 'PROVENANCE-ONLY') {
    console.log(`VERDICT: PROVENANCE-ONLY (installed ${report.installed_version ?? '?'} commit ${report.installed_commit ?? '?'} at ${report.cache_path}; no working tree supplied, no staleness determination)`);
    process.exit(0);
  }
  console.log(`VERDICT: CURRENT (installed ${report.installed_version ?? '?'} matches working tree ${report.worktree_version ?? '?'})`);
  process.exit(0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main();
}
