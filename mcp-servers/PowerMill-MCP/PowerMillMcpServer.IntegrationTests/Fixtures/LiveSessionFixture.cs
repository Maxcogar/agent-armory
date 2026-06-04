using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using PowerMillMcpServer.Com;
using PowerMillMcpServer.Mcp;
using PowerMillMcpServer.PowerMill;
using PowerMillMcpServer.Tools;
using PowerMillMcpServer.Util;
using Xunit;

namespace PowerMillMcpServer.IntegrationTests.Fixtures
{
    /// Shared by all integration tests via [Collection("Live")]. Constructs
    /// the StaWorker + PowerMillSession + ToolDeps once and tears them down
    /// at the end so we don't pay PowerMill's COM-attach cost per test.
    public sealed class LiveSessionFixture : IAsyncLifetime, IDisposable
    {
        public StaWorker Sta { get; private set; } = null!;
        public PowerMillSession Session { get; private set; } = null!;
        public RootsRegistry Roots { get; private set; } = null!;
        public ToolDeps Deps { get; private set; } = null!;
        public ILogger Logger { get; private set; } = null!;
        public string TempProjectsRoot { get; private set; } = null!;
        public string TestDataDir { get; private set; } = null!;

        public async Task InitializeAsync()
        {
            // Ensure the env var is honored — the runbook sets it, but be defensive.
            TempProjectsRoot = Environment.GetEnvironmentVariable("POWERMILL_PROJECT_ROOTS")
                ?? Path.Combine(Path.GetTempPath(), "powermill-integration");
            Directory.CreateDirectory(TempProjectsRoot);

            TestDataDir = Path.Combine(AppContext.BaseDirectory, "Fixtures", "TestData");

            Logger = new InMemoryLogger();
            Sta = new StaWorker();
            Session = new PowerMillSession(Sta);
            Roots = new RootsRegistry();
            Deps = new ToolDeps(Session, Roots, Logger);

            // Attach to a running PowerMill with no GUI noise.
            await Session.ConnectAsync(spawnNew: false, withGui: true, CancellationToken.None);
        }

        public async Task DisposeAsync()
        {
            try { await Session.DisconnectAsync(CancellationToken.None); } catch { }
            Session?.Dispose();
            Sta?.Dispose();
        }

        public void Dispose()
        {
            Session?.Dispose();
            Sta?.Dispose();
        }
    }

    [CollectionDefinition("Live")]
    public class LiveCollection : ICollectionFixture<LiveSessionFixture> { }
}
