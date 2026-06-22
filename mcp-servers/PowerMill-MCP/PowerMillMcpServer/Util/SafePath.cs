using System;
using System.Collections.Generic;
using System.IO;
using System.Security;

namespace PowerMillMcpServer.Util
{
    /// Path containment check for user-supplied paths.
    /// Refuses any path that doesn't resolve to inside one of the allowed roots.
    /// Handles symlinks and ".." traversal via Path.GetFullPath canonicalization.
    public static class SafePath
    {
        public static string Resolve(IReadOnlyList<string> allowedRoots, string userPath)
        {
            if (string.IsNullOrWhiteSpace(userPath))
                throw new ArgumentException("Path is empty", nameof(userPath));

            string fullPath;
            try { fullPath = Path.GetFullPath(userPath); }
            catch (Exception ex)
            {
                throw new SecurityException("Invalid path: " + ex.Message);
            }

            if (allowedRoots == null || allowedRoots.Count == 0)
                throw new SecurityException("No allowed roots configured. Set POWERMILL_PROJECT_ROOTS or have the host advertise roots.");

            foreach (var root in allowedRoots)
            {
                if (string.IsNullOrWhiteSpace(root)) continue;
                if (IsContained(root, fullPath)) return fullPath;
            }

            throw new SecurityException(
                "Path is not under any allowed root. Path: '" + fullPath + "'. " +
                "Allowed roots: " + string.Join("; ", allowedRoots));
        }

        /// Read-only variant: accepts paths under projectRoots OR systemRoots.
        /// Use this for tools that only scan/list and never write — e.g.,
        /// list_post_processors against the Autodesk install folder.
        public static string ResolveReadOnly(IReadOnlyList<string> projectRoots, IReadOnlyList<string> systemRoots, string userPath)
        {
            if (string.IsNullOrWhiteSpace(userPath))
                throw new ArgumentException("Path is empty", nameof(userPath));

            string fullPath;
            try { fullPath = Path.GetFullPath(userPath); }
            catch (Exception ex) { throw new SecurityException("Invalid path: " + ex.Message); }

            if ((projectRoots == null || projectRoots.Count == 0) &&
                (systemRoots == null || systemRoots.Count == 0))
                throw new SecurityException("No allowed roots configured.");

            if (projectRoots != null)
                foreach (var root in projectRoots)
                    if (!string.IsNullOrWhiteSpace(root) && IsContained(root, fullPath)) return fullPath;

            if (systemRoots != null)
                foreach (var root in systemRoots)
                    if (!string.IsNullOrWhiteSpace(root) && IsContained(root, fullPath)) return fullPath;

            throw new SecurityException(
                "Path is not under any allowed root (project or system). Path: '" + fullPath + "'. " +
                "Project roots: " + string.Join("; ", projectRoots ?? (IReadOnlyList<string>)Array.Empty<string>()) + ". " +
                "System roots: " + string.Join("; ", systemRoots ?? (IReadOnlyList<string>)Array.Empty<string>()));
        }

        public static bool IsContained(string root, string fullPath)
        {
            string fullRoot;
            try { fullRoot = Path.GetFullPath(root); }
            catch { return false; }

            // Normalize trailing separators on the root so the boundary check
            // is unambiguous: root must be either equal to fullPath, or a
            // strict prefix followed by a path separator.
            char sep = Path.DirectorySeparatorChar;
            char altSep = Path.AltDirectorySeparatorChar;
            fullRoot = fullRoot.TrimEnd(sep, altSep);

            // OrdinalIgnoreCase is correct on Windows because GetFullPath
            // returns the canonical-cased path; the StartsWith check then
            // resists case-folding tricks.
            if (string.Equals(fullPath, fullRoot, StringComparison.OrdinalIgnoreCase))
                return true;

            var withSep = fullRoot + sep;
            if (fullPath.StartsWith(withSep, StringComparison.OrdinalIgnoreCase))
                return true;

            return false;
        }
    }
}
