using System;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading;
using System.Threading.Tasks;
using Autodesk;
using Autodesk.Geometry;
using PmFile = Autodesk.FileSystem.File;
using PowerMillMcpServer.Mcp;
using PowerMillMcpServer.Util;

namespace PowerMillMcpServer.Tools
{
    public sealed class ImportModelTool : Tool
    {
        private readonly ToolDeps _deps;
        public ImportModelTool(ToolDeps deps) { _deps = deps; }

        public override string Name => "import_model";
        public override string Description =>
            "Import a CAD model file (DMT, STL, IGES, STEP — anything PowerMill recognizes) into the active project. " +
            "Use this as the first step after opening a fresh project. " +
            "Provide path (absolute, must be inside an allowed root) and optional as_reference (default false; true keeps the file external rather than copied into the project). " +
            "Returns imported:<path>, model_count, last_model_name. " +
            "When NOT to use: a model already in the project — use list (via run_macro 'PRINT MODELS') to see existing.";
        public override JsonObject InputSchema => new JsonObject
        {
            ["type"] = "object",
            ["properties"] = new JsonObject
            {
                ["path"] = new JsonObject { ["type"] = "string", ["description"] = "Absolute path to the model file." },
                ["as_reference"] = new JsonObject { ["type"] = "boolean", ["default"] = false, ["description"] = "Import as a reference model (not copied into project)." },
            },
            ["required"] = new JsonArray { "path" },
            ["additionalProperties"] = false,
        };
        public override JsonObject Annotations => Schemas.Action(idempotent: false);

        public override async Task<ToolResult> InvokeAsync(JsonElement? args, ProgressReporter progress, CancellationToken ct)
        {
            var path = GetString(args, "path");
            if (string.IsNullOrEmpty(path)) return ToolResult.Error("Missing required parameter: path");
            string safe;
            try { safe = SafePath.Resolve(_deps.Roots.AllowedRoots, path!); }
            catch (Exception ex) { return ToolResult.Error(ex.Message); }
            if (!System.IO.File.Exists(safe)) return ToolResult.Error("Model file does not exist: " + safe);
            var asRef = GetBool(args, "as_reference", false);

            var result = await _deps.Session.WithPowerMillAsync(pm =>
            {
                var f = new PmFile(safe);
                var model = asRef ? pm.ActiveProject.Models.CreateReferenceModel(f) : pm.ActiveProject.Models.CreateModel(f);
                return new JsonObject
                {
                    ["imported"] = safe,
                    ["as_reference"] = asRef,
                    ["model_count"] = pm.ActiveProject.Models?.Count ?? 0,
                    ["last_model_name"] = SafeStr(() => model?.Name ?? ""),
                };
            }, ct).ConfigureAwait(false);
            return ToolResult.Json(result);
        }

        private static string SafeStr(Func<string> f) { try { return f() ?? ""; } catch { return ""; } }
    }

    public sealed class CreateBlockTool : Tool
    {
        private readonly ToolDeps _deps;
        public CreateBlockTool(ToolDeps deps) { _deps = deps; }

        public override string Name => "create_block";
        public override string Description =>
            "Define the stock block for the project. " +
            "Use after import_model and before any toolpath calculation that needs to know stock extents. " +
            "Three modes via kind: from_file (provide path to DMT/STL), around_model (provide model_name + optional expansion_mm), cylinder (provide origin {x,y,z}, outer_diameter_mm, length_mm, optional inner_diameter_mm for tubular stock). " +
            "Returns the kind and the parameters used. " +
            "When NOT to use: use delete_block to remove an existing block before redefining.";
        public override JsonObject InputSchema => new JsonObject
        {
            ["type"] = "object",
            ["properties"] = new JsonObject
            {
                ["kind"] = new JsonObject
                {
                    ["type"] = "string",
                    ["enum"] = new JsonArray { "from_file", "around_model", "cylinder" },
                },
                ["path"] = new JsonObject { ["type"] = "string", ["description"] = "kind=from_file: absolute path to block file." },
                ["model_name"] = new JsonObject { ["type"] = "string", ["description"] = "kind=around_model: name of the model to wrap." },
                ["expansion_mm"] = new JsonObject { ["type"] = "number", ["default"] = 0, ["description"] = "kind=around_model: outward expansion in mm." },
                ["origin"] = new JsonObject
                {
                    ["type"] = "object",
                    ["properties"] = new JsonObject
                    {
                        ["x"] = new JsonObject { ["type"] = "number" },
                        ["y"] = new JsonObject { ["type"] = "number" },
                        ["z"] = new JsonObject { ["type"] = "number" },
                    },
                    ["description"] = "kind=cylinder: cylinder origin point.",
                },
                ["outer_diameter_mm"] = new JsonObject { ["type"] = "number", ["description"] = "kind=cylinder: outer diameter." },
                ["inner_diameter_mm"] = new JsonObject { ["type"] = "number", ["default"] = 0, ["description"] = "kind=cylinder: inner diameter (for tubular stock)." },
                ["length_mm"] = new JsonObject { ["type"] = "number", ["description"] = "kind=cylinder: length." },
            },
            ["required"] = new JsonArray { "kind" },
            ["additionalProperties"] = false,
        };
        public override JsonObject Annotations => Schemas.Action(idempotent: false);

