using System;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading;
using System.Threading.Tasks;
using Autodesk.ProductInterface.PowerMILL;
using PowerMillMcpServer.Mcp;

namespace PowerMillMcpServer.Tools
{
    public sealed class ListToolpathsTool : Tool
    {
        private readonly ToolDeps _deps;
        public ListToolpathsTool(ToolDeps deps) { _deps = deps; }

        public override string Name => "list_toolpaths";
        public override string Description =>
            "List all toolpaths in the active project. " +
            "Use to discover toolpaths before calculating, posting, or modifying. " +
            "No parameters. " +
            "Returns count and an array of {name, strategy, calculated, tool}. " +
            "When NOT to use: use query_parameter for deeper toolpath inspection (cut length, time, segment count). Use calculate_toolpath to compute uncalculated entries.";
        public override JsonObject InputSchema => Schemas.Empty();
        public override JsonObject Annotations => Schemas.ReadOnly("List Toolpaths");

        public override async Task<ToolResult> InvokeAsync(JsonElement? args, ProgressReporter progress, CancellationToken ct)
        {
            var result = await _deps.Session.WithPowerMillAsync(pm =>
            {
                var arr = new JsonArray();
                var project = pm.ActiveProject ?? throw new InvalidOperationException("No active project. Call open_project first.");
                foreach (var tp in project.Toolpaths)
                {
                    arr.Add(new JsonObject
                    {
                        ["name"] = SafeStr(() => tp.Name),
                        ["strategy"] = SafeStr(() => tp.Strategy),
                        ["calculated"] = SafeBool(() => tp.IsCalculated),
                        ["tool"] = SafeStr(() => tp.ToolName),
                    });
                }
                return new JsonObject { ["count"] = arr.Count, ["toolpaths"] = arr };
            }, ct).ConfigureAwait(false);

            return ToolResult.Json(result);
        }

        private static string SafeStr(Func<string> f) { try { return f() ?? ""; } catch { return ""; } }
        private static bool SafeBool(Func<bool> f) { try { return f(); } catch { return false; } }
    }

    public sealed class CalculateToolpathTool : Tool
    {
        private readonly ToolDeps _deps;
        public CalculateToolpathTool(ToolDeps deps) { _deps = deps; }

        public override string Name => "calculate_toolpath";
        public override string Description =>
            "Calculate (compute) a toolpath by name. Long-running. " +
            "Use after creating a toolpath (via template or low-level) to actually generate the cuts. " +
            "Provide toolpath_name. " +
            "Polls PowerMill IsBusy each second; emits MCP progress notifications during the wait. Supports host-initiated cancellation. " +
            "Returns calculated:bool, total_cut_length_mm, total_cut_time_s, poll_count. " +
            "When NOT to use: skip if the toolpath is already calculated (check list_toolpaths first). Use verify_toolpath afterwards to check for gouges/collisions.";
        public override JsonObject InputSchema => new JsonObject
        {
            ["type"] = "object",
            ["properties"] = new JsonObject
            {
                ["toolpath_name"] = new JsonObject { ["type"] = "string" },
            },
            ["required"] = new JsonArray { "toolpath_name" },
            ["additionalProperties"] = false,
        };
        public override JsonObject Annotations => Schemas.Action(idempotent: false);

