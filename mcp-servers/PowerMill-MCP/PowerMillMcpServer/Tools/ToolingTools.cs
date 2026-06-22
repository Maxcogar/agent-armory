using System;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading;
using System.Threading.Tasks;
using Autodesk.Geometry;
using Autodesk.ProductInterface.PowerMILL;
using PowerMillMcpServer.Mcp;

namespace PowerMillMcpServer.Tools
{
    public sealed class CreateToolTool : Tool
    {
        private readonly ToolDeps _deps;
        public CreateToolTool(ToolDeps deps) { _deps = deps; }

        public override string Name => "create_tool";
        public override string Description =>
            "Create a milling tool of a typed factory class. " +
            "Use to add a new tool to the project's tool library. " +
            "Provide tool_type (one of: ball_nosed, end_mill, drill, tip_radiused, tap), name, diameter_mm. " +
            "Optional: length_mm, holder_name, tool_number, num_flutes. tip_radius_mm is required only for tool_type=tip_radiused. " +
            "Returns name, type, diameter_mm of the created tool. " +
            "When NOT to use: for types this tool doesn't cover (Barrel, Dovetail, Form, ThreadMill, etc.), use run_macro with 'CREATE TOOL ; <TYPE>' commands.";
        public override JsonObject InputSchema => new JsonObject
        {
            ["type"] = "object",
            ["properties"] = new JsonObject
            {
                ["tool_type"] = new JsonObject
                {
                    ["type"] = "string",
                    ["enum"] = new JsonArray { "ball_nosed", "end_mill", "drill", "tip_radiused", "tap" },
                },
                ["name"] = new JsonObject { ["type"] = "string" },
                ["diameter_mm"] = new JsonObject { ["type"] = "number" },
                ["length_mm"] = new JsonObject { ["type"] = "number" },
                ["tip_radius_mm"] = new JsonObject { ["type"] = "number", ["description"] = "Only for tool_type=tip_radiused." },
                ["holder_name"] = new JsonObject { ["type"] = "string" },
                ["tool_number"] = new JsonObject { ["type"] = "integer" },
                ["num_flutes"] = new JsonObject { ["type"] = "integer" },
            },
            ["required"] = new JsonArray { "tool_type", "name", "diameter_mm" },
            ["additionalProperties"] = false,
        };
        public override JsonObject Annotations => Schemas.Action(idempotent: false);

        public override async Task<ToolResult> InvokeAsync(JsonElement? args, ProgressReporter progress, CancellationToken ct)
        {
            var toolType = GetString(args, "tool_type");
            var name = GetString(args, "name");
            var diameter = GetDoubleOpt(args, "diameter_mm");
            if (string.IsNullOrEmpty(toolType)) return ToolResult.Error("Missing tool_type");
            if (string.IsNullOrEmpty(name)) return ToolResult.Error("Missing name");
            if (diameter == null) return ToolResult.Error("Missing diameter_mm");

            var lengthOpt = GetDoubleOpt(args, "length_mm");
            var tipRadius = GetDoubleOpt(args, "tip_radius_mm");
            var holder = GetString(args, "holder_name");
            var toolNumberOpt = GetIntOpt(args, "tool_number");
            var fluteOpt = GetIntOpt(args, "num_flutes");

            var result = await _deps.Session.WithPowerMillAsync(pm =>
            {
                var collection = pm.ActiveProject.Tools;
                PMTool created;
                switch (toolType)
                {
                    case "ball_nosed":
                    {
                        var t = collection.CreateBallNosedTool();
                        t.Name = name!;
                        t.Diameter = (MM)diameter.Value;
                        created = t; break;
                    }
                    case "end_mill":
                    {
                        var t = collection.CreateEndMillTool();
                        t.Name = name!;
                        t.Diameter = (MM)diameter.Value;
                        created = t; break;
                    }
                    case "drill":
                    {
                        var t = collection.CreateDrillTool();
                        t.Name = name!;
                        t.Diameter = (MM)diameter.Value;
                        created = t; break;
                    }
                    case "tip_radiused":
                    {
                        var t = collection.CreateTipRadiusedTool();
                        t.Name = name!;
                        t.Diameter = (MM)diameter.Value;
                        if (tipRadius.HasValue) t.TipRadius = (MM)tipRadius.Value;
                        created = t; break;
                    }
                    case "tap":
                    {
                        var t = collection.CreateTapTool();
                        t.Name = name!;
                        t.Diameter = (MM)diameter.Value;
                        created = t; break;
                    }
                    default:
                        throw new InvalidOperationException("Unsupported tool_type: " + toolType);
                }

                if (lengthOpt.HasValue) created.Length = (MM)lengthOpt.Value;
                if (!string.IsNullOrEmpty(holder)) created.HolderName = holder!;
                if (toolNumberOpt.HasValue) created.ToolNumber = toolNumberOpt.Value;
                if (fluteOpt.HasValue) created.NumberOfFlutes = fluteOpt.Value;

                return new JsonObject
                {
                    ["name"] = created.Name,
                    ["type"] = toolType,
                    ["diameter_mm"] = (double)created.Diameter,
                };
            }, ct).ConfigureAwait(false);

            return ToolResult.Json(result);
        }