        public override async Task<ToolResult> InvokeAsync(JsonElement? args, ProgressReporter progress, CancellationToken ct)
        {
            var kind = GetString(args, "kind");
            if (string.IsNullOrEmpty(kind)) return ToolResult.Error("Missing required parameter: kind");

            switch (kind)
            {
                case "from_file":
                {
                    var path = GetString(args, "path");
                    if (string.IsNullOrEmpty(path)) return ToolResult.Error("kind=from_file requires path");
                    string safe;
                    try { safe = SafePath.Resolve(_deps.Roots.AllowedRoots, path!); }
                    catch (Exception ex) { return ToolResult.Error(ex.Message); }
                    if (!System.IO.File.Exists(safe)) return ToolResult.Error("Block file does not exist: " + safe);
                    await _deps.Session.WithPowerMillAsync(pm => { pm.ActiveProject.CreateBlock(new PmFile(safe)); }, ct).ConfigureAwait(false);
                    return ToolResult.Json(new JsonObject { ["kind"] = "from_file", ["source"] = safe });
                }
                case "around_model":
                {
                    var modelName = GetString(args, "model_name");
                    if (string.IsNullOrEmpty(modelName)) return ToolResult.Error("kind=around_model requires model_name");
                    var expansion = GetDouble(args, "expansion_mm", 0);
                    await _deps.Session.WithPowerMillAsync(pm => { pm.ActiveProject.CreateBlock(modelName!, (MM)expansion); }, ct).ConfigureAwait(false);
                    return ToolResult.Json(new JsonObject { ["kind"] = "around_model", ["model"] = modelName, ["expansion_mm"] = expansion });
                }
                case "cylinder":
                {
                    (double x, double y, double z)? origin;
                    try { origin = GetVec3(args, "origin"); }
                    catch (System.ArgumentException ex) { return ToolResult.Error(ex.Message); }
                    if (origin == null) return ToolResult.Error("kind=cylinder requires origin {x,y,z}");
                    var od = GetDoubleOpt(args, "outer_diameter_mm");
                    if (od == null) return ToolResult.Error("kind=cylinder requires outer_diameter_mm");
                    var len = GetDoubleOpt(args, "length_mm");
                    if (len == null) return ToolResult.Error("kind=cylinder requires length_mm");
                    var id = GetDouble(args, "inner_diameter_mm", 0);
                    await _deps.Session.WithPowerMillAsync(pm =>
                    {
                        pm.ActiveProject.CreateCylinderBlock(
                            new Point(origin.Value.x, origin.Value.y, origin.Value.z),
                            (MM)od.Value, (MM)id, (MM)len.Value);
                    }, ct).ConfigureAwait(false);
                    return ToolResult.Json(new JsonObject
                    {
                        ["kind"] = "cylinder",
                        ["outer_diameter_mm"] = od,
                        ["inner_diameter_mm"] = id,
                        ["length_mm"] = len,
                    });
                }
                default:
                    return ToolResult.Error("Unknown kind: " + kind);
            }
        }

        private static double GetDouble(JsonElement? args, string name, double fallback)
        {
            if (args == null || args.Value.ValueKind != JsonValueKind.Object) return fallback;
            if (!args.Value.TryGetProperty(name, out var v)) return fallback;
            return v.ValueKind == JsonValueKind.Number ? v.GetDouble() : fallback;
        }

