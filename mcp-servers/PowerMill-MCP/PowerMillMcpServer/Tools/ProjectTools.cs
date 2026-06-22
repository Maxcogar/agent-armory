using System;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading;
using System.Threading.Tasks;
using PmDirectory = Autodesk.FileSystem.Directory;
using PmFile = Autodesk.FileSystem.File;
using IoDirectory = System.IO.Directory;
using PowerMillMcpServer.Mcp;
using PowerMillMcpServer.Util;

namespace PowerMillMcpServer.Tools
{
    public sealed class OpenProjectTool : Tool
    {
        private readonly ToolDeps _deps;
        public OpenProjectTool(ToolDeps deps) { _deps = deps; }

        public override string Name => "open_project";
        public override string Description =>
            "Open a PowerMill project from a directory path. " +
            "Use to load an existing project for inspection or modification. " +
            "Provide path (absolute, must be inside an allowed root from POWERMILL_PROJECT_ROOTS or host-advertised roots) and optional read_only. " +
            "Returns counts of models/toolpaths/tools/nc_programs/boundaries/patterns/workplanes/setups/stock_models/machine_tools. " +
            "When NOT to use: use new_project to start fresh, save_project_as to clone to a new location, import_project to merge into the active project.";
        public override JsonObject InputSchema => new JsonObject
        {
            ["type"] = "object",
            ["properties"] = new JsonObject
            {
                ["path"] = new JsonObject
                {
                    ["type"] = "string",
                    ["description"] = "Absolute path to the PowerMill project directory.",
                },
                ["read_only"] = new JsonObject
                {
                    ["type"] = "boolean",
                    ["description"] = "Open in read-only mode. Default false.",
                    ["default"] = false,
                },
            },
            ["required"] = new JsonArray { "path" },
            ["additionalProperties"] = false,
        };
        public override JsonObject Annotations => new JsonObject
        {
            ["title"] = "Open PowerMill Project",
            ["readOnlyHint"] = false,
            ["destructiveHint"] = false,
            ["idempotentHint"] = false,
            ["openWorldHint"] = true,
        };

        public override async Task<ToolResult> InvokeAsync(JsonElement? args, ProgressReporter progress, CancellationToken ct)
        {
            var path = GetString(args, "path");
            if (string.IsNullOrEmpty(path)) return ToolResult.Error("Missing required parameter: path");

            string safePath;
            try { safePath = SafePath.Resolve(_deps.Roots.AllowedRoots, path!); }
            catch (Exception ex) { return ToolResult.Error(ex.Message); }

            if (!IoDirectory.Exists(safePath)) return ToolResult.Error("Project directory does not exist: " + safePath);
            var readOnly = GetBool(args, "read_only", false);

            var summary = await _deps.Session.WithPowerMillAsync(pm =>
            {
                var dir = new PmDirectory(safePath);
                var project = pm.LoadProject(dir, readOnly);
                return new JsonObject
                {
                    ["loaded"] = true,
                    ["path"] = safePath,
                    ["read_only"] = readOnly,
                    ["counts"] = new JsonObject
                    {
                        ["models"] = project.Models?.Count ?? 0,
                        ["toolpaths"] = project.Toolpaths?.Count ?? 0,
                        ["tools"] = project.Tools?.Count ?? 0,
                        ["nc_programs"] = project.NCPrograms?.Count ?? 0,
                        ["boundaries"] = project.Boundaries?.Count ?? 0,
                        ["patterns"] = project.Patterns?.Count ?? 0,
                        ["workplanes"] = project.Workplanes?.Count ?? 0,
                        ["setups"] = project.Setups?.Count ?? 0,
                        ["stock_models"] = project.StockModels?.Count ?? 0,
                        ["machine_tools"] = project.MachineTools?.Count ?? 0,
                    },
                };
            }, ct).ConfigureAwait(false);

            return ToolResult.Json(summary);
        }
    }

