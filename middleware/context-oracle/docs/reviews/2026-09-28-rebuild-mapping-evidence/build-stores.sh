#!/bin/sh
# build-stores.sh <work-dir> — build real legacy stores with the historical
# builds that build-builds.sh compiled into <work-dir>. Each store gets its own
# throwaway HOME, CTXORACLE_HOME and git repository under <work-dir>; GIT_DIR and
# GIT_WORK_TREE are unset. Every command and its output is printed.
#   A — b229c04 layout: `init` by b229c04; every verb and hook by b229c04.
#   B — b229c04 layout: `init` by HEAD (same migrations; b229c04's init stops
#       at its first index, store A); every verb and hook by b229c04.
#   C — 4dd0f00/4e070ce layout: `init`, verbs and hooks by 59cc05c, then verbs
#       by b229c04 (a later build opens it without migrating: the runner returns
#       on schema_version >= 1).
set -u
W="$(cd "$1" && pwd)"; HERE="$(cd "$(dirname "$0")" && pwd)"
unset GIT_DIR GIT_WORK_TREE
N="node --no-warnings"
D() { echo "$W/$1/middleware/context-oracle/ctxoracle/dist/src/cli/dispatch.js"; }
run() { echo "\$ ctxoracle[$1] $(shift; echo "$*")"; b="$1"; shift; $N "$(D "$b")" "$@" 2>&1; echo "[exit $?]"; }
hook() { # hook <build> <event> <json>
  echo "\$ echo '$3' | ctxoracle[$1] hook $2"; printf '%s' "$3" | $N "$(D "$1")" hook "$2" 2>&1; echo; echo "[exit $?]"; }
q() { $N -e "const {DatabaseSync}=require('node:sqlite');const d=new DatabaseSync(process.argv[1],{readOnly:true});console.log(JSON.stringify(d.prepare(process.argv[2]).all()))" "$@"; }
ids() { q "$1" "$2" | $N -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).map(r=>r.id).join(" ")))'; }
dump() { # dump <store.db> <global.db>
  echo "--- tables of $1"
  for t in $(q "$1" "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'fts_%' ORDER BY name" | $N -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).map(r=>r.name).join(" ")))'); do
    echo "$t $(q "$1" "SELECT count(*) n FROM $t")"; done
  echo "schema_meta: $(q "$1" "SELECT key,value FROM schema_meta ORDER BY key")"
  echo "global_meta: $(q "$2" "SELECT key,value FROM global_meta ORDER BY key")"
  echo "owner tuning: $(q "$2" "SELECT key,value,source FROM tuning WHERE source='owner' ORDER BY rowid")"
  echo "lessons: $(q "$2" "SELECT statement FROM lessons")"
  echo "human_facts: $(q "$1" "SELECT statement,target_kind,target_ref FROM human_facts")"
  echo "corrections: $(q "$1" "SELECT * FROM corrections")"
  echo "questions: $(q "$1" "SELECT consumer,question_text,status FROM questions")"
  echo "landmines: $(q "$1" "SELECT l.kind,f.path,l.evidence FROM landmines l JOIN files f ON f.id=l.file_id")"
  echo "files: $(q "$1" "SELECT id,path FROM files ORDER BY id")"
}