        private static double? GetDoubleOpt(JsonElement? args, string name)
        {
            if (args == null || args.Value.ValueKind != JsonValueKind.Object) return null;
            if (!args.Value.TryGetProperty(name, out var v)) return null;
            return v.ValueKind == JsonValueKind.Number ? v.GetDouble() : (double?)null;
        }
        private static int? GetIntOpt(JsonElement? args, string name)
        {
            if (args == null || args.Value.ValueKind != JsonValueKind.Object) return null;
            if (!args.Value.TryGetProperty(name, out var v)) return null;
            return v.ValueKind == JsonValueKind.Number && v.TryGetInt32(out var i) ? i : (int?)null;
        }
    }

    public sealed class UpdateToolTool : Tool
    {
        private readonly ToolDeps _deps;
        public UpdateToolTool(ToolDeps deps) { _deps = deps; }
        public override string Name => "update_tool";
        public override string Description =>
            "Modify properties of an existing tool by name. " +
            "Use to fix-up a tool's dimensions, holder, or numbering after creation. " +
            "Provide name (required) plus any of: diameter_mm, length_mm, tip_radius_mm, holder_name, tool_number, num_flutes, description, overhang_mm. tip_radius_mm is rejected if the tool isn't tool_type=tip_radiused. " +
            "Returns updated:<name>. " +
            "When NOT to use: use create_tool to make a new tool. Use get_tool_details first to see current values.";
        public override JsonObject InputSchema => new JsonObject
        {
            ["type"] = "object",
            ["properties"] = new JsonObject
            {
                ["name"] = new JsonObject { ["type"] = "string" },
                ["diameter_mm"] = new JsonObject { ["type"] = "number" },
                ["length_mm"] = new JsonObject { ["type"] = "number" },
                ["tip_radius_mm"] = new JsonObject { ["type"] = "number" },
                ["holder_name"] = new JsonObject { ["type"] = "string" },
                ["tool_number"] = new JsonObject { ["type"] = "integer" },
                ["num_flutes"] = new JsonObject { ["type"] = "integer" },
                ["description"] = new JsonObject { ["type"] = "string" },
                ["overhang_mm"] = new JsonObject { ["type"] = "number" },
            },
            ["required"] = new JsonArray { "name" },
            ["additionalProperties"] = false,
        };
        public override JsonObject Annotations => Schemas.Action(idempotent: true);

        public override async Task<ToolResult> InvokeAsync(JsonElement? args, ProgressReporter progress, CancellationToken ct)
        {
            var name = GetString(args, "name");
            if (string.IsNullOrEmpty(name)) return ToolResult.Error("Missing required parameter: name");

            await _deps.Session.WithPowerMillAsync(pm =>
            {
                PMTool? tool = null;
                foreach (var t in pm.ActiveProject.Tools)
                    if (string.Equals(t.Name, name, StringComparison.Ordinal)) { tool = t; break; }
                if (tool == null) throw new InvalidOperationException("Tool not found: " + name);

                if (TryGetDouble(args, "diameter_mm", out var d)) tool.Diameter = (MM)d;
                if (TryGetDouble(args, "length_mm", out var l)) tool.Length = (MM)l;
                if (TryGetString(args, "holder_name", out var h)) tool.HolderName = h;
                if (TryGetInt(args, "tool_number", out var tn)) tool.ToolNumber = tn;
                if (TryGetInt(args, "num_flutes", out var nf)) tool.NumberOfFlutes = nf;
                if (TryGetString(args, "description", out var desc)) tool.Description = desc;
                if (TryGetDouble(args, "overhang_mm", out var ov)) tool.Overhang = (MM)ov;

                if (TryGetDouble(args, "tip_radius_mm", out var tr))
                {
                    // Refuse tip_radius_mm for tools that don't have a tip radius.
                    // Silently ignoring user input is wrong — tell them what's wrong.
                    if (tool is PMToolTipRadiused tr1)
                    {
                        tr1.TipRadius = (MM)tr;
                    }
                    else
                    {
                        throw new InvalidOperationException(
                            "tip_radius_mm cannot be applied: tool '" + tool.Name + "' is type "
                            + tool.GetType().Name.Replace("PMTool", "")
                            + ", not tip_radiused. Use create_tool with tool_type='tip_radiused' if you need a tipped-radiused cutter.");
                    }
                }

                return 0;
            }, ct).ConfigureAwait(false);

            return ToolResult.Json(new JsonObject { ["updated"] = name });
        }

        private static bool TryGetDouble(JsonElement? args, string name, out double value)
        {
            value = 0;
            if (args == null || args.Value.ValueKind != JsonValueKind.Object) return false;
            if (!args.Value.TryGetProperty(name, out var v) || v.ValueKind != JsonValueKind.Number) return false;
            value = v.GetDouble();
            return true;
        }
        private static bool TryGetInt(JsonElement? args, string name, out int value)
        {
            value = 0;
            if (args == null || args.Value.ValueKind != JsonValueKind.Object) return false;
            if (!args.Value.TryGetProperty(name, out var v) || v.ValueKind != JsonValueKind.Number) return false;
            return v.TryGetInt32(out value);
        }
        private static bool TryGetString(JsonElement? args, string name, out string value)
        {
            value = "";
            if (args == null || args.Value.ValueKind != JsonValueKind.Object) return false;
            if (!args.Value.TryGetProperty(name, out var v) || v.ValueKind != JsonValueKind.String) return false;
            value = v.GetString() ?? "";
            return true;
        }
    }

