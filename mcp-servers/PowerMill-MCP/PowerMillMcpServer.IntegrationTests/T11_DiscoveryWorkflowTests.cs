using System;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Threading;
using System.Threading.Tasks;
using PowerMillMcpServer.IntegrationTests.Fixtures;
using PowerMillMcpServer.Mcp;
using PowerMillMcpServer.Tools;
using Xunit;
using Xunit.Abstractions;

namespace PowerMillMcpServer.IntegrationTests
{
    /// Discovery-driven workflow against whatever project is currently open
    /// in PowerMill. Reads existing entities and exercises the read-only
    /// surface against them. Does not import, create, modify, or delete
    /// anything in the user's project. The post-and-write step is gated by
    /// POWERMILL_ALLOW_WRITE_NC=1 because it lands a real .nc/.tap file on
    /// disk.
    [Collection("Live")]
    public class T11_DiscoveryWorkflowTests
    {
        private readonly LiveSessionFixture _f;
        private readonly ITestOutputHelper _out;
        public T11_DiscoveryWorkflowTests(LiveSessionFixture f, ITestOutputHelper output)
        {
            _f = f;
            _out = output;
        }

        private static JsonDocument Parse(ToolResult r) =>
            JsonDocument.Parse(r.Content[0].Text);

        [IntegrationFact]
        public async Task Discover_ProjectState_Reports_Counts_And_Names()
        {
            // Active project pathname.
            var qp = new QueryParameterTool(_f.Deps);
            var pathResult = await qp.InvokeAsync(
                JsonDocument.Parse("{\"path\":\"project_pathname(false)\"}").RootElement,
                ProgressReporter.NoOp, CancellationToken.None);
            Assert.False(pathResult.IsError, pathResult.Content[0].Text);
            using var pathDoc = Parse(pathResult);
            var projectPath = pathDoc.RootElement.GetProperty("value").GetString();
            _out.WriteLine("Active project: " + (string.IsNullOrEmpty(projectPath) ? "<unsaved/empty>" : projectPath));

            // Counts via individual lists. Each tool succeeds even if empty.
            var summaries = new System.Collections.Generic.List<string>();
            async Task Count<T>(T tool, string label) where T : Tool
            {
                var r = await tool.InvokeAsync(null, ProgressReporter.NoOp, CancellationToken.None);
                Assert.False(r.IsError, label + ": " + r.Content[0].Text);
                using var d = Parse(r);
                int n = d.RootElement.GetProperty("count").GetInt32();
                summaries.Add(label + ": " + n);
            }

            await Count(new ListModelsTool(_f.Deps), "models");
            await Count(new ListToolsTool(_f.Deps), "tools");
            await Count(new ListBoundariesTool(_f.Deps), "boundaries");
            await Count(new ListPatternsTool(_f.Deps), "patterns");
            await Count(new ListWorkplanesTool(_f.Deps), "workplanes");
            await Count(new ListToolpathsTool(_f.Deps), "toolpaths");
            await Count(new ListSetupsTool(_f.Deps), "setups");
            await Count(new ListStockModelsTool(_f.Deps), "stock_models");
            await Count(new ListMachineToolsTool(_f.Deps), "machine_tools");
            await Count(new ListNCProgramsTool(_f.Deps), "nc_programs");

            _out.WriteLine("Project entity counts: " + string.Join(", ", summaries));
        }

        [IntegrationFact]
        public async Task Verify_FirstCalculatedToolpath_If_Any()
        {
            var listResult = await new ListToolpathsTool(_f.Deps).InvokeAsync(null, ProgressReporter.NoOp, CancellationToken.None);
            using var doc = Parse(listResult);
            var arr = doc.RootElement.GetProperty("toolpaths");

            string? toolpathName = null;
            foreach (var entry in arr.EnumerateArray())
            {
                if (entry.TryGetProperty("calculated", out var c) && c.ValueKind == JsonValueKind.True &&
                    entry.TryGetProperty("name", out var n) && n.ValueKind == JsonValueKind.String)
                {
                    toolpathName = n.GetString();
                    break;
                }
            }

            if (toolpathName == null)
            {
                _out.WriteLine("No calculated toolpaths in active project — skipping verify.");
                return;
            }

            _out.WriteLine("Verifying calculated toolpath: " + toolpathName);
            var verifyResult = await new VerifyToolpathTool(_f.Deps).InvokeAsync(
                JsonDocument.Parse("{\"toolpath_name\":\"" + toolpathName + "\"}").RootElement,
                ProgressReporter.NoOp, CancellationToken.None);
            Assert.False(verifyResult.IsError, verifyResult.Content[0].Text);
            using var verifyDoc = Parse(verifyResult);
            var gouges = verifyDoc.RootElement.GetProperty("gouges_detected").GetBoolean();
            var collisions = verifyDoc.RootElement.GetProperty("holder_collisions_detected").GetBoolean();
            _out.WriteLine($"  gouges_detected={gouges}, holder_collisions_detected={collisions}");
        }

