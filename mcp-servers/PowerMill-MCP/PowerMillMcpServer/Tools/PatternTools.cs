using System;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading;
using System.Threading.Tasks;
using PmFile = Autodesk.FileSystem.File;
using PowerMillMcpServer.Mcp;
using PowerMillMcpServer.Util;

namespace PowerMillMcpServer.Tools
{
    public sealed class CreatePatternTool : Tool
    {
        private readonly ToolDeps _deps;
        public CreatePatternTool(ToolDeps deps) { _deps = deps; }
        public override string Name => "create_pattern";
        public override string Description =>
            "Create a drive pattern (curves the toolpath follows). " +
            "Use to provide explicit drive geometry to strategies that need it (pattern, com_pattern). " +
            "Provide kind (empty | from_file), optional name. kind=from_file requires path (must be inside an allowed root). " +
            "Returns kind and name. " +
            "When NOT to use: if a strategy uses model surfaces or boundaries to drive itself, no pattern is needed.";
        public override JsonObject InputSchema => new JsonObject
        {
            ["type"] = "object",
            ["properties"] = new JsonObject
            {
                ["kind"] = new JsonObject
                {
                    ["type"] = "string",
                    ["enum"] = new JsonArray { "empty", "from_file" },
                },
                ["name"] = new JsonObject { ["type"] = "string", ["description"] = "Optional rename." },
                ["path"] = new JsonObject { ["type"] = "string", ["description"] = "kind=from_file: pattern source file." },
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
                    Autodesk.ProductInterface.PowerMILL.PMPattern created;
                    switch (kind)
                    {
                        case "empty":
                            created = pm.ActiveProject.Patterns.CreateEmptyPattern();
                            break;
                        case "from_file":
                        {
                            var path = GetString(args, "path");
                            if (string.IsNullOrEmpty(path)) throw new InvalidOperationException("kind=from_file requires path");
                            var safe = SafePath.Resolve(_deps.Roots.AllowedRoots, path!);
                            if (!System.IO.File.Exists(safe)) throw new InvalidOperationException("Pattern file does not exist: " + safe);
                            created = pm.ActiveProject.Patterns.CreatePattern(new PmFile(safe));
                            break;
                        }
                        default:
                            throw new InvalidOperationException("Unknown kind: " + kind);
                    }
                    if (created == null) throw new InvalidOperationException("Pattern creation returned null.");
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
    }

    public sealed class ListPatternsTool : Tool
    {
        private readonly ToolDeps _deps;
        public ListPatternsTool(ToolDeps deps) { _deps = deps; }
        public override string Name => "list_patterns";
        public override string Description =>
            "List all drive patterns in the active project. " +
            "Use to discover patterns before referencing them. " +
            "No parameters. " +
            "Returns count and array of {name}.";
        public override JsonObject InputSchema => Schemas.Empty();
        public override JsonObject Annotations => Schemas.ReadOnly("List Patterns");
        public override async Task<ToolResult> InvokeAsync(JsonElement? args, ProgressReporter progress, CancellationToken ct)
        {
            var result = await _deps.Session.WithPowerMillAsync(pm =>
            {
                var arr = new JsonArray();
                foreach (var p in pm.ActiveProject.Patterns) arr.Add(new JsonObject { ["name"] = SafeStr(() => p.Name) });
                return new JsonObject { ["count"] = arr.Count, ["patterns"] = arr };
            }, ct).ConfigureAwait(false);
            return ToolResult.Json(result);
        }
        private static string SafeStr(Func<string> f) { try { return f() ?? ""; } catch { return ""; } }
    }
}