        public override async Task<ToolResult> InvokeAsync(JsonElement? args, ProgressReporter progress, CancellationToken ct)
        {
            var name = GetString(args, "toolpath_name");
            if (string.IsNullOrEmpty(name)) return ToolResult.Error("Missing required parameter: toolpath_name");

            // Kick off Calculate on the STA thread.
            await _deps.Session.WithPowerMillAsync(pm =>
            {
                var tp = LookupToolpath(pm, name!);
                tp.Calculate();
            }, ct).ConfigureAwait(false);

            // Poll IsBusy with cancellation. Cooperative — the COM call we
            // already issued runs to completion on the STA thread (we can't
            // kill mid-COM-call), but if cancelled we stop polling and return
            // a cancellation error.
            var pollCount = 0;
            var startedUtc = DateTime.UtcNow;
            while (true)
            {
                ct.ThrowIfCancellationRequested();
                bool busy = await _deps.Session.WithPowerMillAsync(pm => pm.IsBusy, ct).ConfigureAwait(false);
                if (!busy) break;
                pollCount++;
                var elapsed = (DateTime.UtcNow - startedUtc).TotalSeconds;
                await progress.ReportAsync(elapsed, null, $"Calculating '{name}' ({elapsed:F0}s)", ct).ConfigureAwait(false);
                try { await Task.Delay(TimeSpan.FromSeconds(1), ct).ConfigureAwait(false); }
                catch (OperationCanceledException) { throw; }
            }

            var result = await _deps.Session.WithPowerMillAsync(pm =>
            {
                var tp = LookupToolpath(pm, name!);
                return new JsonObject
                {
                    ["name"] = name,
                    ["calculated"] = SafeBool(() => tp.IsCalculated),
                    ["total_cut_length_mm"] = SafeDouble(() => (double)tp.TotalCutLength),
                    ["total_cut_time_s"] = SafeDouble(() => tp.TotalCuttingTime.TotalSeconds),
                    ["poll_count"] = pollCount,
                };
            }, ct).ConfigureAwait(false);

            return ToolResult.Json(result);
        }

        private static PMToolpath LookupToolpath(PMAutomation pm, string name)
        {
            var project = pm.ActiveProject ?? throw new InvalidOperationException("No active project.");
            foreach (var tp in project.Toolpaths)
                if (string.Equals(tp.Name, name, StringComparison.Ordinal)) return tp;
            throw new InvalidOperationException("Toolpath not found: " + name);
        }

        private static double SafeDouble(Func<double> f) { try { return f(); } catch { return 0.0; } }
        private static bool SafeBool(Func<bool> f) { try { return f(); } catch { return false; } }
    }

    public sealed class VerifyToolpathTool : Tool
    {
        private readonly ToolDeps _deps;
        public VerifyToolpathTool(ToolDeps deps) { _deps = deps; }

        public override string Name => "verify_toolpath";
        public override string Description =>
            "Run safety checks on a calculated toolpath. " +
            "Use after calculate_toolpath as a sanity gate before posting NC. " +
            "Provide toolpath_name. The toolpath must be calculated. " +
            "Returns gouges_detected:bool, holder_collisions_detected:bool, plus the textual safety_report. " +
            "When NOT to use: pre-calculation — there's nothing to check yet. For a quick visual pass instead use the PowerMill GUI.";
        public override JsonObject InputSchema => new JsonObject
        {
            ["type"] = "object",
            ["properties"] = new JsonObject
            {
                ["toolpath_name"] = new JsonObject { ["type"] = "string" },
            },
            ["required"] = new JsonArray { "toolpath_name" },
            ["additionalProperties"] = false,
        };
        public override JsonObject Annotations => Schemas.ReadOnly("Verify Toolpath");

        public override async Task<ToolResult> InvokeAsync(JsonElement? args, ProgressReporter progress, CancellationToken ct)
        {
            var name = GetString(args, "toolpath_name");
            if (string.IsNullOrEmpty(name)) return ToolResult.Error("Missing required parameter: toolpath_name");

            var result = await _deps.Session.WithPowerMillAsync(pm =>
            {
                PMToolpath? tp = null;
                foreach (var t in pm.ActiveProject.Toolpaths)
                    if (string.Equals(t.Name, name, StringComparison.Ordinal)) { tp = t; break; }
                if (tp == null) throw new InvalidOperationException("Toolpath not found: " + name);

                bool gouges; try { gouges = tp.DetectToolGouges(); } catch { gouges = false; }
                bool holderCol; try { holderCol = tp.DetectHolderCollisions(); } catch { holderCol = false; }
                string report; try { report = tp.SafetyReport() ?? ""; } catch (Exception ex) { report = "(error: " + ex.Message + ")"; }

                return new JsonObject
                {
                    ["toolpath_name"] = name,
                    ["gouges_detected"] = gouges,
                    ["holder_collisions_detected"] = holderCol,
                    ["safety_report"] = report,
                };
            }, ct).ConfigureAwait(false);

            return ToolResult.Json(result);
        }
    }

