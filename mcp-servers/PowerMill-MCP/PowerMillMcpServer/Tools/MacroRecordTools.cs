using System;
using System.IO;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading;
using System.Threading.Tasks;
using PowerMillMcpServer.Mcp;
using PowerMillMcpServer.Util;

namespace PowerMillMcpServer.Tools
{
    /// Wraps PMAutomation.RecordMacro / StopMacroRecording. The recorded .mac
    /// file IS the verified PowerMill macro syntax for whatever you did in the
    /// GUI. Use it to discover the right macro for any operation that the
    /// typed surface doesn't cover.
    public sealed class StartMacroRecordingTool : Tool
    {
        private readonly ToolDeps _deps;
        public StartMacroRecordingTool(ToolDeps deps) { _deps = deps; }

        public override string Name => "start_macro_recording";
        public override string Description =>
            "Start recording a PowerMill macro. Subsequent GUI actions are captured to a .mac file. " +
            "Use to discover the exact macro syntax for an operation — record yourself doing the GUI flow once, " +
            "then read the resulting .mac to see what commands PowerMill emitted. " +
            "Provide output_path (must be inside an allowed root, will be created/overwritten). " +
            "Returns the full path that recording will write to. " +
            "When NOT to use: if the operation is already covered by a typed tool, use that. Use stop_macro_recording when done.";
        public override JsonObject InputSchema => new JsonObject
        {
            ["type"] = "object",
            ["properties"] = new JsonObject
            {
                ["output_path"] = new JsonObject { ["type"] = "string", ["description"] = "Absolute path for the .mac file. Will be overwritten if it exists." },
            },
            ["required"] = new JsonArray { "output_path" },
            ["additionalProperties"] = false,
        };
        public override JsonObject Annotations => Schemas.Action(idempotent: false);

        public override async Task<ToolResult> InvokeAsync(JsonElement? args, ProgressReporter progress, CancellationToken ct)
        {
            var path = GetString(args, "output_path");
            if (string.IsNullOrEmpty(path)) return ToolResult.Error("Missing required parameter: output_path");
            string safe;
            try { safe = SafePath.Resolve(_deps.Roots.AllowedRoots, path!); }
            catch (Exception ex) { return ToolResult.Error(ex.Message); }

            // Ensure parent directory exists — PowerMill won't create it.
            var parent = Path.GetDirectoryName(safe);
            if (!string.IsNullOrEmpty(parent) && !Directory.Exists(parent))
                Directory.CreateDirectory(parent);

            await _deps.Session.WithPowerMillAsync(pm =>
            {
                pm.RecordMacro(safe);
            }, ct).ConfigureAwait(false);

            return ToolResult.Json(new JsonObject
            {
                ["recording"] = true,
                ["output_path"] = safe,
                ["next_step"] = "Now perform the GUI operation in PowerMill. Call stop_macro_recording when done.",
            });
        }
    }

    public sealed class StopMacroRecordingTool : Tool
    {
        private readonly ToolDeps _deps;
        public StopMacroRecordingTool(ToolDeps deps) { _deps = deps; }

        public override string Name => "stop_macro_recording";
        public override string Description =>
            "Stop recording the PowerMill macro and return its contents. " +
            "Provide output_path (the same path passed to start_macro_recording — used to read the file back). " +
            "Returns the path, line count, size, and contents (capped at 100K chars). " +
            "When NOT to use: if you didn't start recording, this is a no-op error.";
        public override JsonObject InputSchema => new JsonObject
        {
            ["type"] = "object",
            ["properties"] = new JsonObject
            {
                ["output_path"] = new JsonObject { ["type"] = "string", ["description"] = "Same path passed to start_macro_recording." },
            },
            ["required"] = new JsonArray { "output_path" },
            ["additionalProperties"] = false,
        };
        public override JsonObject Annotations => Schemas.Action(idempotent: true);

        public override async Task<ToolResult> InvokeAsync(JsonElement? args, ProgressReporter progress, CancellationToken ct)
        {
            var path = GetString(args, "output_path");
            if (string.IsNullOrEmpty(path)) return ToolResult.Error("Missing required parameter: output_path");
            string safe;
            try { safe = SafePath.Resolve(_deps.Roots.AllowedRoots, path!); }
            catch (Exception ex) { return ToolResult.Error(ex.Message); }

            await _deps.Session.WithPowerMillAsync(pm =>
            {
                pm.StopMacroRecording();
            }, ct).ConfigureAwait(false);

            // Give PowerMill a beat to flush the .mac file to disk before we read.
            try { await Task.Delay(TimeSpan.FromMilliseconds(200), ct).ConfigureAwait(false); }
            catch (OperationCanceledException) { throw; }

            if (!File.Exists(safe))
                return ToolResult.Error("Recording stopped but no .mac file found at: " + safe);

            var text = File.ReadAllText(safe);
            var lineCount = text.Length == 0 ? 0 : text.Split('\n').Length;
            var size = new FileInfo(safe).Length;

            return ToolResult.Json(new JsonObject
            {
                ["recording"] = false,
                ["path"] = safe,
                ["size_bytes"] = size,
                ["line_count"] = lineCount,
                ["contents"] = OutputCap.Apply(text),
            });
        }
    }
}
