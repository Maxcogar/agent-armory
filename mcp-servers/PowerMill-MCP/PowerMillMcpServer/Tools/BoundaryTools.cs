using System;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading;
using System.Threading.Tasks;
using Autodesk.ProductInterface.PowerMILL;
using PmFile = Autodesk.FileSystem.File;
using PowerMillMcpServer.Mcp;
using PowerMillMcpServer.Util;

namespace PowerMillMcpServer.Tools
{
    public sealed class CreateBoundaryTool : Tool
    {
        private readonly ToolDeps _deps;
        public CreateBoundaryTool(ToolDeps deps) { _deps = deps; }

        public override string Name => "create_boundary";
        public override string Description =>
            "Create a boundary of a specific kind. " +
            "Use to scope a toolpath to a region — by file, block, model silhouette, shallow areas, or empty for manual edit. " +
            "Provide kind (empty | from_file | block | silhouette | shallow), optional name (rename after auto-naming). " +
            "Per kind: from_file requires path; silhouette requires model_name + optional block_expansion_mm/part_border_mm/tolerance_mm; shallow requires tool_name (drives boundary diameter) + upper_angle_deg/lower_angle_deg/tolerance_mm/thickness_mm/axial_thickness_mm/use_axial_thickness. " +
            "Returns kind and name. " +
            "When NOT to use: for boundary kinds outside the supported five (BooleanOperation, CollisionSafe, ContactConversion, ContactPoint, Rest, SelectedSurface, StockModelRest, UserDefined), use run_macro with PowerMill's CREATE BOUNDARY commands.";
        public override JsonObject InputSchema => new JsonObject
        {
            ["type"] = "object",
            ["properties"] = new JsonObject
            {
                ["kind"] = new JsonObject
                {
                    ["type"] = "string",
                    ["enum"] = new JsonArray { "empty", "from_file", "block", "silhouette", "shallow" },
                },
                ["name"] = new JsonObject { ["type"] = "string", ["description"] = "Optional rename after creation. PowerMill assigns a default name otherwise." },
                ["path"] = new JsonObject { ["type"] = "string", ["description"] = "kind=from_file: absolute path to boundary file." },
                ["model_name"] = new JsonObject { ["type"] = "string", ["description"] = "kind=silhouette: model whose silhouette to compute." },
                ["block_expansion_mm"] = new JsonObject { ["type"] = "number", ["default"] = 0, ["description"] = "kind=silhouette: block expansion." },
                ["part_border_mm"] = new JsonObject { ["type"] = "number", ["default"] = 0, ["description"] = "kind=silhouette: distance between boundary and part." },
                ["tolerance_mm"] = new JsonObject { ["type"] = "number", ["default"] = 0.01 },
                ["upper_angle_deg"] = new JsonObject { ["type"] = "number", ["description"] = "kind=shallow: upper angle." },
                ["lower_angle_deg"] = new JsonObject { ["type"] = "number", ["description"] = "kind=shallow: lower angle." },
                ["thickness_mm"] = new JsonObject { ["type"] = "number", ["default"] = 0, ["description"] = "kind=shallow: boundary thickness." },
                ["axial_thickness_mm"] = new JsonObject { ["type"] = "number", ["default"] = 0, ["description"] = "kind=shallow: axial thickness." },
                ["use_axial_thickness"] = new JsonObject { ["type"] = "boolean", ["default"] = false, ["description"] = "kind=shallow." },
                ["tool_name"] = new JsonObject { ["type"] = "string", ["description"] = "kind=shallow: tool whose diameter drives the boundary." },
            },
            ["required"] = new JsonArray { "kind" },
            ["additionalProperties"] = false,
        };
        public override JsonObject Annotations => Schemas.Action(idempotent: false);