    /// Low-level toolpath creation. Issues `CREATE TOOLPATH ; <STRATEGY>` then
    /// (optionally) assigns a tool / boundary / pattern via parameter sets, and
    /// accepts. Creating a toolpath via template (CreateToolpathFromTemplateTool)
    /// is preferred for production CAM since templates encode validated
    /// parameter sets; use this when you need a strategy you don't have a
    /// template for.
    public sealed class CreateToolpathTool : Tool
    {
        private readonly ToolDeps _deps;
        public CreateToolpathTool(ToolDeps deps) { _deps = deps; }

        public override string Name => "create_toolpath";
        public override string Description =>
            "Create a new toolpath of the given strategy with default parameters. " +
            "Use only when no template exists for the strategy you need. " +
            "Provide strategy (must be one of the 56 valid PowerMill strategy names — raster, offset_area_clear, profile, drill, constantz, etc.). Optional: name (rename), tool_name, boundary_name, pattern_name (each must be plain text, no quotes/backslashes/newlines). " +
            "Returns the strategy and new toolpath name. " +
            "When NOT to use: prefer create_toolpath_from_template for production work — templates encode validated parameter sets. This tool creates a default-parameter toolpath that usually still needs editing via run_macro.";
        public override JsonObject InputSchema => new JsonObject
        {
            ["type"] = "object",
            ["properties"] = new JsonObject
            {
                ["strategy"] = new JsonObject { ["type"] = "string", ["description"] = "PowerMill strategy name." },
                ["name"] = new JsonObject { ["type"] = "string", ["description"] = "Optional rename after creation." },
                ["tool_name"] = new JsonObject { ["type"] = "string", ["description"] = "Optional tool to assign." },
                ["boundary_name"] = new JsonObject { ["type"] = "string", ["description"] = "Optional boundary to assign." },
                ["pattern_name"] = new JsonObject { ["type"] = "string", ["description"] = "Optional pattern to assign." },
            },
            ["required"] = new JsonArray { "strategy" },
            ["additionalProperties"] = false,
        };
        public override JsonObject Annotations => Schemas.Action(idempotent: false);

        public override async Task<ToolResult> InvokeAsync(JsonElement? args, ProgressReporter progress, CancellationToken ct)
        {
            var strategy = GetString(args, "strategy");
            var strategyError = ToolpathStrategyAllowlist.Validate(strategy);
            if (strategyError != null) return ToolResult.Error(strategyError);

            var renameTo = GetString(args, "name");
            var toolName = GetString(args, "tool_name");
            var boundaryName = GetString(args, "boundary_name");
            var patternName = GetString(args, "pattern_name");

            // Validate every entity name that gets interpolated into a macro,
            // for the same reason as the strategy check.
            var nameError = EntityNameValidator.Validate(renameTo, "name")
                         ?? EntityNameValidator.Validate(toolName, "tool_name")
                         ?? EntityNameValidator.Validate(boundaryName, "boundary_name")
                         ?? EntityNameValidator.Validate(patternName, "pattern_name");
            if (nameError != null) return ToolResult.Error(nameError);

            var result = await _deps.Session.WithPowerMillAsync(pm =>
            {
                var before = SnapshotNames(pm.ActiveProject.Toolpaths);

                // Issue raw macro for strategy creation. ; is PowerMill's
                // placeholder meaning "auto-name". The CREATE/ACCEPT pair is
                // the canonical pattern for any strategy. Strategy is allowlist-
                // validated above so the upper-case form is safe to interpolate.
#pragma warning disable CS0618
                pm.Execute("CREATE TOOLPATH ; " + strategy!.Trim().ToUpperInvariant());
                if (!string.IsNullOrEmpty(toolName))
                    pm.Execute(string.Format("EDIT TOOLPATH ; TOOL NAME \"{0}\"", toolName));
                if (!string.IsNullOrEmpty(boundaryName))
                    pm.Execute(string.Format("EDIT TOOLPATH ; LIMIT BOUNDARY \"{0}\"", boundaryName));
                if (!string.IsNullOrEmpty(patternName))
                    pm.Execute(string.Format("EDIT TOOLPATH ; REFERENCE PATTERN \"{0}\"", patternName));
                pm.Execute("EDIT TOOLPATH ; ACCEPT BOUNDARY ACCEPT");
#pragma warning restore CS0618

                var after = SnapshotNames(pm.ActiveProject.Toolpaths);
                string newName = "";
                foreach (var n in after) if (!before.Contains(n)) { newName = n; break; }

                if (!string.IsNullOrEmpty(renameTo) && !string.IsNullOrEmpty(newName) && newName != renameTo)
                {
                    foreach (var tp in pm.ActiveProject.Toolpaths)
                        if (string.Equals(tp.Name, newName, StringComparison.Ordinal))
                        { try { tp.Name = renameTo!; newName = renameTo; } catch { } break; }
                }

                return new JsonObject
                {
                    ["strategy"] = strategy,
                    ["name"] = newName,
                };
            }, ct).ConfigureAwait(false);

            return ToolResult.Json(result);
        }