        private static double? GetDoubleOpt(JsonElement? args, string name)
        {
            if (args == null || args.Value.ValueKind != JsonValueKind.Object) return null;
            if (!args.Value.TryGetProperty(name, out var v)) return null;
            return v.ValueKind == JsonValueKind.Number ? v.GetDouble() : (double?)null;
        }

        // Returns null when the field is missing entirely; throws when the field
        // exists but any of x, y, z is missing or non-numeric — silently
        // defaulting to 0 hides bad input.
        private static (double x, double y, double z)? GetVec3(JsonElement? args, string name)
        {
            if (args == null || args.Value.ValueKind != JsonValueKind.Object) return null;
            if (!args.Value.TryGetProperty(name, out var v) || v.ValueKind != JsonValueKind.Object) return null;
            return Vec3Reader.Read(v, name);
        }
    }

    internal static class Vec3Reader
    {
        public static (double x, double y, double z) Read(JsonElement v, string fieldLabel)
        {
            var missing = new System.Collections.Generic.List<string>();
            double? x = null, y = null, z = null;
            if (v.TryGetProperty("x", out var xe) && xe.ValueKind == JsonValueKind.Number) x = xe.GetDouble(); else missing.Add("x");
            if (v.TryGetProperty("y", out var ye) && ye.ValueKind == JsonValueKind.Number) y = ye.GetDouble(); else missing.Add("y");
            if (v.TryGetProperty("z", out var ze) && ze.ValueKind == JsonValueKind.Number) z = ze.GetDouble(); else missing.Add("z");
            if (missing.Count > 0)
                throw new System.ArgumentException(fieldLabel + " must include numeric x, y, z; missing or non-numeric: " + string.Join(", ", missing));
            return (x!.Value, y!.Value, z!.Value);
        }
    }

    public sealed class DeleteBlockTool : Tool
    {
        private readonly ToolDeps _deps;
        public DeleteBlockTool(ToolDeps deps) { _deps = deps; }
        public override string Name => "delete_block";
        public override string Description =>
            "Delete the stock block from the active project. " +
            "Use to clear stock definition before redefining. " +
            "No parameters. " +
            "Returns deleted:true. Idempotent — safe to call when no block exists. " +
            "When NOT to use: use create_block to define a new block (you don't need to delete first; create overwrites).";
        public override JsonObject InputSchema => Schemas.Empty();
        public override JsonObject Annotations => Schemas.Action(destructive: true, idempotent: true);
        public override async Task<ToolResult> InvokeAsync(JsonElement? args, ProgressReporter progress, CancellationToken ct)
        {
            await _deps.Session.WithPowerMillAsync(pm => { pm.ActiveProject.DeleteBlock(); }, ct).ConfigureAwait(false);
            return ToolResult.Json(new JsonObject { ["deleted"] = true });
        }
    }

