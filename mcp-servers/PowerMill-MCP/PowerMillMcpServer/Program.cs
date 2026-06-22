using System;
using System.Threading;
using System.Threading.Tasks;
using PowerMillMcpServer.Com;
using PowerMillMcpServer.Mcp;
using PowerMillMcpServer.PowerMill;
using PowerMillMcpServer.Tools;
using PowerMillMcpServer.Util;

namespace PowerMillMcpServer
{
    public static class Program
    {
        public const string ServerName = "powermill";
        public const string ServerVersion = "0.2.0";

        public static int Main(string[] args)
        {
            // A1: stdout is the JSON-RPC channel. Anything written to Console.Out
            // by app or library code corrupts the protocol. Redirect first.
            // StdioTransport opens its own stream over Console.OpenStandardOutput()
            // so this only affects stray writes, not protocol writes.
            Console.SetOut(Console.Error);

            // Initialize logging first so the rest of startup is captured.
            try
            {
                Logger.SetInstance(new FileLogger());
            }
            catch (Exception ex)
            {
                // FileLogger construction itself can't fail (just stores the path),
                // but if it ever does, we keep going with NullLogger.
                Console.Error.WriteLine("[powermill-mcp] FileLogger init failed: " + ex.Message);
            }

            Logger.Info("PowerMillMcpServer starting (v{0})", ServerVersion);
            RunStartupSelfCheck();

            try
            {
                using var sta = new StaWorker();
                using var session = new PowerMillSession(sta);
                var roots = new RootsRegistry();

                var deps = new ToolDeps(session, roots, Logger.Instance);

                var registry = new ToolRegistry();
                ToolRegistration.RegisterAll(registry, deps);

                using var transport = new StdioTransport();
                var cts = new CancellationTokenSource();
                Console.CancelKeyPress += (_, e) => { e.Cancel = true; cts.Cancel(); };

                var server = new McpServer(transport, registry, roots, ServerName, ServerVersion, cts.Token);

                server.RunAsync().GetAwaiter().GetResult();
                Logger.Info("PowerMillMcpServer exited cleanly");
                return 0;
            }
            catch (OperationCanceledException)
            {
                Logger.Info("PowerMillMcpServer cancelled");
                return 0;
            }
            catch (Exception ex)
            {
                Logger.Error(ex, "PowerMillMcpServer fatal");
                Console.Error.WriteLine("[powermill-mcp] fatal: " + ex);
                return 1;
            }
        }

        /// Eagerly probe the Delcam DLLs so missing assembly references
        /// (e.g. WPF orphan refs in Delcam.Utilities) surface in the log on
        /// startup rather than mid-tool-call, hours later. Each probe is in
        /// its own try/catch so partial success is logged as such.
        private static void RunStartupSelfCheck()
        {
            int ok = 0, fail = 0;
            void Probe(string label, Action body)
            {
                try { body(); Logger.Info("Self-check OK: {0}", label); ok++; }
                catch (Exception ex) { Logger.Error(ex, "Self-check FAILED: {0}", label); fail++; }
            }

            Probe("Autodesk.FileSystem.Directory load",
                () => { var t = typeof(Autodesk.FileSystem.Directory); _ = t.FullName; });
            Probe("Autodesk.FileSystem.Directory construct",
                () => { var d = new Autodesk.FileSystem.Directory(System.IO.Path.GetTempPath()); _ = d.Path; });
            Probe("Autodesk.Geometry.Point construct",
                () => { var p = new Autodesk.Geometry.Point(0, 0, 0); _ = p.X; });
            Probe("Autodesk.ProductInterface.PowerMILL.PMAutomation type",
                () => { var t = typeof(Autodesk.ProductInterface.PowerMILL.PMAutomation); _ = t.FullName; });

            if (fail == 0)
                Logger.Info("Startup self-check OK ({0} probes passed)", ok);
            else
                Logger.Error("Startup self-check had {0} failures, {1} passed — Delcam DLLs may not load correctly. Check that all *.dll files are present alongside PowerMillMcpServer.exe.", fail, ok);
        }
    }
}
