using System;

namespace PowerMillMcpServer.Util
{
    public enum LogLevel { Info, Warn, Error }

    /// Static facade that delegates to a configured ILogger instance.
    /// Existing call sites Logger.Info(...) etc. continue to work.
    /// Set the implementation at startup via Logger.SetInstance.
    public static class Logger
    {
        private static ILogger _instance = new NullLogger();

        public static ILogger Instance => _instance;

        public static void SetInstance(ILogger logger)
        {
            _instance = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public static string LogDirectory => _instance.LogDirectory;

        public static void Info(string format, params object[] args) => _instance.Info(format, args);
        public static void Warn(string format, params object[] args) => _instance.Warn(format, args);
        public static void Error(string format, params object[] args) => _instance.Error(format, args);
        public static void Error(Exception ex, string format, params object[] args) => _instance.Error(ex, format, args);
    }
}
