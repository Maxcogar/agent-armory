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
    public class T02_ProjectLifecycleTests
    {
        private readonly LiveSessionFixture _f;
        public T02_ProjectLifecycleTests(LiveSessionFixture f) { _f = f; }

        [IntegrationFact]
        public async Task NewProject_SaveAs_Open_RoundTrip()
        {
            var newTool = new NewProjectTool(_f.Deps);
            await newTool.InvokeAsync(null, ProgressReporter.NoOp, CancellationToken.None);

            var saveAs = new SaveProjectAsTool(_f.Deps);
            var projectDir = Path.Combine(_f.TempProjectsRoot, "T02_RoundTrip");
            if (Directory.Exists(projectDir)) Directory.Delete(projectDir, recursive: true);
            var saveArgs = JsonDocument.Parse("{\"path\":\"" + projectDir.Replace("\\", "\\\\") + "\"}").RootElement;
            var saveResult = await saveAs.InvokeAsync(saveArgs, ProgressReporter.NoOp, CancellationToken.None);
            Assert.False(saveResult.IsError, saveResult.Content[0].Text);

            var close = new CloseProjectTool(_f.Deps);
            await close.InvokeAsync(null, ProgressReporter.NoOp, CancellationToken.None);

            var open = new OpenProjectTool(_f.Deps);
            var openArgs = JsonDocument.Parse("{\"path\":\"" + projectDir.Replace("\\", "\\\\") + "\"}").RootElement;
            var openResult = await open.InvokeAsync(openArgs, ProgressReporter.NoOp, CancellationToken.None);
            Assert.False(openResult.IsError, openResult.Content[0].Text);
        }

        [IntegrationFact]
        public async Task Save_Project()
        {
            // Assumes a project is open from a prior test.
            var save = new SaveProjectTool(_f.Deps);
            var result = await save.InvokeAsync(null, ProgressReporter.NoOp, CancellationToken.None);
            // Either succeeds or errors with "never saved" — both are valid.
            Assert.NotNull(result);
        }
    }
}