        private static System.Collections.Generic.HashSet<string> SnapshotNames(PMToolpathsCollection col)
        {
            var s = new System.Collections.Generic.HashSet<string>(StringComparer.Ordinal);
            foreach (var tp in col) s.Add(tp.Name ?? "");
            return s;
        }
    }

    public sealed class SetToolpathLinksTool : Tool
    {
        private readonly ToolDeps _deps;
        public SetToolpathLinksTool(ToolDeps deps) { _deps = deps; }

        public override string Name => "set_toolpath_links";
        public override string Description =>
            "Set the start-point and/or end-point method on a toolpath. " +
            "Use to control where the tool moves to before/after the toolpath. " +
            "Provide toolpath_name plus optional start_method (Absolute|BlockCentre|FirstPoint|FirstPointSafe) and/or end_method (Absolute|BlockCentre|LastPoint|LastPointSafe). " +
            "When method is Absolute, supply start_point/end_point as {x,y,z} — all three coordinates required. Other methods ignore the points. " +
            "Returns toolpath_name. Idempotent. " +
            "When NOT to use: most strategies have sensible defaults — only set this when you need explicit safe positions.";
        public override JsonObject InputSchema => new JsonObject
        {
            ["type"] = "object",
            ["properties"] = new JsonObject
            {
                ["toolpath_name"] = new JsonObject { ["type"] = "string" },
                ["start_method"] = new JsonObject { ["type"] = "string", ["enum"] = new JsonArray { "Absolute", "BlockCentre", "FirstPoint", "FirstPointSafe" } },
                ["start_point"] = new JsonObject
                {
                    ["type"] = "object",
                    ["properties"] = new JsonObject
                    {
                        ["x"] = new JsonObject { ["type"] = "number" },
                        ["y"] = new JsonObject { ["type"] = "number" },
                        ["z"] = new JsonObject { ["type"] = "number" },
                    },
                },
                ["end_method"] = new JsonObject { ["type"] = "string", ["enum"] = new JsonArray { "Absolute", "BlockCentre", "LastPoint", "LastPointSafe" } },
                ["end_point"] = new JsonObject
                {
                    ["type"] = "object",
                    ["properties"] = new JsonObject
                    {
                        ["x"] = new JsonObject { ["type"] = "number" },
                        ["y"] = new JsonObject { ["type"] = "number" },
                        ["z"] = new JsonObject { ["type"] = "number" },
                    },
                },
            },
            ["required"] = new JsonArray { "toolpath_name" },
            ["additionalProperties"] = false,
        };
        public override JsonObject Annotations => Schemas.Action(idempotent: true);

        public override async Task<ToolResult> InvokeAsync(JsonElement? args, ProgressReporter progress, CancellationToken ct)
        {
            var name = GetString(args, "toolpath_name");
            if (string.IsNullOrEmpty(name)) return ToolResult.Error("Missing toolpath_name");

            // Validate vec3 inputs synchronously before reaching the session,
            // converting ArgumentException into a tool error result.
            (double x, double y, double z)? startPt, endPt;
            try { startPt = ReadPoint(args, "start_point"); }
            catch (ArgumentException ex) { return ToolResult.Error(ex.Message); }
            try { endPt = ReadPoint(args, "end_point"); }
            catch (ArgumentException ex) { return ToolResult.Error(ex.Message); }

            await _deps.Session.WithPowerMillAsync(pm =>
            {
                PMToolpath? tp = null;
                foreach (var t in pm.ActiveProject.Toolpaths)
                    if (string.Equals(t.Name, name, StringComparison.Ordinal)) { tp = t; break; }
                if (tp == null) throw new InvalidOperationException("Toolpath not found: " + name);

                if (args!.Value.TryGetProperty("start_method", out var sm) && sm.ValueKind == JsonValueKind.String)
                {
                    var method = (StartPointMethod)Enum.Parse(typeof(StartPointMethod), sm.GetString()!, true);
                    if (startPt.HasValue) tp.SetStartPointMethod(method, startPt.Value.x, startPt.Value.y, startPt.Value.z);
                    else tp.SetStartPointMethod(method);
                }

                if (args.Value.TryGetProperty("end_method", out var em) && em.ValueKind == JsonValueKind.String)
                {
                    var method = (EndPointMethod)Enum.Parse(typeof(EndPointMethod), em.GetString()!, true);
                    if (endPt.HasValue) tp.SetEndPointMethod(method, endPt.Value.x, endPt.Value.y, endPt.Value.z);
                    else tp.SetEndPointMethod(method);
                }
                return 0;
            }, ct).ConfigureAwait(false);

            return ToolResult.Json(new JsonObject { ["toolpath_name"] = name });
        }

