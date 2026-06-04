using System.IO;
using PowerMillMcpServer.Mcp;
using PowerMillMcpServer.Tools;
using PowerMillMcpServer.Util;

namespace PowerMillMcpServer.Tests.Fakes
{
    /// Builds a ToolDeps wired with a FakePowerMillSession and an
    /// InMemoryLogger, with POWERMILL_PROJECT_ROOTS pointed at a writable
    /// temp directory. Tests that need different roots can supply them.
    public static class TestDeps
    {
        public static (ToolDeps deps, FakePowerMillSession session, InMemoryLogger logger, string tempRoot) Build(string? rootOverride = null)
        {
            var session = new FakePowerMillSession { ConnectedNow = true };
            var logger = new InMemoryLogger();

            var tempRoot = rootOverride ?? Path.Combine(Path.GetTempPath(), "powermill-tests-" + System.Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(tempRoot);

            var prev = System.Environment.GetEnvironmentVariable("POWERMILL_PROJECT_ROOTS");
            System.Environment.SetEnvironmentVariable("POWERMILL_PROJECT_ROOTS", tempRoot);
            try
            {
                var roots = new RootsRegistry();
                var deps = new ToolDeps(session, roots, logger);
                return (deps, session, logger, tempRoot);
            }
            finally
            {
                System.Environment.SetEnvironmentVariable("POWERMILL_PROJECT_ROOTS", prev);
            }
        }
    }
}
