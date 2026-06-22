using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading;
using System.Threading.Tasks;
using Autodesk.ProductInterface.PowerMILL;
using PowerMillMcpServer.Mcp;
using PowerMillMcpServer.Util;

namespace PowerMillMcpServer.Tools
{
    public sealed class ListNCProgramsTool : Tool
    {
        private readonly ToolDeps _deps;
        public ListNCProgramsTool(ToolDeps deps) { _deps = deps; }
        public override string Name => "list_nc_programs";
        public override string Description =>
            "List all NC programs in the active project. " +
            "Use to discover NC programs before configuring, posting, or modifying. " +
            "No parameters. " +
            "Returns count and an array of {name, post_file, output_file_name, program_number, toolpath_count}. " +
            "When NOT to use: use create_nc_program to make a new shell. Use list_post_processors to discover available posts.";
        public override JsonObject InputSchema => Schemas.Empty();
        public override JsonObject Annotations => Schemas.ReadOnly("List NC Programs");

        public override async Task<ToolResult> InvokeAsync(JsonElement? args, ProgressReporter progress, CancellationToken ct)
        {
            var result = await _deps.Session.WithPowerMillAsync(pm =>
            {
                var arr = new JsonArray();
                foreach (var p in pm.ActiveProject.NCPrograms)
                {
                    arr.Add(new JsonObject
                    {
                        ["name"] = SafeStr(() => p.Name),
                        ["post_file"] = SafeStr(() => p.MachineOptionFileName),
                        ["output_file_name"] = SafeStr(() => p.OutputFileName),
                        ["program_number"] = SafeInt(() => p.ProgramNumber),
                        ["toolpath_count"] = SafeInt(() => p.Toolpaths?.Count ?? 0),
                    });
                }
                return new JsonObject { ["count"] = arr.Count, ["nc_programs"] = arr };
            }, ct).ConfigureAwait(false);
            return ToolResult.Json(result);
        }
        private static string SafeStr(Func<string> f) { try { return f() ?? ""; } catch { return ""; } }
        private static int SafeInt(Func<int> f) { try { return f(); } catch { return 0; } }
    }

    public sealed class CreateNCProgramTool : Tool
    {
        private readonly ToolDeps _deps;
        public CreateNCProgramTool(ToolDeps deps) { _deps = deps; }
        public override string Name => "create_nc_program";
        public override string Description =>
            "Create an empty NC program shell. " +
            "Use as the first step of NC output: this gives you a named program; subsequent tools add toolpaths and configure post. " +
            "Provide name. " +
            "Returns name. " +
            "When NOT to use: use add_toolpaths_to_nc_program / configure_nc_program / write_nc_program to populate and run it. Use list (via query_parameter) to see existing NC programs.";
        public override JsonObject InputSchema => new JsonObject
        {
            ["type"] = "object",
            ["properties"] = new JsonObject { ["name"] = new JsonObject { ["type"] = "string" } },
            ["required"] = new JsonArray { "name" },
            ["additionalProperties"] = false,
        };
        public override JsonObject Annotations => Schemas.Action(idempotent: false);
        public override async Task<ToolResult> InvokeAsync(JsonElement? args, ProgressReporter progress, CancellationToken ct)
        {
            var name = GetString(args, "name");
            if (string.IsNullOrEmpty(name)) return ToolResult.Error("Missing required parameter: name");
            await _deps.Session.WithPowerMillAsync(pm => { pm.ActiveProject.NCPrograms.CreateNCProgram(name!); }, ct).ConfigureAwait(false);
            return ToolResult.Json(new JsonObject { ["name"] = name });
        }
    }

