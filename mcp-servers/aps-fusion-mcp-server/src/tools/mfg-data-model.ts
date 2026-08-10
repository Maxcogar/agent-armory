import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apsGraphQL } from "../services/aps-client.js";
import { CHARACTER_LIMIT } from "../constants.js";

// Manufacturing Data Model GraphQL endpoint. Verified against the live API:
// /manufacturing/graphql/v1 and /fusiondata/2022-04/graphql both return 404.
const MFG_GRAPHQL_URL = "https://developer.api.autodesk.com/mfg/graphql";

// --- Types ---

interface ComponentVersion {
  id: string;
  name: string;
}

interface Occurrence {
  parentComponentVersion: ComponentVersion;
  componentVersion: ComponentVersion;
}

interface ComponentTreeNode {
  id: string;
  name: string;
  children: ComponentTreeNode[];
}

// --- Helpers ---

function truncateIfNeeded(text: string): string {
  if (text.length > CHARACTER_LIMIT) {
    return (
      text.substring(0, CHARACTER_LIMIT) +
      "\n\n... [TRUNCATED - response exceeded limit.]"
    );
  }
  return text;
}

/**
 * Build a tree structure from flat occurrence list.
 */
function buildTree(
  rootId: string,
  rootName: string,
  occurrences: Occurrence[]
): ComponentTreeNode {
  const childrenMap = new Map<string, { id: string; name: string }[]>();

  for (const occ of occurrences) {
    const parentId = occ.parentComponentVersion.id;
    const child = {
      id: occ.componentVersion.id,
      name: occ.componentVersion.name,
    };
    const existing = childrenMap.get(parentId) || [];
    existing.push(child);
    childrenMap.set(parentId, existing);
  }

  function expand(id: string, name: string): ComponentTreeNode {
    const kids = childrenMap.get(id) || [];
    return {
      id,
      name,
      children: kids.map((k) => expand(k.id, k.name)),
    };
  }

  return expand(rootId, rootName);
}

function printTree(node: ComponentTreeNode, depth: number = 0): string[] {
  const indent = "  ".repeat(depth);
  const lines = [`${indent}- ${node.name}`];
  for (const child of node.children) {
    lines.push(...printTree(child, depth + 1));
  }
  return lines;
}

// --- Tool registration ---