        public override async Task<ToolResult> InvokeAsync(JsonElement? args, ProgressReporter progress, CancellationToken ct)
        {
            var kind = GetString(args, "kind");
            if (string.IsNullOrEmpty(kind)) return ToolResult.Error("Missing required parameter: kind");
            var renameTo = GetString(args, "name");

            try
            {
                var newName = await _deps.Session.WithPowerMillAsync(pm =>
                {
                    PMBoundary created;
                    switch (kind)
                    {
                        case "empty":
                            created = pm.ActiveProject.Boundaries.CreateEmptyBoundary();
                            break;
                        case "from_file":
                        {
                            var path = GetString(args, "path");
                            if (string.IsNullOrEmpty(path)) throw new InvalidOperationException("kind=from_file requires path");
                            var safe = SafePath.Resolve(_deps.Roots.AllowedRoots, path!);
                            if (!System.IO.File.Exists(safe)) throw new InvalidOperationException("Boundary file does not exist: " + safe);
                            created = pm.ActiveProject.Boundaries.CreateBoundary(new PmFile(safe));
                            break;
                        }
                        case "block":
                            created = pm.ActiveProject.Boundaries.CreateBlockBoundary();
                            break;
                        case "silhouette":
                        {
                            var modelName = GetString(args, "model_name");
                            if (string.IsNullOrEmpty(modelName)) throw new InvalidOperationException("kind=silhouette requires model_name");
                            var blockExp = GetDouble(args, "block_expansion_mm", 0);
                            var border = GetDouble(args, "part_border_mm", 0);
                            var tol = GetDouble(args, "tolerance_mm", 0.01);
                            created = pm.ActiveProject.Boundaries.CreateSilhouetteBoundary(modelName!, blockExp, border, tol);
                            break;
                        }
                        case "shallow":
                        {
                            var toolName = GetString(args, "tool_name");
                            if (string.IsNullOrEmpty(toolName)) throw new InvalidOperationException("kind=shallow requires tool_name");
                            PMTool? tool = null;
                            foreach (var t in pm.ActiveProject.Tools)
                                if (string.Equals(t.Name, toolName, StringComparison.Ordinal)) { tool = t; break; }
                            if (tool == null) throw new InvalidOperationException("Tool not found: " + toolName);

                            var upper = GetDouble(args, "upper_angle_deg", 30);
                            var lower = GetDouble(args, "lower_angle_deg", 0);
                            var tol = GetDouble(args, "tolerance_mm", 0.01);
                            var thickness = GetDouble(args, "thickness_mm", 0);
                            var axialThickness = GetDouble(args, "axial_thickness_mm", 0);
                            var useAxial = GetBoolStatic(args, "use_axial_thickness", false);
                            created = pm.ActiveProject.Boundaries.CreateShallowBoundary(
                                upper, lower, tol, useAxial, thickness, axialThickness, tool);
                            break;
                        }
                        default:
                            throw new InvalidOperationException("Unknown kind: " + kind);
                    }

                    if (created == null) throw new InvalidOperationException("Boundary creation returned null. The active project state may be incompatible with this kind (e.g. block boundary requires a block to be defined).");

                    if (!string.IsNullOrEmpty(renameTo) && created.Name != renameTo)
                    {
                        try { created.Name = renameTo!; } catch { }
                    }
                    return created.Name ?? "";
                }, ct).ConfigureAwait(false);

                return ToolResult.Json(new JsonObject { ["kind"] = kind, ["name"] = newName });
            }
            catch (InvalidOperationException ex)
            {
                return ToolResult.Error(ex.Message);
            }
        }

        private static double GetDouble(JsonElement? args, string name, double fallback)
        {
            if (args == null || args.Value.ValueKind != JsonValueKind.Object) return fallback;
            if (!args.Value.TryGetProperty(name, out var v)) return fallback;
            return v.ValueKind == JsonValueKind.Number ? v.GetDouble() : fallback;
        }

        private static bool GetBoolStatic(JsonElement? args, string name, bool fallback)
        {
            if (args == null || args.Value.ValueKind != JsonValueKind.Object) return fallback;
            if (!args.Value.TryGetProperty(name, out var v)) return fallback;
            return v.ValueKind == JsonValueKind.True ? true : v.ValueKind == JsonValueKind.False ? false : fallback;
        }
    }

    public sealed class ListBoundariesTool : Tool
    {
        private readonly ToolDeps _deps;
        public ListBoundariesTool(ToolDeps deps) { _deps = deps; }
        public override string Name => "list_boundaries";
        public override string Description =>
            "List all boundaries in the active project. " +
            "Use to discover boundaries before referencing them in toolpaths. " +
            "No parameters. " +
            "Returns count and an array of {name, type}. " +
            "When NOT to use: use create_boundary or run_macro for boundary kinds outside the supported five.";
        public override JsonObject InputSchema => Schemas.Empty();
        public override JsonObject Annotations => Schemas.ReadOnly("List Boundaries");
        public override async Task<ToolResult> InvokeAsync(JsonElement? args, ProgressReporter progress, CancellationToken ct)
        {
            var result = await _deps.Session.WithPowerMillAsync(pm =>
            {
                var arr = new JsonArray();
                foreach (var b in pm.ActiveProject.Boundaries)
                {
                    arr.Add(new JsonObject
                    {
                        ["name"] = SafeStr(() => b.Name),
                        ["type"] = b.GetType().Name.Replace("PMBoundary", ""),
                    });
                }
                return new JsonObject { ["count"] = arr.Count, ["boundaries"] = arr };
            }, ct).ConfigureAwait(false);
            return ToolResult.Json(result);
        }
        private static string SafeStr(Func<string> f) { try { return f() ?? ""; } catch { return ""; } }
    }
}