    public sealed class AddToolpathsToNCProgramTool : Tool
    {
        private readonly ToolDeps _deps;
        public AddToolpathsToNCProgramTool(ToolDeps deps) { _deps = deps; }
        public override string Name => "add_toolpaths_to_nc_program";
        public override string Description =>
            "Append (or insert) toolpaths to an existing NC program in a specific order. " +
            "Use after create_nc_program to populate it with operations to post. " +
            "Provide nc_program_name and toolpaths (array of {name, position?}). position: 'first' (top of program), 'last' (default, append), or a non-negative integer N (insert AFTER existing item N). " +
            "Returns nc_program and added count. " +
            "When NOT to use: to remove toolpaths use run_macro with EDIT NCPROGRAM ... TOOLPATH ... DELETE.";
        public override JsonObject InputSchema => new JsonObject
        {
            ["type"] = "object",
            ["properties"] = new JsonObject
            {
                ["nc_program_name"] = new JsonObject { ["type"] = "string" },
                ["toolpaths"] = new JsonObject
                {
                    ["type"] = "array",
                    ["items"] = new JsonObject
                    {
                        ["type"] = "object",
                        ["properties"] = new JsonObject
                        {
                            ["name"] = new JsonObject { ["type"] = "string" },
                            ["position"] = new JsonObject
                            {
                                ["oneOf"] = new JsonArray
                                {
                                    new JsonObject { ["type"] = "string", ["enum"] = new JsonArray { "first", "last" } },
                                    new JsonObject { ["type"] = "integer", ["minimum"] = 0 },
                                },
                            },
                        },
                        ["required"] = new JsonArray { "name" },
                    },
                    ["minItems"] = 1,
                },
            },
            ["required"] = new JsonArray { "nc_program_name", "toolpaths" },
            ["additionalProperties"] = false,
        };
        public override JsonObject Annotations => Schemas.Action(idempotent: false);

        public override async Task<ToolResult> InvokeAsync(JsonElement? args, ProgressReporter progress, CancellationToken ct)
        {
            var ncName = GetString(args, "nc_program_name");
            if (string.IsNullOrEmpty(ncName)) return ToolResult.Error("Missing nc_program_name");
            if (args == null || !args.Value.TryGetProperty("toolpaths", out var arr) || arr.ValueKind != JsonValueKind.Array)
                return ToolResult.Error("Missing toolpaths array");

            var entries = new List<(string name, bool atFront, int afterIndex)>();
            foreach (var entry in arr.EnumerateArray())
            {
                if (entry.ValueKind != JsonValueKind.Object) return ToolResult.Error("each toolpaths entry must be an object");
                if (!entry.TryGetProperty("name", out var n) || n.ValueKind != JsonValueKind.String) return ToolResult.Error("each entry needs name");
                bool atFront = false;
                int afterIndex = -1;
                if (entry.TryGetProperty("position", out var pos))
                {
                    if (pos.ValueKind == JsonValueKind.String)
                    {
                        if (pos.GetString() == "first") atFront = true;
                        else if (pos.GetString() == "last") atFront = false;
                        else return ToolResult.Error("position must be 'first', 'last', or an integer");
                    }
                    else if (pos.ValueKind == JsonValueKind.Number && pos.TryGetInt32(out var idx))
                    {
                        afterIndex = idx;
                    }
                }
                entries.Add((n.GetString()!, atFront, afterIndex));
            }

            await _deps.Session.WithPowerMillAsync(pm =>
            {
                PMNCProgram? prog = null;
                foreach (var p in pm.ActiveProject.NCPrograms)
                    if (string.Equals(p.Name, ncName, StringComparison.Ordinal)) { prog = p; break; }
                if (prog == null) throw new InvalidOperationException("NC program not found: " + ncName);

                foreach (var (name, atFront, afterIndex) in entries)
                {
                    prog.AddToolpath(name, atFront, afterIndex);
                }
                return 0;
            }, ct).ConfigureAwait(false);

            return ToolResult.Json(new JsonObject { ["nc_program"] = ncName, ["added"] = entries.Count });
        }
    }

    public sealed class ConfigureNCProgramTool : Tool
    {
        private readonly ToolDeps _deps;
        public ConfigureNCProgramTool(ToolDeps deps) { _deps = deps; }
        public override string Name => "configure_nc_program";
        public override string Description =>
            "Set the configuration of an NC program: post processor, output path, output workplane, program number, part name. " +
            "Use after create_nc_program to point it at the right post and tell it where to write the G-code. " +
            "Provide name (required) plus any of: post_file (path to .pmoptz/.opt/.cps), output_file_name (where G-code will land), output_workplane (string), program_number (int), part_name (string). post_file and output_file_name must be inside an allowed root. " +
            "Returns the name and resolved post/output paths. " +
            "When NOT to use: use set_nc_tool_handling for tool-change behaviors. Use list_post_processors to discover available post files first.";
        public override JsonObject InputSchema => new JsonObject
        {
            ["type"] = "object",
            ["properties"] = new JsonObject
            {
                ["name"] = new JsonObject { ["type"] = "string" },
                ["post_file"] = new JsonObject { ["type"] = "string", ["description"] = "Path to .pmoptz/.opt/.cps post processor option file." },
                ["output_file_name"] = new JsonObject { ["type"] = "string", ["description"] = "Path where the posted G-code will be written." },
                ["output_workplane"] = new JsonObject { ["type"] = "string" },
                ["program_number"] = new JsonObject { ["type"] = "integer" },
                ["part_name"] = new JsonObject { ["type"] = "string" },
            },
            ["required"] = new JsonArray { "name" },
            ["additionalProperties"] = false,
        };
        public override JsonObject Annotations => Schemas.Action(idempotent: true);