    public sealed class NewProjectTool : Tool
    {
        private readonly ToolDeps _deps;
        public NewProjectTool(ToolDeps deps) { _deps = deps; }
        public override string Name => "new_project";
        public override string Description =>
            "Reset PowerMill to an empty project state. " +
            "Use to start a fresh project. " +
            "No parameters. " +
            "Returns reset:true. " +
            "When NOT to use: this DISCARDS UNSAVED CHANGES — call save_project or save_project_as first if there's work to keep.";
        public override JsonObject InputSchema => Schemas.Empty();
        public override JsonObject Annotations => Schemas.Action(idempotent: true, destructive: true);
        public override async Task<ToolResult> InvokeAsync(JsonElement? args, ProgressReporter progress, CancellationToken ct)
        {
            await _deps.Session.WithPowerMillAsync(pm => { pm.Reset(); }, ct).ConfigureAwait(false);
            return ToolResult.Json(new JsonObject { ["reset"] = true });
        }
    }

    public sealed class SaveProjectTool : Tool
    {
        private readonly ToolDeps _deps;
        public SaveProjectTool(ToolDeps deps) { _deps = deps; }
        public override string Name => "save_project";
        public override string Description =>
            "Save the active project to its existing location. " +
            "Use after making changes you want to persist. " +
            "No parameters — the path comes from the prior open or save_as. " +
            "Returns saved:true. " +
            "When NOT to use: a project that has never been saved — use save_project_as first to set a path.";
        public override JsonObject InputSchema => Schemas.Empty();
        public override JsonObject Annotations => Schemas.Action(idempotent: true);
        public override async Task<ToolResult> InvokeAsync(JsonElement? args, ProgressReporter progress, CancellationToken ct)
        {
            await _deps.Session.WithPowerMillAsync(pm => { pm.ActiveProject.Save(); }, ct).ConfigureAwait(false);
            return ToolResult.Json(new JsonObject { ["saved"] = true });
        }
    }

    public sealed class SaveProjectAsTool : Tool
    {
        private readonly ToolDeps _deps;
        public SaveProjectAsTool(ToolDeps deps) { _deps = deps; }
        public override string Name => "save_project_as";
        public override string Description =>
            "Save the active project to a new directory (clone or first save). " +
            "Use for the initial save of a fresh project, or to fork a copy. " +
            "Provide path (absolute, must be inside an allowed root). " +
            "Returns saved_as:<path>. " +
            "When NOT to use: use save_project for subsequent saves to the same location.";
        public override JsonObject InputSchema => new JsonObject
        {
            ["type"] = "object",
            ["properties"] = new JsonObject
            {
                ["path"] = new JsonObject { ["type"] = "string", ["description"] = "Target project directory." },
            },
            ["required"] = new JsonArray { "path" },
            ["additionalProperties"] = false,
        };
        public override JsonObject Annotations => Schemas.Action(idempotent: false);
        public override async Task<ToolResult> InvokeAsync(JsonElement? args, ProgressReporter progress, CancellationToken ct)
        {
            var path = GetString(args, "path");
            if (string.IsNullOrEmpty(path)) return ToolResult.Error("Missing required parameter: path");
            string safePath;
            try { safePath = SafePath.Resolve(_deps.Roots.AllowedRoots, path!); }
            catch (Exception ex) { return ToolResult.Error(ex.Message); }

            await _deps.Session.WithPowerMillAsync(pm =>
            {
                pm.ActiveProject.SaveAs(new PmDirectory(safePath));
            }, ct).ConfigureAwait(false);
            return ToolResult.Json(new JsonObject { ["saved_as"] = safePath });
        }
    }

    public sealed class CloseProjectTool : Tool
    {
        private readonly ToolDeps _deps;
        public CloseProjectTool(ToolDeps deps) { _deps = deps; }
        public override string Name => "close_project";
        public override string Description =>
            "Close the active project. " +
            "Use to clean up before opening or creating a different project. " +
            "No parameters. " +
            "Returns closed:true. The PowerMill instance stays running and ready for new_project / open_project. " +
            "When NOT to use: this DISCARDS UNSAVED CHANGES — call save_project first if needed.";
        public override JsonObject InputSchema => Schemas.Empty();
        public override JsonObject Annotations => Schemas.Action(idempotent: true, destructive: true);
        public override async Task<ToolResult> InvokeAsync(JsonElement? args, ProgressReporter progress, CancellationToken ct)
        {
            await _deps.Session.WithPowerMillAsync(pm => { pm.CloseProject(); }, ct).ConfigureAwait(false);
            return ToolResult.Json(new JsonObject { ["closed"] = true });
        }
    }

