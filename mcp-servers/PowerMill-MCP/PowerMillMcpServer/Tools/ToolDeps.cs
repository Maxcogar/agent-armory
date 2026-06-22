using PowerMillMcpServer.Mcp;
using PowerMillMcpServer.PowerMill;
using PowerMillMcpServer.Util;

namespace PowerMillMcpServer.Tools
{
    /// Bag of dependencies passed to every tool.
    public sealed class ToolDeps
    {
        public IPowerMillSession Session { get; }
        public RootsRegistry Roots { get; }
        public ILogger Logger { get; }

        public ToolDeps(IPowerMillSession session, RootsRegistry roots, ILogger logger)
        {
            Session = session;
            Roots = roots;
            Logger = logger;
        }
    }
}