    public sealed class ListToolsTool : Tool
    {
        private readonly ToolDeps _deps;
        public ListToolsTool(ToolDeps deps) { _deps = deps; }
        public override string Name => "list_tools";
        public override string Description =>
            "List all tools in the active project. " +
            "Use to discover what tools exist before creating new ones or referencing them in toolpaths. " +
            "No parameters. " +
            "Returns count and an array of {name, type, diameter_mm, length_mm}. " +
            "When NOT to use: use get_tool_details for the full property dump of a specific tool.";
        public override JsonObject InputSchema => Schemas.Empty();
        public override JsonObject Annotations => Schemas.ReadOnly("List Tools");
        public override async Task<ToolResult> InvokeAsync(JsonElement? args, ProgressReporter progress, CancellationToken ct)
        {
            var result = await _deps.Session.WithPowerMillAsync(pm =>
            {
                var arr = new JsonArray();
                foreach (var t in pm.ActiveProject.Tools)
                {
                    arr.Add(new JsonObject
                    {
                        ["name"] = SafeStr(() => t.Name),
                        ["type"] = t.GetType().Name.Replace("PMTool", ""),
                        ["diameter_mm"] = SafeDouble(() => (double)t.Diameter),
                        ["length_mm"] = SafeDouble(() => (double)t.Length),
                    });
                }
                return new JsonObject { ["count"] = arr.Count, ["tools"] = arr };
            }, ct).ConfigureAwait(false);
            return ToolResult.Json(result);
        }
        private static string SafeStr(Func<string> f) { try { return f() ?? ""; } catch { return ""; } }
        private static double SafeDouble(Func<double> f) { try { return f(); } catch { return 0; } }
    }

    public sealed class GetToolDetailsTool : Tool
    {
        private readonly ToolDeps _deps;
        public GetToolDetailsTool(ToolDeps deps) { _deps = deps; }
        public override string Name => "get_tool_details";
        public override string Description =>
            "Full property dump for a tool by name. " +
            "Use when you need to see every property of one specific tool before modifying or referencing it. " +
            "Provide name. " +
            "Returns name, type, diameter_mm, length_mm, tool_number, num_flutes, overhang_mm, holder_name, description, coolant, plus tip_radius_mm if applicable. " +
            "When NOT to use: use list_tools for a fast overview of all tools.";
        public override JsonObject InputSchema => new JsonObject
        {
            ["type"] = "object",
            ["properties"] = new JsonObject { ["name"] = new JsonObject { ["type"] = "string" } },
            ["required"] = new JsonArray { "name" },
            ["additionalProperties"] = false,
        };
        public override JsonObject Annotations => Schemas.ReadOnly("Get Tool Details");
        public override async Task<ToolResult> InvokeAsync(JsonElement? args, ProgressReporter progress, CancellationToken ct)
        {
            var name = GetString(args, "name");
            if (string.IsNullOrEmpty(name)) return ToolResult.Error("Missing required parameter: name");
            var result = await _deps.Session.WithPowerMillAsync(pm =>
            {
                PMTool? tool = null;
                foreach (var t in pm.ActiveProject.Tools)
                    if (string.Equals(t.Name, name, StringComparison.Ordinal)) { tool = t; break; }
                if (tool == null) throw new InvalidOperationException("Tool not found: " + name);

                var o = new JsonObject
                {
                    ["name"] = name,
                    ["type"] = tool.GetType().Name.Replace("PMTool", ""),
                    ["diameter_mm"] = SafeDouble(() => (double)tool.Diameter),
                    ["length_mm"] = SafeDouble(() => (double)tool.Length),
                    ["tool_number"] = SafeInt(() => tool.ToolNumber),
                    ["num_flutes"] = SafeInt(() => tool.NumberOfFlutes),
                    ["overhang_mm"] = SafeDouble(() => (double)tool.Overhang),
                    ["holder_name"] = SafeStr(() => tool.HolderName),
                    ["description"] = SafeStr(() => tool.Description),
                    ["coolant"] = SafeStr(() => tool.Coolant.ToString()),
                };
                if (tool is PMToolTipRadiused tr) o["tip_radius_mm"] = SafeDouble(() => (double)tr.TipRadius);
                return o;
            }, ct).ConfigureAwait(false);
            return ToolResult.Json(result);
        }
        private static string SafeStr(Func<string> f) { try { return f() ?? ""; } catch { return ""; } }
        private static double SafeDouble(Func<double> f) { try { return f(); } catch { return 0; } }
        private static int SafeInt(Func<int> f) { try { return f(); } catch { return 0; } }
    }
}
