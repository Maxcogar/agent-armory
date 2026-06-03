import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apsGet } from "../services/aps-client.js";
import { isAuthenticated, getAuthUrl } from "../services/aps-auth.js";

interface JsonApiResource {
  type: string;
  id: string;
  attributes: Record<string, unknown>;
}
interface JsonApiResponse {
  data: JsonApiResource[] | JsonApiResource;
}

function pick(r: JsonApiResource, kind: "hub" | "project" | "folder" | "item" | "version"): Record<string, unknown> {
  const a = r.attributes;
  const ext = a.extension as Record<string, unknown> | undefined;
  switch (kind) {
    case "hub": return { id: r.id, name: a.name, type: ext?.type ?? r.type, region: a.region };
    case "project": return { id: r.id, name: a.name, type: ext?.type ?? r.type };
    case "folder":
    case "item": return { id: r.id, name: a.displayName ?? a.name, type: r.type === "folders" ? "folder" : "item", lastModified: a.lastModifiedTime };
    case "version": return { id: r.id, name: a.name, createTime: a.createTime, mimeType: a.mimeType, fileType: a.fileType, storageSize: a.storageSize };
  }
}

function arr(d: JsonApiResource[] | JsonApiResource): JsonApiResource[] { return Array.isArray(d) ? d : d ? [d] : []; }

export function registerDataManagementTools(server: McpServer): void {
  server.registerTool("aps_auth_status", {
    title: "APS Auth Status",
    description: "Check if authenticated with Autodesk. Returns login URL if not.",
    inputSchema: {},
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async () => ({
    content: [{ type: "text", text: isAuthenticated() ? "Authenticated with Autodesk Platform Services." : `Not authenticated. Visit:\n\n${getAuthUrl()}` }],
  }));

  server.registerTool("aps_list_hubs", {
    title: "List APS Hubs",
    description: "List all accessible Autodesk hubs (Fusion Team, BIM360, ACC). Use hub id in aps_list_projects.",
    inputSchema: {},
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  }, async () => {
    const res = (await apsGet("https://developer.api.autodesk.com/project/v1/hubs")) as JsonApiResponse;
    const hubs = arr(res.data).map(h => pick(h, "hub"));
    return { content: [{ type: "text", text: JSON.stringify({ hubs, count: hubs.length }, null, 2) }] };
  });

  server.registerTool("aps_list_projects", {
    title: "List Projects in Hub",
    description: "List projects in a hub. Use project id in aps_list_top_folders.",
    inputSchema: { hub_id: z.string().describe("Hub ID") },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  }, async ({ hub_id }) => {
    const res = (await apsGet(`https://developer.api.autodesk.com/project/v1/hubs/${encodeURIComponent(hub_id)}/projects`)) as JsonApiResponse;
    const projects = arr(res.data).map(p => pick(p, "project"));
    return { content: [{ type: "text", text: JSON.stringify({ projects, count: projects.length }, null, 2) }] };
  });

  server.registerTool("aps_list_top_folders", {
    title: "List Top Folders in Project",
    description: "List top-level folders of a project.",
    inputSchema: { hub_id: z.string(), project_id: z.string() },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  }, async ({ hub_id, project_id }) => {
    const res = (await apsGet(`https://developer.api.autodesk.com/project/v1/hubs/${encodeURIComponent(hub_id)}/projects/${encodeURIComponent(project_id)}/topFolders`)) as JsonApiResponse;
    const folders = arr(res.data).map(f => pick(f, "folder"));
    return { content: [{ type: "text", text: JSON.stringify({ folders, count: folders.length }, null, 2) }] };
  });

  server.registerTool("aps_list_folder_contents", {
    title: "List Folder Contents",
    description: "List contents of a folder (subfolders and items).",
    inputSchema: { project_id: z.string(), folder_id: z.string() },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  }, async ({ project_id, folder_id }) => {
    const res = (await apsGet(`https://developer.api.autodesk.com/data/v1/projects/${encodeURIComponent(project_id)}/folders/${encodeURIComponent(folder_id)}/contents`)) as JsonApiResponse;
    const contents = arr(res.data).map(e => pick(e, e.type === "folders" ? "folder" : "item"));
    return { content: [{ type: "text", text: JSON.stringify({ contents, count: contents.length }, null, 2) }] };
  });

  server.registerTool("aps_get_item_versions", {
    title: "Get Item Versions",
    description: "Get all versions of an item. Tip (latest) is first. Version id contains the URN for Model Derivative.",
    inputSchema: { project_id: z.string(), item_id: z.string() },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  }, async ({ project_id, item_id }) => {
    const res = (await apsGet(`https://developer.api.autodesk.com/data/v1/projects/${encodeURIComponent(project_id)}/items/${encodeURIComponent(item_id)}/versions`)) as JsonApiResponse;
    const versions = arr(res.data).map(v => pick(v, "version"));
    return { content: [{ type: "text", text: JSON.stringify({ versions, count: versions.length }, null, 2) }] };
  });

  server.registerTool("aps_search_folder", {
    title: "Search Folder Contents",
    description: "Recursively search within a folder for items matching a name filter.",
    inputSchema: { project_id: z.string(), folder_id: z.string(), filter: z.string().describe("Search string") },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
  }, async ({ project_id, folder_id, filter }) => {
    const params = new URLSearchParams({ "filter[displayName]-contains": filter });
    const res = (await apsGet(`https://developer.api.autodesk.com/data/v1/projects/${encodeURIComponent(project_id)}/folders/${encodeURIComponent(folder_id)}/search?${params}`)) as JsonApiResponse;
    const results = arr(res.data).map(e => pick(e, "item"));
    return { content: [{ type: "text", text: JSON.stringify({ results, count: results.length, query: filter }, null, 2) }] };
  });
}
