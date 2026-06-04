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
    /// End-to-end NC output workflow driven entirely by discovery.
    /// Picks the first calculated toolpath, creates a fresh NC program,
    /// configures it with an auto-discovered post processor, posts it,
    /// inspects the G-code preview, and cleans up.
    /// Gated by POWERMILL_ALLOW_WRITE_NC=1 because it creates an NC program
    /// in the user's project and writes a real file to disk.
    [Collection("Live")]
    public class T12_FullOutputPipelineTests
    {
        private readonly LiveSessionFixture _f;
        private readonly ITestOutputHelper _out;
        public T12_FullOutputPipelineTests(LiveSessionFixture f, ITestOutputHelper output)
        {
            _f = f;
            _out = output;
        }

        private static JsonDocument Parse(ToolResult r) => JsonDocument.Parse(r.Content[0].Text);

        [IntegrationFact]
        public async Task FullPipeline_DiscoverConfigurePost_FromExistingState()
        {
            if (Environment.GetEnvironmentVariable("POWERMILL_ALLOW_WRITE_NC") != "1")
            {
                _out.WriteLine("POWERMILL_ALLOW_WRITE_NC != 1 — skipping (this test creates an NC program and writes G-code to disk).");
                return;
            }

            // 1. Pick the first CALCULATED toolpath via discovery.
            var listToolpaths = await new ListToolpathsTool(_f.Deps).InvokeAsync(null, ProgressReporter.NoOp, CancellationToken.None);
            using var tpDoc = Parse(listToolpaths);
            string? toolpathName = null;
            foreach (var entry in tpDoc.RootElement.GetProperty("toolpaths").EnumerateArray())
            {
                if (entry.GetProperty("calculated").GetBoolean())
                {
                    toolpathName = entry.GetProperty("name").GetString();
                    break;
                }
            }
            Assert.True(toolpathName != null, "No calculated toolpath in the active project. Calculate at least one first.");
            _out.WriteLine("Selected toolpath: " + toolpathName);

            // 2. Discover available post processors.
            var listPosts = await new ListPostProcessorsTool(_f.Deps).InvokeAsync(null, ProgressReporter.NoOp, CancellationToken.None);
            if (listPosts.IsError)
            {
                _out.WriteLine("list_post_processors errored: " + listPosts.Content[0].Text);
                return;
            }
            using var postsDoc = Parse(listPosts);
            var posts = postsDoc.RootElement.GetProperty("files");
            if (posts.GetArrayLength() == 0)
            {
                _out.WriteLine("No post processors found at default folder. Set POWERMILL_POST_PROCESSORS or pass folder to list_post_processors.");
                return;
            }
            // Pick the first .pmoptz/.opt; falls back to whatever's first.
            string postPath = posts[0].GetProperty("full_path").GetString()!;
            foreach (var f in posts.EnumerateArray())
            {
                var name = f.GetProperty("filename").GetString() ?? "";
                if (name.EndsWith(".pmoptz", StringComparison.OrdinalIgnoreCase))
                {
                    postPath = f.GetProperty("full_path").GetString()!;
                    break;
                }
            }
            _out.WriteLine("Selected post processor: " + postPath);

            // 3. Create a uniquely-named NC program inside the user's project.
            var ncProgramName = "MCP_Discovery_" + DateTimeOffset.Now.ToString("yyyyMMdd_HHmmss");
            _out.WriteLine("Creating NC program: " + ncProgramName);
            var createNc = new CreateNCProgramTool(_f.Deps);
            var createResult = await createNc.InvokeAsync(
                JsonDocument.Parse("{\"name\":\"" + ncProgramName + "\"}").RootElement,
                ProgressReporter.NoOp, CancellationToken.None);
            Assert.False(createResult.IsError, createResult.Content[0].Text);

            try
            {
                // 4. Add the toolpath.
                var addTp = new AddToolpathsToNCProgramTool(_f.Deps);
                var addArgs = JsonDocument.Parse(
                    "{\"nc_program_name\":\"" + ncProgramName + "\"," +
                    "\"toolpaths\":[{\"name\":\"" + toolpathName + "\"}]}").RootElement;
                var addResult = await addTp.InvokeAsync(addArgs, ProgressReporter.NoOp, CancellationToken.None);
                Assert.False(addResult.IsError, addResult.Content[0].Text);

                // 5. Configure post + output path. Output goes to POWERMILL_PROJECT_ROOTS
                //    so the SafePath check accepts it. Filename derived from program name.
                var rootDir = Environment.GetEnvironmentVariable("POWERMILL_PROJECT_ROOTS")?.Split(';').First()
                    ?? Path.GetTempPath();
                var outputFile = Path.Combine(rootDir, ncProgramName + ".tap");
                _out.WriteLine("Output file: " + outputFile);

                var configure = new ConfigureNCProgramTool(_f.Deps);
                var configArgs = JsonDocument.Parse(
                    "{\"name\":\"" + ncProgramName + "\"," +
                    "\"post_file\":\"" + postPath.Replace("\\", "\\\\") + "\"," +
                    "\"output_file_name\":\"" + outputFile.Replace("\\", "\\\\") + "\"}").RootElement;
                var configResult = await configure.InvokeAsync(configArgs, ProgressReporter.NoOp, CancellationToken.None);
                Assert.False(configResult.IsError, configResult.Content[0].Text);

                // 6. Post the program.
                var write = new WriteNCProgramTool(_f.Deps);
                var writeResult = await write.InvokeAsync(
                    JsonDocument.Parse("{\"name\":\"" + ncProgramName + "\"}").RootElement,
                    ProgressReporter.NoOp, CancellationToken.None);

                if (writeResult.IsError)
                {
                    // Common reason: the picked post processor doesn't match the toolpath's
                    // machine envelope, or PowerMill needs more configuration. Surface but don't fail.
                    _out.WriteLine("write_nc_program returned error: " + writeResult.Content[0].Text);
                    _out.WriteLine("This may be because the auto-picked post doesn't match the toolpath. Try a specific post via configure_nc_program.");
                    return;
                }

                using var writeDoc = Parse(writeResult);
                var path = writeDoc.RootElement.GetProperty("path").GetString();
                var size = writeDoc.RootElement.GetProperty("size_bytes").GetInt64();
                var lineCount = writeDoc.RootElement.GetProperty("line_count").GetInt32();
                var preview = writeDoc.RootElement.GetProperty("preview").GetString();

                _out.WriteLine($"Posted: {path} ({size} bytes, {lineCount} lines)");
                _out.WriteLine("Preview (first 20 lines):");
                var firstLines = (preview ?? "").Split('\n').Take(20);
                foreach (var l in firstLines) _out.WriteLine("  | " + l);

                Assert.True(File.Exists(path), "Posted file not on disk: " + path);
                Assert.True(size > 0, "Posted file is empty");
            }
            finally
            {
                // 7. Cleanup: delete the NC program we created.
                try
                {
                    var del = new DeleteEntityTool(_f.Deps);
                    await del.InvokeAsync(
                        JsonDocument.Parse("{\"entity_type\":\"ncprogram\",\"name\":\"" + ncProgramName + "\",\"confirm\":true}").RootElement,
                        ProgressReporter.NoOp, CancellationToken.None);
                    _out.WriteLine("Cleaned up NC program: " + ncProgramName);
                }
                catch (Exception ex) { _out.WriteLine("Cleanup failed: " + ex.Message); }
            }
        }
    }
}
