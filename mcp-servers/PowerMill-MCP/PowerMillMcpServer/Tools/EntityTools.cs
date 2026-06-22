using System;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading;
using System.Threading.Tasks;
using Autodesk.ProductInterface.PowerMILL;
using PowerMillMcpServer.Mcp;

namespace PowerMillMcpServer.Tools
{
    public sealed class DeleteEntityTool : Tool
    {
        private readonly ToolDeps _deps;
        public DeleteEntityTool(ToolDeps deps) { _deps = deps; }

        public override string Name => "delete_entity";
        public override string Description =>
            "Delete a named entity from the active project. " +
            "Use for cleanup, replacing entities, or removing failed experiments. " +
            "Provide entity_type (toolpath | boundary | pattern | tool | workplane | ncprogram | model | stockmodel | setup | group | level), name, confirm:true (required, acknowledges destruction). " +
            "Returns deleted:<name> and entity_type. " +
            "When NOT to use: deletion is permanent — verify the name with the appropriate list_* tool first. delete_block exists for the special-case stock block.";
        public override JsonObject InputSchema => new JsonObject
        {
            ["type"] = "object",
            ["properties"] = new JsonObject
            {
                ["entity_type"] = new JsonObject
                {
                    ["type"] = "string",
                    ["enum"] = new JsonArray { "toolpath", "boundary", "pattern", "tool", "workplane", "ncprogram", "model", "stockmodel", "setup", "group", "level" },
                },
                ["name"] = new JsonObject { ["type"] = "string" },
                ["confirm"] = new JsonObject { ["type"] = "boolean", ["description"] = "Required true. Acknowledges the deletion." },
            },
            ["required"] = new JsonArray { "entity_type", "name", "confirm" },
            ["additionalProperties"] = false,
        };
        public override JsonObject Annotations => Schemas.Action(destructive: true, idempotent: true);

        public override async Task<ToolResult> InvokeAsync(JsonElement? args, ProgressReporter progress, CancellationToken ct)
        {
            if (!GetBool(args, "confirm", false))
                return ToolResult.Error("delete_entity requires confirm: true.");

            var entityType = GetString(args, "entity_type");
            var name = GetString(args, "name");
            if (string.IsNullOrEmpty(entityType)) return ToolResult.Error("Missing entity_type");
            if (string.IsNullOrEmpty(name)) return ToolResult.Error("Missing name");

            await _deps.Session.WithPowerMillAsync(pm =>
            {
                PMEntity? entity = null;
                switch (entityType)
                {
                    case "toolpath": foreach (var x in pm.ActiveProject.Toolpaths) if (Match(x.Name, name!)) { entity = x; break; } break;
                    case "boundary": foreach (var x in pm.ActiveProject.Boundaries) if (Match(x.Name, name!)) { entity = x; break; } break;
                    case "pattern": foreach (var x in pm.ActiveProject.Patterns) if (Match(x.Name, name!)) { entity = x; break; } break;
                    case "tool": foreach (var x in pm.ActiveProject.Tools) if (Match(x.Name, name!)) { entity = x; break; } break;
                    case "workplane": foreach (var x in pm.ActiveProject.Workplanes) if (Match(x.Name, name!)) { entity = x; break; } break;
                    case "ncprogram": foreach (var x in pm.ActiveProject.NCPrograms) if (Match(x.Name, name!)) { entity = x; break; } break;
                    case "model": foreach (var x in pm.ActiveProject.Models) if (Match(x.Name, name!)) { entity = x; break; } break;
                    case "stockmodel": foreach (var x in pm.ActiveProject.StockModels) if (Match(x.Name, name!)) { entity = x; break; } break;
                    case "setup": foreach (var x in pm.ActiveProject.Setups) if (Match(x.Name, name!)) { entity = x; break; } break;
                    case "group": foreach (var x in pm.ActiveProject.Groups) if (Match(x.Name, name!)) { entity = x; break; } break;
                    case "level": foreach (var x in pm.ActiveProject.LevelsAndSets) if (Match(x.Name, name!)) { entity = x; break; } break;
                    default: throw new InvalidOperationException("Unknown entity_type: " + entityType);
                }
                if (entity == null) throw new InvalidOperationException(entityType + " not found: " + name);
                entity.Delete();
                return 0;
            }, ct).ConfigureAwait(false);

            return ToolResult.Json(new JsonObject { ["deleted"] = name, ["entity_type"] = entityType });
        }

        private static bool Match(string a, string b) => string.Equals(a, b, StringComparison.Ordinal);
    }
}
