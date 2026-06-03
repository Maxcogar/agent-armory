import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apsGet, apsPost, urnToBase64 } from "../services/aps-client.js";
import { getAccessToken } from "../services/aps-auth.js";
import { APS_MODEL_DERIVATIVE_URL, CHARACTER_LIMIT } from "../constants.js";

const MD = APS_MODEL_DERIVATIVE_URL;

function truncate(text: string): string {
  return text.length > CHARACTER_LIMIT
    ? text.substring(0, CHARACTER_LIMIT) + "\n\n... [TRUNCATED]"
    : text;
}

interface ObjectNode { objectid: number; name: string; objects?: ObjectNode[] }

function flatTree(node: ObjectNode, depth = 0): string[] {
  const lines = [`${"  ".repeat(depth)}- [${node.objectid}] ${node.name}`];
  for (const c of node.objects ?? []) lines.push(...flatTree(c, depth + 1));
  return lines;
}

export function registerModelDerivativeTools(server: McpServer): void {
  server.registerTool("aps_get_model_views", {
    title: "Get Model Views",
    description: "Get viewable components (3D/2D) for a translated model. Returns guid for use with object tree and properties tools.",
    inputSchema: { urn: z.string().describe("Version URN/ID - will be base64-encoded") },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  }, async ({ urn }) => {
    const b = urnToBase64(urn);
    const res = (await apsGet(`${MD}/designdata/${b}/metadata`)) as { data: { metadata: Array<{ guid: string; name: string; role: string }> } };
    const views = res.data.metadata.map(m => ({ guid: m.guid, name: m.name, role: m.role }));
    return { content: [{ type: "text", text: JSON.stringify({ urn, views, count: views.length }, null, 2) }] };
  });

  server.registerTool("aps_get_object_tree", {
    title: "Get Object Tree",
    description: "Get hierarchical component/object tree for a model viewable. Use object IDs with aps_get_properties.",
    inputSchema: { urn: z.string(), guid: z.string().describe("Viewable GUID") },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  }, async ({ urn, guid }) => {
    const b = urnToBase64(urn);
    const res = (await apsGet(`${MD}/designdata/${b}/metadata/${guid}`)) as { data: { objects: ObjectNode[] } };
    const text = res.data.objects.flatMap(r => flatTree(r)).join("\n");
    return { content: [{ type: "text", text: truncate(`Object Tree (${guid}):\n\n${text}`) }] };
  });

  server.registerTool("aps_get_properties", {
    title: "Get Object Properties",
    description: "Get properties for objects. Pass object_id for specific objects (recommended), omit for all (can be very large).",
    inputSchema: {
      urn: z.string(),
      guid: z.string(),
      object_id: z.string().optional().describe("Comma-separated object IDs, e.g. '15,16'"),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  }, async ({ urn, guid, object_id }) => {
    const b = urnToBase64(urn);
    const params = new URLSearchParams({ forceget: "true" });
    if (object_id) params.set("objectid", object_id);
    const res = (await apsGet(`${MD}/designdata/${b}/metadata/${guid}/properties?${params}`)) as {
      data: { collection: Array<{ objectid: number; name: string; externalId?: string; properties: Record<string, unknown> }> }
    };
    const props = res.data.collection.map(o => ({ objectid: o.objectid, name: o.name, externalId: o.externalId, properties: o.properties }));
    return { content: [{ type: "text", text: truncate(JSON.stringify({ properties: props, count: props.length }, null, 2)) }] };
  });

  server.registerTool("aps_get_manifest", {
    title: "Get Translation Manifest",
    description: "Get translation status and available derivatives for a model.",
    inputSchema: { urn: z.string() },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  }, async ({ urn }) => {
    const res = (await apsGet(`${MD}/designdata/${urnToBase64(urn)}/manifest`)) as Record<string, unknown>;
    return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
  });

  server.registerTool("aps_translate_model", {
    title: "Translate/Export Model",
    description: "Start async translation to STL, STEP, IGES, OBJ, FBX, etc. Poll aps_get_manifest for status.",
    inputSchema: {
      urn: z.string(),
      output_format: z.enum(["svf2", "stl", "step", "iges", "obj", "fbx", "dwg", "ifc"]),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  }, async ({ urn, output_format }) => {
    const b = urnToBase64(urn);
    const res = (await apsPost(`${MD}/designdata/job`, {
      input: { urn: b },
      output: {
        formats: [{ type: output_format, ...(output_format === "svf2" ? { views: ["2d", "3d"] } : {}) }],
        destination: { region: "us" },
      },
    })) as { result: string; urn: string };
    return { content: [{ type: "text", text: JSON.stringify({ message: `Translation submitted: ${output_format}`, result: res.result, urn: res.urn, note: "Poll aps_get_manifest for status." }, null, 2) }] };
  });

  server.registerTool("aps_get_thumbnail", {
    title: "Get Model Thumbnail",
    description: "Get a PNG thumbnail of a translated model.",
    inputSchema: {
      urn: z.string(),
      width: z.number().int().optional().default(200),
      height: z.number().int().optional().default(200),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ urn, width, height }) => {
    const token = await getAccessToken();
    const params = new URLSearchParams({ width: String(width), height: String(height) });
    const res = await fetch(`${MD}/designdata/${urnToBase64(urn)}/thumbnail?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return { content: [{ type: "text", text: `Thumbnail failed (${res.status}). Model may not be translated yet.` }] };
    const buf = await res.arrayBuffer();
    return { content: [{ type: "image", data: Buffer.from(buf).toString("base64"), mimeType: "image/png" }] };
  });

  server.registerTool("aps_get_formats", {
    title: "Get Supported Formats",
    description: "List supported translation input/output format combinations.",
    inputSchema: {},
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async () => {
    const res = await apsGet(`${MD}/designdata/formats`);
    return { content: [{ type: "text", text: JSON.stringify(res, null, 2) }] };
  });
}
