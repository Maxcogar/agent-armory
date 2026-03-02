import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiGet, apiPost, errorResult, normalizeProject } from "../client.js";
import { PHASE_NAMES } from "../constants.js";
import { ProjectOutputSchema, ProjectListOutputSchema } from "../schemas.js";
import type { Project } from "../types.js";

function formatProject(p: Project): string {
  return [
    `## ${p.name} (${p.id})`,
    `- **Type**: ${p.project_type}`,
    `- **Phase**: ${p.current_phase} — ${PHASE_NAMES[p.current_phase] ?? "Unknown"}`,
    `- **Idea**: ${p.idea}`,
    p.target_project_path ? `- **Path**: ${p.target_project_path}` : null,
    `- **Created**: ${p.created_at}`,
    `- **Updated**: ${p.updated_at}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function registerProjectTools(server: McpServer): void {
  // ── list_projects ──────────────────────────────────────────────────────────
  server.registerTool(
    "agentboard_list_projects",
    {
      title: "List Projects",
      description: `List all AgentBoard projects.

Returns all projects with their current phase, type, and metadata.

Returns:
  projects: Array of project objects
  count: Total number of projects

Use when: You need to see all available projects or find a project by name/ID.`,
      inputSchema: {},
      outputSchema: ProjectListOutputSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async () => {
      try {
        const projects = await apiGet<Project[]>("/projects");
        const structuredContent = { projects: projects.map(p => normalizeProject(p as unknown as Record<string, unknown>)), count: projects.length };

        if (!projects.length) {
          return {
            content: [{ type: "text", text: "No projects found. Use agentboard_create_project to create one." }],
            structuredContent,
          };
        }
        const text = `# AgentBoard Projects (${projects.length})\n\n${projects.map(formatProject).join("\n\n---\n\n")}`;
        return { content: [{ type: "text", text }], structuredContent };
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  // ── get_project ────────────────────────────────────────────────────────────
  server.registerTool(
    "agentboard_get_project",
    {
      title: "Get Project",
      description: `Get a single AgentBoard project by ID.

Returns full project details including current phase and metadata.

Args:
  - project_id (string): UUID of the project

Returns: Project object with id, name, project_type, current_phase, idea, target_project_path, timestamps.`,
      inputSchema: {
        project_id: z.string().uuid().describe("UUID of the project"),
      },
      outputSchema: ProjectOutputSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ project_id }) => {
      try {
        const project = await apiGet<Project>(`/projects/${project_id}`);
        return {
          content: [{ type: "text", text: formatProject(project) }],
          structuredContent: normalizeProject(project as unknown as Record<string, unknown>),
        };
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  // ── create_project ─────────────────────────────────────────────────────────
  server.registerTool(
    "agentboard_create_project",
    {
      title: "Create Project",
      description: `Create a new AgentBoard project. Auto-creates all 13 phase documents from templates.

Args:
  - name (string): Display name for the project
  - project_type (string): new_feature | refactor | bug_fix | migration | integration
  - idea (string): Brief description of the project goal
  - target_project_path (string, optional): File path to the target codebase

Returns: The created project. Use the returned id for all subsequent operations.
Side effects: Phase documents auto-created. Logs 'project_created' in activity log.`,
      inputSchema: {
        name: z.string().min(1).max(200).describe("Display name for the project"),
        project_type: z
          .enum(["new_feature", "refactor", "bug_fix", "migration", "integration"])
          .describe("Project type"),
        idea: z.string().min(1).describe("Brief description of the project idea or goal"),
        target_project_path: z
          .string()
          .min(1)
          .describe("File system path to the target codebase (required)"),
      },
      outputSchema: ProjectOutputSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ name, project_type, idea, target_project_path }) => {
      try {
        const project = await apiPost<Project>("/projects", {
          name,
          project_type,
          idea,
          target_project_path,
        });
        return {
          content: [{ type: "text", text: `✅ Project created successfully!\n\n${formatProject(project)}` }],
          structuredContent: normalizeProject(project as unknown as Record<string, unknown>),
        };
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  // ── advance_project_phase ──────────────────────────────────────────────────
  server.registerTool(
    "agentboard_advance_project_phase",
    {
      title: "Advance Project Phase",
      description: `Advance a project to its next phase.

IMPORTANT: Phases 2–9 BLOCK advancement unless the required phase document has status 'approved'.
Use agentboard_update_document to set status='approved' on the phase document first.

Phase gate requirements:
  Phase 2 → requires codebase_survey approved
  Phase 3 → requires requirements approved
  Phase 4 → requires constraints approved
  Phase 5 → requires risk_assessment approved
  Phase 6 → requires architecture approved
  Phase 7 → requires contracts approved
  Phase 8 → requires test_strategy approved
  Phase 9 → requires task_breakdown approved

Args:
  - project_id (string): UUID of the project

Returns: Updated project with new current_phase.`,
      inputSchema: {
        project_id: z.string().uuid().describe("UUID of the project to advance"),
      },
      outputSchema: ProjectOutputSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ project_id }) => {
      try {
        const project = await apiPost<Project>(`/projects/${project_id}/advance`);
        return {
          content: [{ type: "text", text: `✅ Phase advanced!\n\n${formatProject(project)}` }],
          structuredContent: normalizeProject(project as unknown as Record<string, unknown>),
        };
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  // ── revert_project_phase ───────────────────────────────────────────────────
  server.registerTool(
    "agentboard_revert_project_phase",
    {
      title: "Revert Project Phase",
      description: `Revert a project to its previous phase.

Args:
  - project_id (string): UUID of the project

Returns: Updated project with decremented current_phase.`,
      inputSchema: {
        project_id: z.string().uuid().describe("UUID of the project to revert"),
      },
      outputSchema: ProjectOutputSchema,
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
    },
    async ({ project_id }) => {
      try {
        const project = await apiPost<Project>(`/projects/${project_id}/revert`);
        return {
          content: [{ type: "text", text: `⏪ Phase reverted.\n\n${formatProject(project)}` }],
          structuredContent: normalizeProject(project as unknown as Record<string, unknown>),
        };
      } catch (err) {
        return errorResult(err);
      }
    }
  );
}