export function registerMfgDataModelTools(server: McpServer): void {
  // --- Find design by name (single query: hubs → projects → items) ---
  server.registerTool(
    "aps_find_design",
    {
      title: "Find Fusion Design by Name",
      description: `Find a Fusion design by name using the Manufacturing Data Model GraphQL API.
This collapses the hub → project → item traversal into a single query.
You can filter by hub name, project name, and/or design name.

Args:
  - hub_name: (optional) Filter hubs by name
  - project_name: (optional) Filter projects by name
  - design_name: (optional) Filter items by name

Returns: Matching DesignItems with hub, project, and item IDs plus the root component name.

At least one filter should be provided. If you only know the design name, just pass design_name.`,
      inputSchema: {
        hub_name: z.string().optional().describe("Hub name filter (optional)"),
        project_name: z
          .string()
          .optional()
          .describe("Project name filter (optional)"),
        design_name: z
          .string()
          .optional()
          .describe("Design/file name filter (optional)"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ hub_name, project_name, design_name }) => {
      // Autodesk charges a "query point value" per request (max 1000), computed
      // from the REQUESTED pagination limits rather than the filtered results.
      // An unbounded hubs>projects>items query costs ~101k points and is
      // rejected outright, and tipRootComponentVersion is by far the most
      // expensive field (it alone pushes a 50-project scan from 623 to 3123).
      // So: scan broadly without it, then enrich only the few actual matches.
      const HUB_LIMIT = 2;
      const PROJECT_LIMIT = 50;
      const ITEM_LIMIT = 5;
      const MAX_ENRICH = 25;

      // JSON.stringify escapes embedded quotes — interpolating a raw name
      // breaks the query for any name containing a double quote.
      const conn = (name: string | undefined, limit: number): string => {
        const parts: string[] = [];
        if (name) parts.push(`filter: { name: ${JSON.stringify(name)} }`);
        parts.push(`pagination: { limit: ${limit} }`);
        return `(${parts.join(", ")})`;
      };

      // Phase 1 — broad, cheap scan across every project.
      const query = `{
        hubs${conn(hub_name, HUB_LIMIT)} {
          results {
            id
            name
            projects${conn(project_name, PROJECT_LIMIT)} {
              results {
                id
                name
                items${conn(design_name, ITEM_LIMIT)} {
                  results {
                    ... on DesignItem {
                      id
                      name
                    }
                  }
                }
              }
            }
          }
        }
      }`;

      const data = (await apsGraphQL(MFG_GRAPHQL_URL, query)) as {
        hubs: {
          results: Array<{
            id: string;
            name: string;
            projects: {
              results: Array<{
                id: string;
                name: string;
                items: {
                  results: Array<{ id?: string; name?: string }>;
                };
              }>;
            };
          }>;
        };
      };

      // Flatten into a results array
      const results: Array<Record<string, unknown>> = [];
      for (const hub of data.hubs.results) {
        for (const project of hub.projects.results) {
          for (const item of project.items.results) {
            if (item.name) {
              results.push({
                hub: { id: hub.id, name: hub.name },
                project: { id: project.id, name: project.name },
                design: { id: item.id, name: item.name },
              });
            }
          }
        }
      }

      // Phase 2 — attach the root component version id that the hierarchy,
      // physical-properties and STEP tools need downstream (~15 points each).
      for (const r of results.slice(0, MAX_ENRICH)) {
        const hub = r.hub as { id: string };
        const design = r.design as Record<string, unknown>;
        const designId = design.id as string | undefined;
        if (!designId) continue;
        try {
          const one = (await apsGraphQL(
            MFG_GRAPHQL_URL,
            `{ item(hubId: ${JSON.stringify(hub.id)}, itemId: ${JSON.stringify(
              designId
            )}) { ... on DesignItem { tipRootComponentVersion { id name } } } }`
          )) as {
            item?: { tipRootComponentVersion?: { id: string; name: string } };
          };
          design.rootComponent = one.item?.tipRootComponentVersion?.name;
          design.rootComponentVersionId = one.item?.tipRootComponentVersion?.id;
        } catch {
          // Best-effort: a match without its version id is still useful.
        }
      }
      for (const r of results.slice(MAX_ENRICH)) {
        r.note = `rootComponentVersionId not fetched (only the first ${MAX_ENRICH} matches are enriched)`;
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { designs: results, count: results.length },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // --- Get full component hierarchy ---
  server.registerTool(
    "aps_get_design_hierarchy",
    {
      title: "Get Fusion Design Component Hierarchy",
      description: `Get the full component hierarchy of a Fusion design using the Manufacturing Data Model API.
This returns the assembly tree (root component → subcomponents → sub-subcomponents).

Args:
  - hub_name: Hub name
  - project_name: Project name
  - design_name: Design file name

Returns: Full component tree showing the assembly hierarchy.

This is the Fusion-native hierarchy, not the Model Derivative object tree.`,
      inputSchema: {
        hub_name: z.string().describe("Hub name"),
        project_name: z.string().describe("Project name"),
        design_name: z.string().describe("Design/file name"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ hub_name, project_name, design_name }) => {
      // Every connection needs an explicit pagination limit: unbounded, this
      // query costs ~10.2M points against a 1000 budget and is rejected. The
      // three name filters are exact and required, so the outer levels can be
      // limit 1, leaving the budget for occurrences. Measured against the live
      // API: 50 occurrences = 534 points; 100 = 1034 (over budget).
      const OCCURRENCE_LIMIT = 50;
      const query = `{
        hubs(filter: { name: ${JSON.stringify(
          hub_name
        )} }, pagination: { limit: 1 }) {
          results {
            name
            projects(filter: { name: ${JSON.stringify(
              project_name
            )} }, pagination: { limit: 1 }) {
              results {
                name
                items(filter: { name: ${JSON.stringify(
                  design_name
                )} }, pagination: { limit: 1 }) {
                  results {
                    ... on DesignItem {
                      name
                      tipRootComponentVersion {
                        id
                        name
                        allOccurrences(pagination: { limit: ${OCCURRENCE_LIMIT} }) {
                          results {
                            parentComponentVersion {
                              id
                              name
                            }
                            componentVersion {
                              id
                              name
                            }
                          }
                          pagination {
                            cursor
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }`;

      const data = (await apsGraphQL(MFG_GRAPHQL_URL, query)) as {
        hubs: {
          results: Array<{
            name: string;
            projects: {
              results: Array<{
                name: string;
                items: {
                  results: Array<{
                    name?: string;
                    tipRootComponentVersion?: {
                      id: string;
                      name: string;
                      allOccurrences: {
                        results: Occurrence[];
                        pagination: { cursor: string | null };
                      };
                    };
                  }>;
                };
              }>;
            };
          }>;
        };
      };

      // Find the first design match
      for (const hub of data.hubs.results) {
        for (const project of hub.projects.results) {
          for (const item of project.items.results) {
            const root = item.tipRootComponentVersion;
            if (root) {
              const tree = buildTree(
                root.id,
                root.name,
                root.allOccurrences.results
              );
              const treeText = printTree(tree).join("\n");
              const hasCursor = root.allOccurrences.pagination.cursor !== null;

              return {
                content: [
                  {
                    type: "text",
                    text: truncateIfNeeded(
                      `Component Hierarchy: ${item.name}\n\n${treeText}${
                        hasCursor
                          ? "\n\n[Note: more components available - pagination cursor exists]"
                          : ""
                      }`
                    ),
                  },
                ],
              };
            }
          }
        }
      }

      return {
        content: [
          {
            type: "text",
            text: `No Fusion design found matching: hub="${hub_name}", project="${project_name}", design="${design_name}"`,
          },
        ],
      };
    }
  );

  // --- Get physical properties for a component ---
  server.registerTool(
    "aps_get_physical_properties",
    {
      title: "Get Component Physical Properties",
      description: `Get physical properties (mass, volume, density, bounding box, center of gravity) for a Fusion component.

Args:
  - component_version_id: The component version ID (from aps_find_design or aps_get_design_hierarchy)

Returns: Physical properties including mass, volume, density, area, bounding box, and center of gravity.

Note: This requires the component version ID, not the item/file ID.`,
      inputSchema: {
        component_version_id: z
          .string()
          .describe("Component version ID from aps_find_design or hierarchy"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ component_version_id }) => {
      // Verified against the live schema: Property is
      // { name, displayValue, value, definition } — there is no `unit` field;
      // the unit lives at definition.units.name. `status` is declared non-null
      // on PhysicalProperties but the API returns null for it, which fails the
      // whole query, so it is deliberately not requested.
      const prop = `{ value displayValue definition { units { name } } }`;
      const query = `{
        componentVersion(componentVersionId: ${JSON.stringify(
          component_version_id
        )}) {
          id
          name
          physicalProperties {
            mass ${prop}
            volume ${prop}
            density ${prop}
            area ${prop}
            boundingBox {
              length ${prop}
              width ${prop}
              height ${prop}
            }
          }
        }
      }`;

      const data = (await apsGraphQL(MFG_GRAPHQL_URL, query)) as {
        componentVersion: {
          id: string;
          name: string;
          physicalProperties: unknown;
        };
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(data.componentVersion, null, 2),
          },
        ],
      };
    }
  );

  // --- Generate STEP file for a component ---
  server.registerTool(
    "aps_generate_step",
    {
      title: "Generate STEP File for Component",
      description: `Request STEP file generation for a Fusion component via the Manufacturing Data Model API.

Args:
  - component_version_id: The component version ID

Returns: A signed URL to download the STEP file, or status if generation is still in progress.

This is an alternative to aps_translate_model that works directly with Fusion component IDs.`,
      inputSchema: {
        component_version_id: z
          .string()
          .describe("Component version ID"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async ({ component_version_id }) => {
      // Verified against the live schema: `derivatives` requires a
      // DerivativeInput { outputFormat, generate } and returns a LIST of
      // Derivative { id, outputFormat, status, signedUrl, expires }.
      // There is no `stepUrl` field. generate:true kicks off the translation.
      const query = `{
        componentVersion(componentVersionId: ${JSON.stringify(
          component_version_id
        )}) {
          id
          name
          derivatives(derivativeInput: { outputFormat: STEP, generate: true }) {
            id
            outputFormat
            status
            signedUrl
            expires
          }
        }
      }`;

      const data = (await apsGraphQL(MFG_GRAPHQL_URL, query)) as {
        componentVersion: {
          id: string;
          name: string;
          derivatives: Array<{
            id: string;
            outputFormat: string;
            status: string;
            signedUrl: string | null;
            expires: string | null;
          }> | null;
        };
      };

      const cv = data.componentVersion;
      const step = (cv.derivatives ?? []).find((d) => d.signedUrl) ??
        (cv.derivatives ?? [])[0];

      if (step?.signedUrl) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  component: cv.name,
                  status: step.status,
                  stepUrl: step.signedUrl,
                  expires: step.expires,
                  note: "This is a signed URL. Download it before it expires.",
                },
                null,
                2
              ),
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                component: cv.name,
                status: step?.status ?? "UNKNOWN",
                note: "STEP translation has been requested but is not ready yet. Call this tool again shortly to get the signed download URL.",
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // --- Get component thumbnail ---
  server.registerTool(
    "aps_get_component_thumbnail",
    {
      title: "Get Component Thumbnail",
      description: `Get a thumbnail image for a specific Fusion component.

Args:
  - component_version_id: The component version ID

Returns: Signed URL for the thumbnail image.`,
      inputSchema: {
        component_version_id: z
          .string()
          .describe("Component version ID"),
      },
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ component_version_id }) => {
      const query = `{
        componentVersion(componentVersionId: "${component_version_id}") {
          id
          name
          thumbnail {
            status
            signedUrl
          }
        }
      }`;

      const data = (await apsGraphQL(MFG_GRAPHQL_URL, query)) as {
        componentVersion: {
          id: string;
          name: string;
          thumbnail: {
            status: string;
            signedUrl: string | null;
          };
        };
      };

      const cv = data.componentVersion;
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                component: cv.name,
                thumbnailStatus: cv.thumbnail.status,
                signedUrl: cv.thumbnail.signedUrl,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );
}
