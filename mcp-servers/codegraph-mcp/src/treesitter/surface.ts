import Parser from "tree-sitter";

import { Language, Endpoint, Channel } from "../types.js";

// ============================================================
// Interface surface extraction: HTTP endpoints + channels
// ============================================================
//
// Framework-pattern detection over the parse tree (no line-regex). Endpoints:
// Express/Fastify member calls (`app.get('/x', ...)`), FastAPI/Flask decorators,
// and Next.js app-router `route.ts` files. Channels: MQTT publish/subscribe, WS
// emit/on, HTTP client calls, and env-var reads — the cross-language wires that
// `codegraph_find_bridges` matches producer-to-consumer.

type Node = Parser.SyntaxNode;
const lineOf = (n: Node): number => n.startPosition.row + 1;
const unquote = (t: string): string => t.replace(/^[`'"]/, "").replace(/[`'"]$/, "");

const HTTP_METHODS = new Set(["get", "post", "put", "patch", "delete", "head", "options"]);

/** Normalize an HTTP path/URL to a comparable route: strip origin + query, lowercase, de-param. */
export function normalizeHttpPath(raw: string): string {
  let p = raw.replace(/^https?:\/\/[^/]+/, "").replace(/\?.*$/, "");
  if (!p.startsWith("/")) p = "/" + p;
  p = p.replace(/:(\w+)/g, "{p}").replace(/\$\{[^}]+\}/g, "{p}").replace(/\{[^}]+\}/g, "{p}");
  return p.replace(/\/+$/, "") || "/";
}

function firstStringArg(call: Node): string | undefined {
  const args = call.childForFieldName("arguments");
  const s = args?.namedChildren.find((c) => c.type === "string" || c.type === "string_literal");
  return s ? unquote(s.text) : undefined;
}

// ---------- Endpoints ----------

function nextRoute(relPath: string): string | null {
  const p = relPath.replace(/\\/g, "/");
  if (/(?:^|\/)app\/route\.[jt]sx?$/.test(p)) return "/";
  const m = p.match(/(?:^|\/)app\/(.+)\/route\.[jt]sx?$/);
  if (!m) return null;
  let r = "/" + m[1];
  r = r.replace(/\/\([^/]*\)/g, ""); // route groups (auth)
  r = r.replace(/\[\.\.\.(\w+)\]/g, ":$1*").replace(/\[(\w+)\]/g, ":$1");
  return r === "" ? "/" : r;
}

function extractJsEndpoints(root: Node, relPath: string): Endpoint[] {
  const out: Endpoint[] = [];

  // Express / Fastify: <obj>.<method>('/path', ...)
  for (const call of root.descendantsOfType("call_expression")) {
    const fn = call.childForFieldName("function");
    if (!fn || fn.type !== "member_expression") continue;
    const method = fn.childForFieldName("property")?.text?.toLowerCase();
    if (!method || (!HTTP_METHODS.has(method) && method !== "all")) continue;
    const route = firstStringArg(call);
    if (!route || !route.startsWith("/")) continue;
    out.push({ method: method === "all" ? "ANY" : method.toUpperCase(), route, framework: "express", line: lineOf(call) });
  }

  // Next.js app-router: exported GET/POST/... in a route.ts file.
  const route = nextRoute(relPath);
  if (route) {
    for (const stmt of root.descendantsOfType("export_statement")) {
      const decl = stmt.namedChildren.find((c) => c.type === "function_declaration");
      const name = decl?.childForFieldName("name")?.text;
      if (name && HTTP_METHODS.has(name.toLowerCase())) {
        out.push({ method: name.toUpperCase(), route, framework: "next", line: lineOf(decl!) });
      }
    }
  }
  return out;
}

function extractPyEndpoints(root: Node): Endpoint[] {
  const out: Endpoint[] = [];
  for (const dec of root.descendantsOfType("decorator")) {
    const call = dec.descendantsOfType("call")[0];
    if (!call) continue;
    const fn = call.childForFieldName("function");
    if (!fn || fn.type !== "attribute") continue;
    const attr = fn.childForFieldName("attribute")?.text?.toLowerCase();
    const route = firstStringArg(call);
    if (!route) continue;
    if (attr && HTTP_METHODS.has(attr)) {
      out.push({ method: attr.toUpperCase(), route, framework: "fastapi", line: lineOf(dec) });
    } else if (attr === "route") {
      out.push({ method: "ANY", route, framework: "flask", line: lineOf(dec) });
    }
  }
  return out;
}

export function extractEndpoints(language: Language, root: Node, relPath: string): Endpoint[] {
  switch (language) {
    case "typescript":
    case "javascript":
      return extractJsEndpoints(root, relPath);
    case "python":
      return extractPyEndpoints(root);
    default:
      return [];
  }
}

// ---------- Channels ----------

