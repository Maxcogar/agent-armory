#!/usr/bin/env bash
# Claim (Step 31, D-plan-6): fs.realpathSync(process.argv[1]) is dist/src/cli/dispatch.js under direct node, an npm -g symlink, and npx from a packed tarball; argv[1] keeps the link name; execPath is absolute.
cd "$PROBE_LAYOUT"; mkdir -p dist/src/cli
printf '#!/usr/bin/env node\nimport {realpathSync} from "node:fs";\nconst r=realpathSync(process.argv[1]);\nconsole.log(JSON.stringify({argv1_basename: process.argv[1].split("/").pop(), real_endswith: r.endsWith("dist/src/cli/dispatch.js"), execPath_absolute: process.execPath.startsWith("/")}));\n' > dist/src/cli/dispatch.js; chmod +x dist/src/cli/dispatch.js
echo "direct:  $(node dist/src/cli/dispatch.js)"
rm -rf .link && mkdir .link && ln -s "$PWD/dist/src/cli/dispatch.js" .link/ctxoracle && echo "symlink: $(.link/ctxoracle)"
rm -rf .gprefix && npm install -g --prefix "$PWD/.gprefix" . >/dev/null 2>&1 && echo "npm -g:  $(.gprefix/bin/ctxoracle)"
# npx from a packed tarball of a dependency-free copy (no network): the shim name is `ctxoracle`, the real file is dispatch.js
rm -rf .pack && mkdir .pack && cp -r dist .pack/ && printf '{"name":"ctxoracle-probe-npx","version":"0.0.1","private":true,"type":"module","bin":{"ctxoracle":"dist/src/cli/dispatch.js"}}' > .pack/package.json
( cd .pack && npm pack --silent >/dev/null 2>&1 ) && echo "npx:     $(npx --yes --package="$PWD/.pack/ctxoracle-probe-npx-0.0.1.tgz" ctxoracle 2>/dev/null)"
rm -rf .link .gprefix .pack
