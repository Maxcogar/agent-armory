namespace PowerMillMcpServer.Util
{
    /// Truncate strings returned to the LLM to keep responses bounded.
    /// Tool results that include large outputs (run_macro responses, parameter
    /// dumps, NC G-code previews) flow into Claude's context window — capping
    /// is mandatory.
    public static class OutputCap
    {
        public const int DefaultMax = 100_000;

        public static string Apply(string text, int max = DefaultMax)
        {
            if (text == null) return "";
            if (text.Length <= max) return text;
            int extra = text.Length - max;
            return text.Substring(0, max) +
                   "\n[truncated, " + extra + " more chars omitted]";
        }
    }
}
