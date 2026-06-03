import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apsGraphQL } from "../services/aps-client.js";
import { CHARACTER_LIMIT } from "../constants.js";

// Manufacturing Data Model GraphQL endpoint
const MFG_GRAPHQL_URL =
  "https://developer.api.autodesk.com/manufacturing/graphql/v1";

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
      // Build dynamic filter arguments
      const hubFilter = hub_name
        ? `(filter: { name: "${hub_name}" })`
        : "";
      const projectFilter = project_name
        ? `(filter: { name: "${project_name}" })`
        : "";
      const itemFilter = design_name
        ? `(filter: { name: "${design_name}" })`
        : "";

      const query = `{
        hubs${hubFilter} {
          results {
            id
            name
            projects${projectFilter} {
              results {
                id
                name
                items${itemFilter} {
                  results {
                    ... on DesignItem {
                      id
                      name
                      tipRootComponentVersion {
                        id
                        name
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
            id: string;
            name: string;
            projects: {
              results: Array<{
                id: string;
                name: string;
                items: {
                  results: Array<{
                    id?: string;
                    name?: string;
                    tipRootComponentVersion?: {
                      id: string;
                      name: string;
                    };
                  }>;
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
                design: {
                  id: item.id,
                  name: item.name,
                  rootComponent: item.tipRootComponentVersion?.name,
                  rootComponentVersionId:
                    item.tipRootComponentVersion?.id,
                },
              });
            }
          }
        }
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
      const query = `{
        hubs(filter: { name: "${hub_name}" }) {
          results {
            name
            projects(filter: { name: "${project_name}" }) {
              results {
                name
                items(filter: { name: "${design_name}" }) {
                  results {
                    ... on DesignItem {
                      name
                      tipRootComponentVersion {
                        id
                        name
                        allOccurrences {
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
      const query = `{
        componentVersion(componentVersionId: "${component_version_id}") {
          id
          name
          physicalProperties {
            mass {
              value
              unit
            }
            volume {
              value
              unit
            }
            density {
              value
              unit
            }
            area {
              value
              unit
            }
            boundingBox {
              length {
                value
                unit
              }
              width {
                value
                unit
              }
              height {
                value
                unit
              }
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
      const query = `{
        componentVersion(componentVersionId: "${component_version_id}") {
          id
          name
          derivatives {
            stepUrl
          }
        }
      }`;

      const data = (await apsGraphQL(MFG_GRAPHQL_URL, query)) as {
        componentVersion: {
          id: string;
          name: string;
          derivatives: {
            stepUrl: string | null;
          };
        };
      };

      const cv = data.componentVersion;
      if (cv.derivatives?.stepUrl) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  component: cv.name,
                  stepUrl: cv.derivatives.stepUrl,
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
                status:
                  "STEP file not yet available. It may need to be generated. Try again shortly.",
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
