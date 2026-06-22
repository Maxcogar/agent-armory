using System;

namespace PowerMillMcpServer.Util
{
    /// No-op ILogger. Used as the default before Logger.SetInstance is called,
    /// so any startup-order race results in dropped log lines rather than NRE.
    public sealed class NullLogger : ILogger
    {
        public string LogDirectory => "<null>";
        public void Info(string format, params object[] args) { }
        public void Warn(string format, params object[] args) { }
        public void Error(string format, params object[] args) { }
        public void Error(Exception ex, string format, params object[] args) { }
    }
}