        // Returns null when start_point/end_point isn't supplied; throws when
        // it is supplied but malformed (missing x/y/z, non-numeric).
        private static (double x, double y, double z)? ReadPoint(JsonElement? args, string field)
        {
            if (args == null || !args.Value.TryGetProperty(field, out var v) || v.ValueKind != JsonValueKind.Object) return null;
            return Vec3Reader.Read(v, field);
        }
    }

    public sealed class CreateToolpathFromTemplateTool : Tool
    {
        private readonly ToolDeps _deps;
        public CreateToolpathFromTemplateTool(ToolDeps deps) { _deps = deps; }

        public override string Name => "create_toolpath_from_template";
        public override string Description =>
            "Apply a saved toolpath template (.ptf) to the active project. " +
            "Use this for production CAM — templates encode parameter sets that were validated at template-save time. " +
            "Provide template_path (absolute, must be inside an allowed root). " +
            "Returns template path, new_toolpaths array, and new_count (a single .ptf may produce one or several). " +
            "When NOT to use: when no template exists for the strategy you want — use create_toolpath low-level instead.";
        public override JsonObject InputSchema => new JsonObject
        {
            ["type"] = "object",
            ["properties"] = new JsonObject
            {
                ["template_path"] = new JsonObject { ["type"] = "string", ["description"] = "Absolute path to the template file." },
            },
            ["required"] = new JsonArray { "template_path" },
            ["additionalProperties"] = false,
        };
        public override JsonObject Annotations => Schemas.Action(idempotent: false);

        public override async Task<ToolResult> InvokeAsync(JsonElement? args, ProgressReporter progress, CancellationToken ct)
        {
            var path = GetString(args, "template_path");
            if (string.IsNullOrEmpty(path)) return ToolResult.Error("Missing required parameter: template_path");
            string safe;
            try { safe = Util.SafePath.Resolve(_deps.Roots.AllowedRoots, path!); }
            catch (Exception ex) { return ToolResult.Error(ex.Message); }
            if (!System.IO.File.Exists(safe)) return ToolResult.Error("Template file does not exist: " + safe);

            var result = await _deps.Session.WithPowerMillAsync(pm =>
            {
                var before = SnapshotNames(pm.ActiveProject.Toolpaths);
                pm.ActiveProject.ImportTemplateFile(new Autodesk.FileSystem.File(safe));
                var after = SnapshotNames(pm.ActiveProject.Toolpaths);
                var newNames = new System.Collections.Generic.List<string>();
                foreach (var n in after) if (!before.Contains(n)) newNames.Add(n);
                var arr = new JsonArray();
                foreach (var n in newNames) arr.Add(n);
                return new JsonObject
                {
                    ["template"] = safe,
                    ["new_toolpaths"] = arr,
                    ["new_count"] = newNames.Count,
                };
            }, ct).ConfigureAwait(false);

            return ToolResult.Json(result);
        }

        private static System.Collections.Generic.HashSet<string> SnapshotNames(Autodesk.ProductInterface.PowerMILL.PMToolpathsCollection col)
        {
            var s = new System.Collections.Generic.HashSet<string>(StringComparer.Ordinal);
            foreach (var tp in col) s.Add(tp.Name ?? "");
            return s;
        }
    }
}
