using System;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading;
using System.Threading.Tasks;
using PowerMillMcpServer.Mcp;

namespace PowerMillMcpServer.Tools
{
    /// Read-only listing tools for entity types that didn't have their own
    /// list_* tool already. The MCP must be able to discover what's loaded
    /// in the active project — without these, an LLM can't act on existing
    /// state without being told paths/names.
    public sealed class ListModelsTool : Tool
    {
        private readonly ToolDeps _deps;
        public ListModelsTool(ToolDeps deps) { _deps = deps; }
        public override string Name => "list_models";
        public override string Description =>
            "List all CAD models in the active project. " +
            "Use to discover what geometry is loaded before referencing it in boundaries or block creation. " +
            "No parameters. " +
            "Returns count and an array of {name, exists}. " +
            "When NOT to use: use import_model to add a new model.";
        public override JsonObject InputSchema => Schemas.Empty();
        public override JsonObject Annotations => Schemas.ReadOnly("List Models");
        public override async Task<ToolResult> InvokeAsync(JsonElement? args, ProgressReporter progress, CancellationToken ct)
        {
            var result = await _deps.Session.WithPowerMillAsync(pm =>
            {
                var arr = new JsonArray();
                foreach (var m in pm.ActiveProject.Models)
                {
                    arr.Add(new JsonObject
                    {
                        ["name"] = Safe(() => m.Name),
                        ["exists"] = SafeBool(() => m.Exists),
                    });
                }
                return new JsonObject { ["count"] = arr.Count, ["models"] = arr };
            }, ct).ConfigureAwait(false);
            return ToolResult.Json(result);
        }
        private static string Safe(Func<string> f) { try { return f() ?? ""; } catch { return ""; } }
        private static bool SafeBool(Func<bool> f) { try { return f(); } catch { return false; } }
    }

    public sealed class ListWorkplanesTool : Tool
    {
        private readonly ToolDeps _deps;
        public ListWorkplanesTool(ToolDeps deps) { _deps = deps; }
        public override string Name => "list_workplanes";
        public override string Description =>
            "List all workplanes in the active project. " +
            "Use to discover frames before referencing them as the OutputWorkplane on an NC program. " +
            "No parameters. " +
            "Returns count and an array of {name, is_active}.";
        public override JsonObject InputSchema => Schemas.Empty();
        public override JsonObject Annotations => Schemas.ReadOnly("List Workplanes");
        public override async Task<ToolResult> InvokeAsync(JsonElement? args, ProgressReporter progress, CancellationToken ct)
        {
            var result = await _deps.Session.WithPowerMillAsync(pm =>
            {
                var arr = new JsonArray();
                foreach (var w in pm.ActiveProject.Workplanes)
                {
                    arr.Add(new JsonObject
                    {
                        ["name"] = Safe(() => w.Name),
                        ["is_active"] = SafeBool(() => w.IsActive),
                    });
                }
                return new JsonObject { ["count"] = arr.Count, ["workplanes"] = arr };
            }, ct).ConfigureAwait(false);
            return ToolResult.Json(result);
        }
        private static string Safe(Func<string> f) { try { return f() ?? ""; } catch { return ""; } }
        private static bool SafeBool(Func<bool> f) { try { return f(); } catch { return false; } }
    }

    public sealed class ListSetupsTool : Tool
    {
        private readonly ToolDeps _deps;
        public ListSetupsTool(ToolDeps deps) { _deps = deps; }
        public override string Name => "list_setups";
        public override string Description =>
            "List all setups in the active project. " +
            "Use to discover machine setups in multi-axis projects. " +
            "No parameters. " +
            "Returns count and an array of {name}.";
        public override JsonObject InputSchema => Schemas.Empty();
        public override JsonObject Annotations => Schemas.ReadOnly("List Setups");
        public override async Task<ToolResult> InvokeAsync(JsonElement? args, ProgressReporter progress, CancellationToken ct)
        {
            var result = await _deps.Session.WithPowerMillAsync(pm =>
            {
                var arr = new JsonArray();
                foreach (var s in pm.ActiveProject.Setups)
                    arr.Add(new JsonObject { ["name"] = Safe(() => s.Name) });
                return new JsonObject { ["count"] = arr.Count, ["setups"] = arr };
            }, ct).ConfigureAwait(false);
            return ToolResult.Json(result);
        }
        private static string Safe(Func<string> f) { try { return f() ?? ""; } catch { return ""; } }
    }

    public sealed class ListStockModelsTool : Tool
    {
        private readonly ToolDeps _deps;
        public ListStockModelsTool(ToolDeps deps) { _deps = deps; }
        public override string Name => "list_stock_models";
        public override string Description =>
            "List all stock models in the active project. " +
            "Use to discover stock models that toolpaths can use as in-process material state. " +
            "No parameters. " +
            "Returns count and an array of {name}.";
        public override JsonObject InputSchema => Schemas.Empty();
        public override JsonObject Annotations => Schemas.ReadOnly("List Stock Models");
        public override async Task<ToolResult> InvokeAsync(JsonElement? args, ProgressReporter progress, CancellationToken ct)
        {
            var result = await _deps.Session.WithPowerMillAsync(pm =>
            {
                var arr = new JsonArray();
                foreach (var s in pm.ActiveProject.StockModels)
                    arr.Add(new JsonObject { ["name"] = Safe(() => s.Name) });
                return new JsonObject { ["count"] = arr.Count, ["stock_models"] = arr };
            }, ct).ConfigureAwait(false);
            return ToolResult.Json(result);
        }
        private static string Safe(Func<string> f) { try { return f() ?? ""; } catch { return ""; } }
    }

    public sealed class ListMachineToolsTool : Tool
    {
        private readonly ToolDeps _deps;
        public ListMachineToolsTool(ToolDeps deps) { _deps = deps; }
        public override string Name => "list_machine_tools";
        public override string Description =>
            "List all machine tools in the active project. " +
            "Use to discover the configured machines available for posting. " +
            "No parameters. " +
            "Returns count and an array of {name}.";
        public override JsonObject InputSchema => Schemas.Empty();
        public override JsonObject Annotations => Schemas.ReadOnly("List Machine Tools");
        public override async Task<ToolResult> InvokeAsync(JsonElement? args, ProgressReporter progress, CancellationToken ct)
        {
            var result = await _deps.Session.WithPowerMillAsync(pm =>
            {
                var arr = new JsonArray();
                foreach (var m in pm.ActiveProject.MachineTools)
                    arr.Add(new JsonObject { ["name"] = Safe(() => m.Name) });
                return new JsonObject { ["count"] = arr.Count, ["machine_tools"] = arr };
            }, ct).ConfigureAwait(false);
            return ToolResult.Json(result);
        }
        private static string Safe(Func<string> f) { try { return f() ?? ""; } catch { return ""; } }
    }
}
