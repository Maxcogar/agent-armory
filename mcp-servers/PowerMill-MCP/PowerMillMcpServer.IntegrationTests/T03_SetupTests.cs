using System.IO;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using PowerMillMcpServer.IntegrationTests.Fixtures;
using PowerMillMcpServer.Mcp;
using PowerMillMcpServer.Tools;
using Xunit;

namespace PowerMillMcpServer.IntegrationTests
{
    [Collection("Live")]
    public class T03_SetupTests
    {
        private readonly LiveSessionFixture _f;
        public T03_SetupTests(LiveSessionFixture f) { _f = f; }

        [IntegrationFact]
        public async Task ImportModel_TinyCube()
        {
            var stl = Path.Combine(_f.TestDataDir, "tiny_cube.stl");
            // The fixture data must be inside an allowed root for the SafePath check.
            // Copy into TempProjectsRoot before importing.
            var dest = Path.Combine(_f.TempProjectsRoot, "tiny_cube.stl");
            File.Copy(stl, dest, overwrite: true);

            var tool = new ImportModelTool(_f.Deps);
            var args = JsonDocument.Parse("{\"path\":\"" + dest.Replace("\\", "\\\\") + "\"}").RootElement;
            var result = await tool.InvokeAsync(args, ProgressReporter.NoOp, CancellationToken.None);
            Assert.False(result.IsError, result.Content[0].Text);
        }

        [IntegrationFact]
        public async Task SetUnits_MM()
        {
            var tool = new SetUnitsTool(_f.Deps);
            var args = JsonDocument.Parse("{\"units\":\"mm\"}").RootElement;
            var result = await tool.InvokeAsync(args, ProgressReporter.NoOp, CancellationToken.None);
            Assert.False(result.IsError);
        }

        [IntegrationFact]
        public async Task CreateBlock_Cylinder()
        {
            var tool = new CreateBlockTool(_f.Deps);
            var args = JsonDocument.Parse("{\"kind\":\"cylinder\",\"origin\":{\"x\":0,\"y\":0,\"z\":0},\"outer_diameter_mm\":50,\"length_mm\":100}").RootElement;
            var result = await tool.InvokeAsync(args, ProgressReporter.NoOp, CancellationToken.None);
            Assert.False(result.IsError, result.Content[0].Text);
        }

        [IntegrationFact]
        public async Task DeleteBlock()
        {
            var tool = new DeleteBlockTool(_f.Deps);
            var result = await tool.InvokeAsync(null, ProgressReporter.NoOp, CancellationToken.None);
            Assert.False(result.IsError);
        }
    }
}