        public override async Task<ToolResult> InvokeAsync(JsonElement? args, ProgressReporter progress, CancellationToken ct)
        {
            var name = GetString(args, "name");
            if (string.IsNullOrEmpty(name)) return ToolResult.Error("Missing name");
            string? safePost = null;
            string? safeOut = null;
            try
            {
                // post_file is a READ-only input — PowerMill reads it to drive
                // posting. Allow system roots (so `list_post_processors`
                // results can be passed straight through). output_file_name
                // is the WRITE target and stays restricted to project roots.
                if (args!.Value.TryGetProperty("post_file", out var p) && p.ValueKind == JsonValueKind.String)
                    safePost = SafePath.ResolveReadOnly(_deps.Roots.AllowedRoots, _deps.Roots.ReadOnlySystemRoots, p.GetString()!);
                if (args.Value.TryGetProperty("output_file_name", out var o) && o.ValueKind == JsonValueKind.String)
                    safeOut = SafePath.Resolve(_deps.Roots.AllowedRoots, o.GetString()!);
            }
            catch (Exception ex) { return ToolResult.Error(ex.Message); }

            var workplane = GetString(args, "output_workplane");
            var partName = GetString(args, "part_name");
            int? progNum = null;
            if (args!.Value.TryGetProperty("program_number", out var pn) && pn.ValueKind == JsonValueKind.Number && pn.TryGetInt32(out var pni))
                progNum = pni;

            await _deps.Session.WithPowerMillAsync(pm =>
            {
                PMNCProgram? prog = null;
                foreach (var p in pm.ActiveProject.NCPrograms)
                    if (string.Equals(p.Name, name, StringComparison.Ordinal)) { prog = p; break; }
                if (prog == null) throw new InvalidOperationException("NC program not found: " + name);

                if (safePost != null) prog.MachineOptionFileName = safePost;
                if (safeOut != null) prog.OutputFileName = safeOut;
                if (!string.IsNullOrEmpty(workplane)) prog.OutputWorkplaneName = workplane!;
                if (progNum.HasValue) prog.ProgramNumber = progNum.Value;
                if (!string.IsNullOrEmpty(partName)) prog.PartName = partName!;
                return 0;
            }, ct).ConfigureAwait(false);

            return ToolResult.Json(new JsonObject
            {
                ["name"] = name,
                ["post_file"] = safePost,
                ["output_file_name"] = safeOut,
            });
        }
    }

    public sealed class SetNCToolHandlingTool : Tool
    {
        private readonly ToolDeps _deps;
        public SetNCToolHandlingTool(ToolDeps deps) { _deps = deps; }
        public override string Name => "set_nc_tool_handling";
        public override string Description =>
            "Set tool-handling enums on an NC program: when changes happen, how tools are numbered, where the change occurs, and how tool position is measured. " +
            "Use to match the NC program to your machine's tool-change conventions. " +
            "Provide name plus any of: tool_change (Change|Always|New), tool_numbering (Automatic|On|Sequential), tool_change_position (Before|After), tool_value (Tip|Centre). All optional — only the supplied fields are changed. " +
            "Returns the name. Idempotent. " +
            "When NOT to use: post processor specifics (M codes, formats) are controlled by the .pmoptz file, not by this tool.";
        public override JsonObject InputSchema => new JsonObject
        {
            ["type"] = "object",
            ["properties"] = new JsonObject
            {
                ["name"] = new JsonObject { ["type"] = "string" },
                ["tool_change"] = new JsonObject { ["type"] = "string", ["enum"] = new JsonArray { "Change", "Always", "New" } },
                ["tool_numbering"] = new JsonObject { ["type"] = "string", ["enum"] = new JsonArray { "Automatic", "On", "Sequential" } },
                ["tool_change_position"] = new JsonObject { ["type"] = "string", ["enum"] = new JsonArray { "Before", "After" } },
                ["tool_value"] = new JsonObject { ["type"] = "string", ["enum"] = new JsonArray { "Tip", "Centre" } },
            },
            ["required"] = new JsonArray { "name" },
            ["additionalProperties"] = false,
        };
        public override JsonObject Annotations => Schemas.Action(idempotent: true);