store() { # store <label> <init-build> <verb-build>
L="$1"; INIT="$2"; V="$3"
echo; echo "=== store $L: init by $INIT; verbs and hooks by $V"
REPO="$W/repo$L"; sh "$HERE/mkrepo.sh" "$REPO" >/dev/null
export HOME="$W/home$L" CTXORACLE_HOME="$W/oracle$L"; rm -rf "$HOME" "$CTXORACLE_HOME"; mkdir -p "$HOME"
cd "$REPO"
run "$INIT" init
run "$V" tune bar.confidence_floor 0.65
run "$V" tune lexicon.stoplist "who cares?"
run "$V" tune bar.recency_half_life_days 10
run "$V" tune bar.no_such_key 1
run "$V" note "src/a.ts is written by hand; keep the export name" --file src/a.ts
run "$V" note "the build uses tsc only"
run "$V" note --global "prefer small commits"
run "$V" note "renaming src/c.ts breaks the build" --kind landmine --file src/c.ts
hook "$V" SessionStart '{"hook_event_name":"SessionStart","session_id":"S1","cwd":"'"$REPO"'","source":"startup","transcript_path":""}'
hook "$V" UserPromptSubmit '{"hook_event_name":"UserPromptSubmit","session_id":"S1","cwd":"'"$REPO"'","prompt":"What does src/a.ts export?"}'
for i in 1 2 3; do
  hook "$V" PreToolUse '{"hook_event_name":"PreToolUse","session_id":"S1","cwd":"'"$REPO"'","tool_name":"Edit","tool_input":{"file_path":"'"$REPO"'/src/a.ts"}}'
done
hook "$V" PostToolUse '{"hook_event_name":"PostToolUse","session_id":"S1","cwd":"'"$REPO"'","tool_name":"Read","tool_input":{"file_path":"'"$REPO"'/src/b.ts"},"tool_response":{}}'
hook "$V" PostToolUse '{"hook_event_name":"PostToolUse","session_id":"S1","cwd":"'"$REPO"'","tool_name":"Bash","tool_input":{"command":"npm test"},"tool_response":{}}'
hook "$V" SessionEnd '{"hook_event_name":"SessionEnd","session_id":"S1","cwd":"'"$REPO"'","reason":"exit"}'
# S2 stays live: an open question and a read, no SessionEnd (F5-8).
hook "$V" SessionStart '{"hook_event_name":"SessionStart","session_id":"S2","cwd":"'"$REPO"'","source":"startup","transcript_path":""}'
hook "$V" UserPromptSubmit '{"hook_event_name":"UserPromptSubmit","session_id":"S2","cwd":"'"$REPO"'","prompt":"Which test covers src/c.ts?"}'
hook "$V" PostToolUse '{"hook_event_name":"PostToolUse","session_id":"S2","cwd":"'"$REPO"'","tool_name":"Read","tool_input":{"file_path":"'"$REPO"'/src/c.ts"},"tool_response":{}}'
P=$(ls -d "$CTXORACLE_HOME"/projects/*)/store.db; G="$CTXORACLE_HOME/global/global.db"
echo "\$ node synth.mjs <$V build> $P"
SYN=$($N "$HERE/synth.mjs" "$W/$V" "$P" 2>&1); echo "$SYN"
WID=$(printf '%s' "$SYN" | $N -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log(JSON.parse(s).whisper)}catch{console.log("none")}})')
set -- $(ids "$P" "SELECT id FROM whisper_audit WHERE kind='deny' ORDER BY rowid")
run "$V" correct "${1:-none}" --verdict false_fire --note "the question was rhetorical"
run "$V" correct "${2:-none}" --verdict missed
run "$V" correct "${3:-none}" --verdict confirm
run "$V" correct "$WID" --verdict false_fire --note "not coupled"
run "$V" correct --missed-question "why does the build take so long?"
dump "$P" "$G"
}

store A b229c04 b229c04
store B HEAD b229c04
store C 59cc05c 59cc05c
echo; echo "=== store C, continued: the b229c04 build's verbs on the 4dd0f00/4e070ce-layout store"
export HOME="$W/homeC" CTXORACLE_HOME="$W/oracleC"; cd "$W/repoC"
P=$(ls -d "$CTXORACLE_HOME"/projects/*)/store.db; G="$CTXORACLE_HOME/global/global.db"
run b229c04 tune bar.support_min 5
run b229c04 note "written by b229c04 into the old layout" --file src/b.ts
run b229c04 note --global "a b229c04 lesson in the old layout"
set -- $(ids "$P" "SELECT id FROM whisper_audit WHERE kind='deny' ORDER BY rowid")
run b229c04 correct "${1:-none}" --verdict confirm
run b229c04 correct --missed-question "is the cache invalidated?"
dump "$P" "$G"
echo; echo "=== sha256 of every legacy file"
for L in A B C; do (cd "$W/oracle$L" && find . -type f | sort | xargs sha256sum); done
