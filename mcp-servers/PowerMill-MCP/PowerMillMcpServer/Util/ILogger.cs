using System;

namespace PowerMillMcpServer.Util
{
    public interface ILogger
    {
        void Info(string format, params object[] args);
        void Warn(string format, params object[] args);
        void Error(string format, params object[] args);
        void Error(Exception ex, string format, params object[] args);
        string LogDirectory { get; }
    }
}