        public override async Task<ToolResult> InvokeAsync(JsonElement? args, ProgressReporter progress, CancellationToken ct)
        {
            var name = GetString(args, "name");
            if (string.IsNullOrEmpty(name)) return ToolResult.Error("Missing name");

            await _deps.Session.WithPowerMillAsync(pm =>
            {
                PMNCProgram? prog = null;
                foreach (var p in pm.ActiveProject.NCPrograms)
                    if (string.Equals(p.Name, name, StringComparison.Ordinal)) { prog = p; break; }
                if (prog == null) throw new InvalidOperationException("NC program not found: " + name);

                if (args!.Value.TryGetProperty("tool_change", out var tc) && tc.ValueKind == JsonValueKind.String)
                    prog.ToolChange = (ToolChanges)Enum.Parse(typeof(ToolChanges), tc.GetString()!, true);
                if (args.Value.TryGetProperty("tool_numbering", out var tn) && tn.ValueKind == JsonValueKind.String)
                    prog.ToolNumbering = (ToolNumberings)Enum.Parse(typeof(ToolNumberings), tn.GetString()!, true);
                if (args.Value.TryGetProperty("tool_change_position", out var tcp) && tcp.ValueKind == JsonValueKind.String)
                    prog.ToolChangePosition = (ToolChangePositions)Enum.Parse(typeof(ToolChangePositions), tcp.GetString()!, true);
                if (args.Value.TryGetProperty("tool_value", out var tv) && tv.ValueKind == JsonValueKind.String)
                    prog.ToolValue = (ToolValues)Enum.Parse(typeof(ToolValues), tv.GetString()!, true);
                return 0;
            }, ct).ConfigureAwait(false);

            return ToolResult.Json(new JsonObject { ["name"] = name });
        }
    }

    public sealed class WriteNCProgramTool : Tool
    {
        private readonly ToolDeps _deps;
        public WriteNCProgramTool(ToolDeps deps) { _deps = deps; }
        public override string Name => "write_nc_program";
        public override string Description =>
            "Post an NC program (run the post processor) and return a preview of the resulting G-code. " +
            "Use as the final step of NC output: emits the actual machine code to disk and shows you what came out. " +
            "Provide name (the NC program must already be configured via configure_nc_program). " +
            "Returns name, path, size_bytes, line_count, encoding (utf-8 or windows-1252), preview (first 100 lines + last 50 if total > 200, capped at 100K chars). " +
            "When NOT to use: use batch_post when you have multiple programs to post in sequence.";
        public override JsonObject InputSchema => new JsonObject
        {
            ["type"] = "object",
            ["properties"] = new JsonObject { ["name"] = new JsonObject { ["type"] = "string" } },
            ["required"] = new JsonArray { "name" },
            ["additionalProperties"] = false,
        };
        public override JsonObject Annotations => Schemas.Action(idempotent: true);

        public override async Task<ToolResult> InvokeAsync(JsonElement? args, ProgressReporter progress, CancellationToken ct)
        {
            var name = GetString(args, "name");
            if (string.IsNullOrEmpty(name)) return ToolResult.Error("Missing name");

            // Trigger the write.
            string outputPath = await _deps.Session.WithPowerMillAsync(pm =>
            {
                PMNCProgram? prog = null;
                foreach (var p in pm.ActiveProject.NCPrograms)
                    if (string.Equals(p.Name, name, StringComparison.Ordinal)) { prog = p; break; }
                if (prog == null) throw new InvalidOperationException("NC program not found: " + name);
                prog.Write();
                return prog.OutputFileName ?? "";
            }, ct).ConfigureAwait(false);

            // Wait for IsBusy to clear.
            while (true)
            {
                ct.ThrowIfCancellationRequested();
                bool busy = await _deps.Session.WithPowerMillAsync(pm => pm.IsBusy, ct).ConfigureAwait(false);
                if (!busy) break;
                try { await Task.Delay(TimeSpan.FromSeconds(1), ct).ConfigureAwait(false); }
                catch (OperationCanceledException) { throw; }
            }

            // Containment-check the output before reading. Even though we wrote
            // to the configured path, the path was set by the LLM and could
            // have escaped between configure_nc_program and now.
            string safeOut;
            try { safeOut = SafePath.Resolve(_deps.Roots.AllowedRoots, outputPath); }
            catch (Exception ex) { return ToolResult.Error(ex.Message); }

            if (!File.Exists(safeOut))
                return ToolResult.Error("Posted output file not found at " + safeOut);

            var preview = ReadPreview(safeOut, out var encoding, out var sizeBytes, out var lineCount);
            var capped = OutputCap.Apply(preview);

            return ToolResult.Json(new JsonObject
            {
                ["name"] = name,
                ["path"] = safeOut,
                ["size_bytes"] = sizeBytes,
                ["line_count"] = lineCount,
                ["encoding"] = encoding,
                ["preview"] = capped,
            });
        }