function extractJsChannels(root: Node): Channel[] {
  const out: Channel[] = [];
  for (const call of root.descendantsOfType("call_expression")) {
    const fn = call.childForFieldName("function");
    if (!fn) continue;
    if (fn.type === "identifier" && fn.text === "fetch") {
      const u = firstStringArg(call);
      if (u) out.push({ kind: "http", key: normalizeHttpPath(u), role: "consumer", line: lineOf(call) });
      continue;
    }
    if (fn.type !== "member_expression") continue;
    const obj = fn.childForFieldName("object")?.text ?? "";
    const prop = fn.childForFieldName("property")?.text ?? "";
    const u = firstStringArg(call);
    if (prop === "publish" && u) out.push({ kind: "mqtt", key: u, role: "producer", line: lineOf(call) });
    else if (prop === "subscribe" && u) out.push({ kind: "mqtt", key: u, role: "consumer", line: lineOf(call) });
    else if (prop === "emit" && u && /socket|io|ws/i.test(obj)) out.push({ kind: "ws", key: u, role: "producer", line: lineOf(call) });
    else if (prop === "on" && u && /socket|io|ws/i.test(obj)) out.push({ kind: "ws", key: u, role: "consumer", line: lineOf(call) });
    else if (obj === "axios" && HTTP_METHODS.has(prop) && u) out.push({ kind: "http", key: normalizeHttpPath(u), role: "consumer", line: lineOf(call) });
  }
  // process.env.X
  for (const m of root.descendantsOfType("member_expression")) {
    const obj = m.childForFieldName("object");
    const prop = m.childForFieldName("property")?.text;
    if (prop && obj && obj.type === "member_expression" &&
        obj.childForFieldName("object")?.text === "process" &&
        obj.childForFieldName("property")?.text === "env") {
      out.push({ kind: "env", key: prop, role: "consumer", line: lineOf(m) });
    }
  }
  return out;
}

function extractPyChannels(root: Node): Channel[] {
  const out: Channel[] = [];
  for (const call of root.descendantsOfType("call")) {
    const fn = call.childForFieldName("function");
    if (!fn || fn.type !== "attribute") continue;
    const obj = fn.childForFieldName("object")?.text ?? "";
    const attr = fn.childForFieldName("attribute")?.text ?? "";
    const u = firstStringArg(call);
    if (attr === "publish" && u) out.push({ kind: "mqtt", key: u, role: "producer", line: lineOf(call) });
    else if (attr === "subscribe" && u) out.push({ kind: "mqtt", key: u, role: "consumer", line: lineOf(call) });
    else if (obj === "requests" && HTTP_METHODS.has(attr) && u) out.push({ kind: "http", key: normalizeHttpPath(u), role: "consumer", line: lineOf(call) });
    else if ((attr === "getenv" || (obj === "environ" && attr === "get")) && u) out.push({ kind: "env", key: u, role: "consumer", line: lineOf(call) });
  }
  // os.environ['X']
  for (const sub of root.descendantsOfType("subscript")) {
    const value = sub.childForFieldName("value");
    if (value?.type === "attribute" && value.childForFieldName("attribute")?.text === "environ") {
      const idx = sub.childForFieldName("subscript") ?? sub.namedChildren[1];
      if (idx && (idx.type === "string")) out.push({ kind: "env", key: unquote(idx.text), role: "consumer", line: lineOf(sub) });
    }
  }
  return out;
}

function extractCppChannels(root: Node): Channel[] {
  const out: Channel[] = [];
  for (const call of root.descendantsOfType("call_expression")) {
    const fn = call.childForFieldName("function");
    if (!fn || fn.type !== "field_expression") continue;
    const field = fn.childForFieldName("field")?.text ?? "";
    const u = firstStringArg(call);
    if (field === "publish" && u) out.push({ kind: "mqtt", key: u, role: "producer", line: lineOf(call) });
    else if (field === "subscribe" && u) out.push({ kind: "mqtt", key: u, role: "consumer", line: lineOf(call) });
  }
  return out;
}

export function extractChannels(language: Language, root: Node): Channel[] {
  switch (language) {
    case "typescript":
    case "javascript":
      return extractJsChannels(root);
    case "python":
      return extractPyChannels(root);
    case "cpp":
    case "arduino":
      return extractCppChannels(root);
    default:
      return [];
  }
}

/** Whether an MQTT subscription pattern (with +/#) matches a concrete topic. */
export function mqttMatches(pattern: string, topic: string): boolean {
  if (pattern === topic) return true;
  const pp = pattern.split("/");
  const tp = topic.split("/");
  for (let i = 0; i < pp.length; i++) {
    if (pp[i] === "#") return true;
    if (i >= tp.length) return false;
    if (pp[i] === "+") continue;
    if (pp[i] !== tp[i]) return false;
  }
  return pp.length === tp.length;
}