    public sealed class ImportProjectTool : Tool
    {
        private readonly ToolDeps _deps;
        public ImportProjectTool(ToolDeps deps) { _deps = deps; }
        public override string Name => "import_project";
        public override string Description =>
            "Merge another project's contents into the active project. " +
            "Use to combine work from multiple projects, or pull in shared toolpaths/tools. " +
            "Provide path (absolute project directory, must be inside an allowed root). " +
            "Returns imported:<path>. " +
            "When NOT to use: use open_project to REPLACE the active project instead of merging.";
        public override JsonObject InputSchema => new JsonObject
        {
            ["type"] = "object",
            ["properties"] = new JsonObject
            {
                ["path"] = new JsonObject { ["type"] = "string", ["description"] = "Absolute path to the project directory to import." },
            },
            ["required"] = new JsonArray { "path" },
            ["additionalProperties"] = false,
        };
        public override JsonObject Annotations => Schemas.Action(idempotent: false);
        public override async Task<ToolResult> InvokeAsync(JsonElement? args, ProgressReporter progress, CancellationToken ct)
        {
            var path = GetString(args, "path");
            if (string.IsNullOrEmpty(path)) return ToolResult.Error("Missing required parameter: path");
            string safePath;
            try { safePath = SafePath.Resolve(_deps.Roots.AllowedRoots, path!); }
            catch (Exception ex) { return ToolResult.Error(ex.Message); }
            if (!IoDirectory.Exists(safePath)) return ToolResult.Error("Source project directory does not exist: " + safePath);

            await _deps.Session.WithPowerMillAsync(pm =>
            {
                pm.ActiveProject.ImportProject(new PmDirectory(safePath));
            }, ct).ConfigureAwait(false);
            return ToolResult.Json(new JsonObject { ["imported"] = safePath });
        }
    }

    public sealed class ImportTemplateTool : Tool
    {
        private readonly ToolDeps _deps;
        public ImportTemplateTool(ToolDeps deps) { _deps = deps; }
        public override string Name => "import_template";
        public override string Description =>
            "Apply a PowerMill template file (.ptf) to the active project. " +
            "Templates can contain toolpaths, NC programs, tools, boundaries — they're how shops standardize CAM setups. " +
            "Provide path (absolute, must be inside an allowed root). " +
            "Returns imported_template:<path>. " +
            "When NOT to use: use create_toolpath_from_template specifically for toolpath-only templates if you need to know which toolpath was created.";
        public override JsonObject InputSchema => new JsonObject
        {
            ["type"] = "object",
            ["properties"] = new JsonObject
            {
                ["path"] = new JsonObject { ["type"] = "string", ["description"] = "Absolute path to the template file." },
            },
            ["required"] = new JsonArray { "path" },
            ["additionalProperties"] = false,
        };
        public override JsonObject Annotations => Schemas.Action(idempotent: false);
        public override async Task<ToolResult> InvokeAsync(JsonElement? args, ProgressReporter progress, CancellationToken ct)
        {
            var path = GetString(args, "path");
            if (string.IsNullOrEmpty(path)) return ToolResult.Error("Missing required parameter: path");
            string safePath;
            try { safePath = SafePath.Resolve(_deps.Roots.AllowedRoots, path!); }
            catch (Exception ex) { return ToolResult.Error(ex.Message); }
            if (!System.IO.File.Exists(safePath)) return ToolResult.Error("Template file does not exist: " + safePath);

            await _deps.Session.WithPowerMillAsync(pm =>
            {
                pm.ActiveProject.ImportTemplateFile(new PmFile(safePath));
            }, ct).ConfigureAwait(false);
            return ToolResult.Json(new JsonObject { ["imported_template"] = safePath });
        }
    }
}
