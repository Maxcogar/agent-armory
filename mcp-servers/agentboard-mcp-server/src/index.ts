#!/usr/bin/env node
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { BASE_URL } from "./constants.js";
import { apiGet } from "./client.js";
import { registerProjectTools } from "./tools/projects.js";
import { registerTaskTools } from "./tools/tasks.js";
import { registerDocumentTools } from "./tools/documents.js";
import { registerActivityTools } from "./tools/activity.js";
import type { Project, Task, Document, ActivityEntry } from "./types.js";

// ── Server init ──────────────────────────────────────────────────────────────
const server = new McpServer({
  name: "agentboard-mcp-server",
  version: "1.0.0",
});

// ── Register all tools ───────────────────────────────────────────────────────
registerProjectTools(server);
registerTaskTools(server);
registerDocumentTools(server);
registerActivityTools(server);

// ── Resources ────────────────────────────────────────────────────────────────
// Note: GET /tasks/:id does not exist in the AgentBoard API — no task resource by ID.
// Use agentboard_list_tasks or agentboard_get_next_task to access tasks.

server.registerResource(
  "agentboard-projects",
  "agentboard://projects",
  { title: "All Projects", description: "List of all AgentBoard projects", mimeType: "application/json" },
  async (uri) => {
    try {
      const projects = await apiGet<Project[]>("/projects");
      return {
        contents: [{
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(projects, null, 2),
        }],
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        contents: [{
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify({ error: msg }),
        }],
      };
    }
  }
);

server.registerResource(
  "agentboard-project",
  new ResourceTemplate("agentboard://projects/{projectId}", { list: undefined }),
  { title: "Project", description: "Single AgentBoard project by ID", mimeType: "application/json" },
  async (uri, { projectId }) => {
    try {
      const project = await apiGet<Project>(`/projects/${projectId}`);
      return {
        contents: [{
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(project, null, 2),
        }],
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        contents: [{
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify({ error: msg }),
        }],
      };
    }
  }
);

server.registerResource(
  "agentboard-project-tasks",
  new ResourceTemplate("agentboard://projects/{projectId}/tasks", { list: undefined }),
  { title: "Project Tasks", description: "All tasks for a project", mimeType: "application/json" },
  async (uri, { projectId }) => {
    try {
      const tasks = await apiGet<Task[]>(`/projects/${projectId}/tasks`);
      return {
        contents: [{
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(tasks, null, 2),
        }],
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        contents: [{
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify({ error: msg }),
        }],
      };
    }
  }
);

server.registerResource(
  "agentboard-project-documents",
  new ResourceTemplate("agentboard://projects/{projectId}/documents", { list: undefined }),
  { title: "Project Documents", description: "All phase documents for a project", mimeType: "application/json" },
  async (uri, { projectId }) => {
    try {
      const docs = await apiGet<Document[]>(`/projects/${projectId}/documents`);
      return {
        contents: [{
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(docs, null, 2),
        }],
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        contents: [{
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify({ error: msg }),
        }],
      };
    }
  }
);

server.registerResource(
  "agentboard-project-log",
  new ResourceTemplate("agentboard://projects/{projectId}/log", { list: undefined }),
  { title: "Project Activity Log", description: "Activity log for a project", mimeType: "application/json" },
  async (uri, { projectId }) => {
    try {
      const entries = await apiGet<ActivityEntry[]>(`/projects/${projectId}/log`);
      return {
        contents: [{
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(entries, null, 2),
        }],
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        contents: [{
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify({ error: msg }),
        }],
      };
    }
  }
);

server.registerResource(
  "agentboard-document",
  new ResourceTemplate("agentboard://documents/{documentId}", { list: undefined }),
  { title: "Document", description: "Single phase document by ID — returns full Markdown content", mimeType: "text/markdown" },
  async (uri, { documentId }) => {
    try {
      const doc = await apiGet<Document>(`/documents/${documentId}`);
      return {
        contents: [{
          uri: uri.href,
          mimeType: "text/markdown",
          text: doc.content,
        }],
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        contents: [{
          uri: uri.href,
          mimeType: "text/markdown",
          text: `Error fetching document: ${msg}`,
        }],
      };
    }
  }
);

// ── Prompts ──────────────────────────────────────────────────────────────────

server.registerPrompt(
  "start_project",
  {
    title: "Start a New Project",
    description: "Guide through creating an AgentBoard project and seeding the initial phase",
    argsSchema: {
      project_name: z.string().describe("Name of the project"),
      project_type: z.enum(["new_feature", "refactor", "bug_fix", "migration", "integration"]).describe("Project type"),
      idea: z.string().describe("Brief description of what you want to build or fix"),
    },
  },
  ({ project_name, project_type, idea }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `I want to start a new AgentBoard project.

Project Name: ${project_name}
Project Type: ${project_type}
Idea: ${idea}

Please:
1. Use agentboard_create_project to create the project
2. List the phase documents created with agentboard_list_documents
3. Explain what Phase 1 (Initialization) involves and what I should do next`,
        },
      },
    ],
  })
);

server.registerPrompt(
  "work_next_task",
  {
    title: "Work on Next Task",
    description: "Fetch and begin work on the highest-priority available task",
    argsSchema: {
      project_id: z.string().uuid().describe("UUID of the project"),
    },
  },
  ({ project_id }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Project ID: ${project_id}

Please:
1. Use agentboard_get_next_task to find the highest-priority unblocked task
2. Review its acceptance_criteria and description
3. Transition it to 'in-progress' using agentboard_update_task (make sure assignee is set)
4. Begin working on it and report your plan`,
        },
      },
    ],
  })
);

server.registerPrompt(
  "complete_task",
  {
    title: "Complete a Task",
    description: "Add completion notes and transition a task to 'done'",
    argsSchema: {
      task_id: z.string().uuid().describe("UUID of the task to complete"),
      summary: z.string().describe("Summary of what was done and how acceptance criteria were met"),
    },
  },
  ({ task_id, summary }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Task ID: ${task_id}
Completion Summary: ${summary}

Please:
1. Add a note to the task using agentboard_update_task with the summary
2. Transition the task to 'review' status
3. Once reviewed, transition to 'done'
4. Log the completion with agentboard_add_log_entry`,
        },
      },
    ],
  })
);

server.registerPrompt(
  "advance_phase",
  {
    title: "Advance Project Phase",
    description: "Approve the current phase document and advance to the next phase",
    argsSchema: {
      project_id: z.string().uuid().describe("UUID of the project"),
    },
  },
  ({ project_id }) => ({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Project ID: ${project_id}

Please:
1. Use agentboard_get_project to check the current phase
2. Use agentboard_list_documents to find the document for this phase
3. Use agentboard_get_document to review the document content
4. If the document looks complete and accurate, use agentboard_update_document to set status to 'approved'
5. Use agentboard_advance_project_phase to advance to the next phase
6. Report what phase we are now in and what the next steps are`,
        },
      },
    ],
  })
);

// ── Start server ─────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`AgentBoard MCP server running (connected to ${BASE_URL})`);
}

main().catch((err: unknown) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