    public sealed class CreateWorkplaneTool : Tool
    {
        private readonly ToolDeps _deps;
        public CreateWorkplaneTool(ToolDeps deps) { _deps = deps; }
        public override string Name => "create_workplane";
        public override string Description =>
            "Create a workplane to define a non-world coordinate frame for toolpaths. " +
            "Use when toolpath origin or orientation needs to be different from world. " +
            "Provide name plus three vec3 objects: origin {x,y,z}, x_axis {x,y,z}, y_axis {x,y,z}. Z axis is computed (X cross Y) by the API. " +
            "Returns the assigned name (PowerMill may rename to avoid conflicts). " +
            "When NOT to use: if your work fits the world frame, skip this. To set the OUTPUT frame for an NC program, use configure_nc_program output_workplane instead.";
        public override JsonObject InputSchema => new JsonObject
        {
            ["type"] = "object",
            ["properties"] = new JsonObject
            {
                ["name"] = new JsonObject { ["type"] = "string" },
                ["origin"] = new JsonObject
                {
                    ["type"] = "object",
                    ["properties"] = new JsonObject
                    {
                        ["x"] = new JsonObject { ["type"] = "number" },
                        ["y"] = new JsonObject { ["type"] = "number" },
                        ["z"] = new JsonObject { ["type"] = "number" },
                    },
                },
                ["x_axis"] = new JsonObject { ["type"] = "object", ["properties"] = new JsonObject { ["x"] = new JsonObject { ["type"] = "number" }, ["y"] = new JsonObject { ["type"] = "number" }, ["z"] = new JsonObject { ["type"] = "number" } } },
                ["y_axis"] = new JsonObject { ["type"] = "object", ["properties"] = new JsonObject { ["x"] = new JsonObject { ["type"] = "number" }, ["y"] = new JsonObject { ["type"] = "number" }, ["z"] = new JsonObject { ["type"] = "number" } } },
            },
            ["required"] = new JsonArray { "name", "origin", "x_axis", "y_axis" },
            ["additionalProperties"] = false,
        };
        public override JsonObject Annotations => Schemas.Action(idempotent: false);
        public override async Task<ToolResult> InvokeAsync(JsonElement? args, ProgressReporter progress, CancellationToken ct)
        {
            var name = GetString(args, "name");
            if (string.IsNullOrEmpty(name)) return ToolResult.Error("Missing required parameter: name");
            (double x, double y, double z)? origin, xAxis, yAxis;
            try
            {
                origin = ReadVec3(args, "origin");
                xAxis = ReadVec3(args, "x_axis");
                yAxis = ReadVec3(args, "y_axis");
            }
            catch (System.ArgumentException ex) { return ToolResult.Error(ex.Message); }
            if (origin == null || xAxis == null || yAxis == null)
                return ToolResult.Error("origin, x_axis, and y_axis must each be {x, y, z} numeric objects");

            var newName = await _deps.Session.WithPowerMillAsync(pm =>
            {
                var wp = new Workplane(
                    new Point(origin.Value.x, origin.Value.y, origin.Value.z),
                    new Vector(xAxis.Value.x, xAxis.Value.y, xAxis.Value.z),
                    new Vector(yAxis.Value.x, yAxis.Value.y, yAxis.Value.z));
                var created = pm.ActiveProject.Workplanes.CreateWorkplane(wp);
                // Rename to the requested name if the API auto-named it.
                try { if (created != null && created.Name != name) created.Name = name; } catch { }
                return created?.Name ?? "";
            }, ct).ConfigureAwait(false);

            return ToolResult.Json(new JsonObject { ["name"] = newName });
        }

        // Returns null when the field is missing; throws when present but malformed.
        private static (double x, double y, double z)? ReadVec3(JsonElement? args, string field)
        {
            if (args == null || args.Value.ValueKind != JsonValueKind.Object) return null;
            if (!args.Value.TryGetProperty(field, out var v) || v.ValueKind != JsonValueKind.Object) return null;
            return Vec3Reader.Read(v, field);
        }
    }

    public sealed class SetUnitsTool : Tool
    {
        private readonly ToolDeps _deps;
        public SetUnitsTool(ToolDeps deps) { _deps = deps; }
        public override string Name => "set_units";
        public override string Description =>
            "Set the active project's length units to mm or inches. " +
            "Use once at project setup if the default doesn't match your shop convention. " +
            "Provide units: 'mm' or 'inches'. " +
            "Returns the units that were applied. " +
            "When NOT to use: tool diameters and lengths in the API still use MM internally — units only change display in the GUI and post-output formatting.";
        public override JsonObject InputSchema => new JsonObject
        {
            ["type"] = "object",
            ["properties"] = new JsonObject
            {
                ["units"] = new JsonObject
                {
                    ["type"] = "string",
                    ["enum"] = new JsonArray { "mm", "inches" },
                },
            },
            ["required"] = new JsonArray { "units" },
            ["additionalProperties"] = false,
        };
        public override JsonObject Annotations => Schemas.Action(idempotent: true);
        public override async Task<ToolResult> InvokeAsync(JsonElement? args, ProgressReporter progress, CancellationToken ct)
        {
            var units = GetString(args, "units");
            if (units != "mm" && units != "inches") return ToolResult.Error("units must be 'mm' or 'inches'");

            await _deps.Session.WithPowerMillAsync(pm =>
            {
                pm.Units = units == "mm" ? LengthUnits.MM : LengthUnits.Inches;
            }, ct).ConfigureAwait(false);
            return ToolResult.Json(new JsonObject { ["units"] = units });
        }
    }
}