        private static string ReadPreview(string path, out string encoding, out long sizeBytes, out int lineCount)
        {
            sizeBytes = new FileInfo(path).Length;
            string text;
            try
            {
                using var sr = new StreamReader(path, new UTF8Encoding(encoderShouldEmitUTF8Identifier: false, throwOnInvalidBytes: true));
                text = sr.ReadToEnd();
                encoding = "utf-8";
            }
            catch (DecoderFallbackException)
            {
                using var sr = new StreamReader(path, Encoding.GetEncoding(1252));
                text = sr.ReadToEnd();
                encoding = "windows-1252";
            }

            var lines = text.Split('\n');
            lineCount = lines.Length;
            if (lineCount <= 200) return text;

            var sb = new StringBuilder();
            for (int i = 0; i < 100; i++) sb.Append(lines[i]).Append('\n');
            sb.Append("[... ").Append(lineCount - 150).Append(" lines omitted ...]\n");
            for (int i = lineCount - 50; i < lineCount; i++) sb.Append(lines[i]).Append('\n');
            return sb.ToString();
        }
    }

    public sealed class BatchPostTool : Tool
    {
        private readonly ToolDeps _deps;
        public BatchPostTool(ToolDeps deps) { _deps = deps; }
        public override string Name => "batch_post";
        public override string Description =>
            "Post multiple NC programs in sequence. " +
            "Use when you have a job with several NC programs that all need posting at once. " +
            "Provide nc_program_names (ordered array). " +
            "Continues on per-program error (does not abort the whole batch). " +
            "Returns count and an array of {name, success, output_path?, error?} per program, with progress notifications during the run. " +
            "When NOT to use: for one program, use write_nc_program — it returns a G-code preview that batch_post does not.";
        public override JsonObject InputSchema => new JsonObject
        {
            ["type"] = "object",
            ["properties"] = new JsonObject
            {
                ["nc_program_names"] = new JsonObject
                {
                    ["type"] = "array",
                    ["items"] = new JsonObject { ["type"] = "string" },
                    ["minItems"] = 1,
                },
            },
            ["required"] = new JsonArray { "nc_program_names" },
            ["additionalProperties"] = false,
        };
        public override JsonObject Annotations => Schemas.Action(idempotent: true);

        public override async Task<ToolResult> InvokeAsync(JsonElement? args, ProgressReporter progress, CancellationToken ct)
        {
            if (args == null || !args.Value.TryGetProperty("nc_program_names", out var arr) || arr.ValueKind != JsonValueKind.Array)
                return ToolResult.Error("Missing nc_program_names array");

            var results = new JsonArray();
            int i = 0;
            int total = arr.GetArrayLength();
            foreach (var n in arr.EnumerateArray())
            {
                ct.ThrowIfCancellationRequested();
                if (n.ValueKind != JsonValueKind.String) continue;
                var name = n.GetString();
                await progress.ReportAsync(i, total, $"Posting {name}", ct).ConfigureAwait(false);

                try
                {
                    var path = await _deps.Session.WithPowerMillAsync(pm =>
                    {
                        PMNCProgram? prog = null;
                        foreach (var p in pm.ActiveProject.NCPrograms)
                            if (string.Equals(p.Name, name, StringComparison.Ordinal)) { prog = p; break; }
                        if (prog == null) throw new InvalidOperationException("NC program not found: " + name);
                        prog.Write();
                        return prog.OutputFileName ?? "";
                    }, ct).ConfigureAwait(false);

                    while (await _deps.Session.WithPowerMillAsync(pm => pm.IsBusy, ct).ConfigureAwait(false))
                    {
                        ct.ThrowIfCancellationRequested();
                        await Task.Delay(TimeSpan.FromSeconds(1), ct).ConfigureAwait(false);
                    }

                    results.Add(new JsonObject { ["name"] = name, ["success"] = true, ["output_path"] = path });
                }
                catch (Exception ex)
                {
                    results.Add(new JsonObject { ["name"] = name, ["success"] = false, ["error"] = ex.Message });
                }
                i++;
            }

            return ToolResult.Json(new JsonObject { ["count"] = i, ["results"] = results });
        }
    }