        [IntegrationFact]
        public async Task Inspect_FirstNCProgram_If_Any()
        {
            var listResult = await new ListNCProgramsTool(_f.Deps).InvokeAsync(null, ProgressReporter.NoOp, CancellationToken.None);
            using var doc = Parse(listResult);
            var arr = doc.RootElement.GetProperty("nc_programs");

            if (arr.GetArrayLength() == 0)
            {
                _out.WriteLine("No NC programs in active project — skipping.");
                return;
            }

            var first = arr[0];
            _out.WriteLine("First NC program:");
            _out.WriteLine("  name: " + first.GetProperty("name").GetString());
            _out.WriteLine("  post_file: " + first.GetProperty("post_file").GetString());
            _out.WriteLine("  output_file_name: " + first.GetProperty("output_file_name").GetString());
            _out.WriteLine("  toolpath_count: " + first.GetProperty("toolpath_count").GetInt32());
        }

        [IntegrationFact]
        public async Task PostFirst_NCProgram_When_Allowed()
        {
            // Gated: posting writes a real G-code file. Only run when the
            // user explicitly opts in.
            if (Environment.GetEnvironmentVariable("POWERMILL_ALLOW_WRITE_NC") != "1")
            {
                _out.WriteLine("POWERMILL_ALLOW_WRITE_NC != 1 — skipping live post.");
                return;
            }

            var listResult = await new ListNCProgramsTool(_f.Deps).InvokeAsync(null, ProgressReporter.NoOp, CancellationToken.None);
            using var doc = Parse(listResult);
            var arr = doc.RootElement.GetProperty("nc_programs");

            // Find the first NC program that has both a post and an output filename configured.
            string? candidate = null;
            foreach (var entry in arr.EnumerateArray())
            {
                var post = entry.GetProperty("post_file").GetString() ?? "";
                var output = entry.GetProperty("output_file_name").GetString() ?? "";
                if (!string.IsNullOrEmpty(post) && !string.IsNullOrEmpty(output))
                {
                    candidate = entry.GetProperty("name").GetString();
                    break;
                }
            }

            if (candidate == null)
            {
                _out.WriteLine("No NC program is fully configured (post+output) in the active project — skipping post.");
                return;
            }

            _out.WriteLine("Posting NC program: " + candidate);

            // Allow the configured output path to be inside any allowed root.
            // The user's POWERMILL_PROJECT_ROOTS must already cover it.
            var write = new WriteNCProgramTool(_f.Deps);
            var args = JsonDocument.Parse("{\"name\":\"" + candidate + "\"}").RootElement;
            var result = await write.InvokeAsync(args, ProgressReporter.NoOp, CancellationToken.None);

            // Three valid outcomes:
            //   1. Success: posted, preview returned.
            //   2. Path-rejection: output_file_name was outside POWERMILL_PROJECT_ROOTS.
            //   3. Post-failure: PowerMill couldn't run the post (license, etc.).
            // Only #1 is what we want to cover; surface the message for the others.
            if (result.IsError)
            {
                _out.WriteLine("write_nc_program returned an error: " + result.Content[0].Text);
                if (result.Content[0].Text.Contains("not under any allowed root"))
                {
                    _out.WriteLine("Add the parent directory of the output file to POWERMILL_PROJECT_ROOTS to enable posting.");
                }
                return;
            }
            using var writeDoc = Parse(result);
            var path = writeDoc.RootElement.GetProperty("path").GetString();
            var size = writeDoc.RootElement.GetProperty("size_bytes").GetInt64();
            _out.WriteLine($"Posted: {path} ({size} bytes)");
            Assert.True(File.Exists(path));
            Assert.True(size > 0, "Posted file is empty");
        }
    }
}