    public sealed class ListPostProcessorsTool : Tool
    {
        private readonly ToolDeps _deps;
        public ListPostProcessorsTool(ToolDeps deps) { _deps = deps; }
        public override string Name => "list_post_processors";
        public override string Description =>
            "List post processor option files (.pmoptz, .opt, .cps) in a folder. " +
            "Use to discover available posts before configuring an NC program. " +
            "Optional folder (must be inside an allowed root, OR inferred from PowerMill install — inferred system folders auto-allowlist for read-only scans). If omitted, defaults to POWERMILL_POST_PROCESSORS env var, then to the post_processors folder under the highest-versioned PowerMill install. " +
            "Returns folder, count, and an array of {filename, full_path, modified_utc}. " +
            "When NOT to use: to set the post on an NC program, use configure_nc_program post_file with one of the full_path values from this tool.";
        public override JsonObject InputSchema => new JsonObject
        {
            ["type"] = "object",
            ["properties"] = new JsonObject
            {
                ["folder"] = new JsonObject { ["type"] = "string", ["description"] = "Optional folder to scan. Must be inside an allowed root." },
                ["recursive"] = new JsonObject { ["type"] = "boolean", ["default"] = true, ["description"] = "Walk subfolders. Default true — shop post folders are typically organized by machine vendor." },
            },
            ["additionalProperties"] = false,
        };
        public override JsonObject Annotations => Schemas.ReadOnly("List Post Processors");

        public override Task<ToolResult> InvokeAsync(JsonElement? args, ProgressReporter progress, CancellationToken ct)
        {
            string? folder = GetString(args, "folder");
            bool autoAllowlist = false;  // true when the path source is the user (env var) or the server (inference)
            if (string.IsNullOrEmpty(folder))
            {
                folder = Environment.GetEnvironmentVariable("POWERMILL_POST_PROCESSORS");
                if (!string.IsNullOrEmpty(folder)) autoAllowlist = true;
            }
            if (string.IsNullOrEmpty(folder))
            {
                // Best effort: scan the highest-versioned PowerMill install for a post folder.
                var autodesk = "C:\\Program Files\\Autodesk";
                if (Directory.Exists(autodesk))
                {
                    var pmDirs = Directory.GetDirectories(autodesk, "PowerMill *");
                    if (pmDirs.Length > 0)
                    {
                        var latest = pmDirs.OrderByDescending(d => d).First();
                        var posts = Path.Combine(latest, "file", "post_processors");
                        if (Directory.Exists(posts)) { folder = posts; autoAllowlist = true; }
                    }
                }
            }
            if (string.IsNullOrEmpty(folder))
                return Task.FromResult(ToolResult.Error("No folder provided and no default could be inferred. Set POWERMILL_POST_PROCESSORS or pass folder."));

            // Auto-allowlist when the path comes from the env var (user opted in
            // by setting it) or from server-side inference. A folder= argument
            // from the LLM goes through the standard containment check, since
            // the LLM could be hallucinating.
            if (autoAllowlist) _deps.Roots.AddSystemRoot(folder!);

            string safe;
            try { safe = SafePath.ResolveReadOnly(_deps.Roots.AllowedRoots, _deps.Roots.ReadOnlySystemRoots, folder!); }
            catch (Exception ex) { return Task.FromResult(ToolResult.Error(ex.Message)); }

            if (!Directory.Exists(safe))
                return Task.FromResult(ToolResult.Error("Folder does not exist: " + safe));

            var recursive = GetBool(args, "recursive", true);
            var searchOpt = recursive ? SearchOption.AllDirectories : SearchOption.TopDirectoryOnly;
            var arr = new JsonArray();
            const int maxResults = 500;
            foreach (var ext in new[] { "*.pmoptz", "*.opt", "*.cps" })
            {
                foreach (var f in Directory.EnumerateFiles(safe, ext, searchOpt))
                {
                    if (arr.Count >= maxResults) break;
                    var fi = new FileInfo(f);
                    arr.Add(new JsonObject
                    {
                        ["filename"] = fi.Name,
                        ["full_path"] = fi.FullName,
                        ["modified_utc"] = fi.LastWriteTimeUtc.ToString("o"),
                    });
                }
                if (arr.Count >= maxResults) break;
            }
            return Task.FromResult(ToolResult.Json(new JsonObject { ["folder"] = safe, ["recursive"] = recursive, ["count"] = arr.Count, ["files"] = arr }));
        }
    }
}
