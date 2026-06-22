using System;
using System.Collections.Generic;

namespace PowerMillMcpServer.Tools
{
    /// Allowlist of valid PowerMill toolpath strategy names. Mirrors the switch
    /// in PMToolpathEntityFactory.cs. Used by create_toolpath to refuse anything
    /// not on the list — without this check, the strategy parameter is
    /// concatenated into a macro and an attacker (or hallucinating LLM) can
    /// inject arbitrary commands.
    public static class ToolpathStrategyAllowlist
    {
        public static readonly IReadOnlyCollection<string> All = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "raster", "radial", "spiral", "pattern", "com_pattern", "com_boundary",
            "constantz", "offset_3d", "pencil_corner", "stitch_corner",
            "automatic_corner", "along_corner", "multi_pencil_corner", "rotary",
            "point_projection", "line_projection", "plane_projection", "curve_projection",
            "profile", "opti_constz", "inter_constz", "swarf", "surface_proj",
            "embedded", "raster_area_clear", "offset_area_clear", "profile_area_clear",
            "drill", "wireframe_swarf", "raster_flat", "offset_flat", "plunge",
            "parametric_offset", "surface_machine", "port_area_clear", "port_plunge",
            "port_spiral", "method", "blisk", "blisk_hub", "blisk_blade",
            "disc_profile", "curve_profile", "curve_area_clear", "face", "chamfer",
            "wireframe_profile", "corner_clear", "edge_break", "flowline",
            "parametric_spiral", "adaptive_area_clear", "rib", "blade",
            "feature_face", "feature_chamfer",
        };

        /// Returns null if the strategy is acceptable; otherwise an error message.
        public static string? Validate(string? strategy)
        {
            if (string.IsNullOrWhiteSpace(strategy))
                return "strategy is required";

            // Reject control characters, quotes, backslashes, semicolons, and
            // newlines BEFORE checking the allowlist — these are macro-injection
            // vectors that should never appear in any legitimate strategy name.
            foreach (var c in strategy)
            {
                if (c < 0x20 || c == 0x7F || c == '"' || c == '\\' || c == ';')
                    return "strategy contains invalid character (control / quote / backslash / semicolon): "
                        + (c < 0x20 ? "U+" + ((int)c).ToString("X4") : c.ToString());
            }

            var trimmed = (strategy ?? "").Trim();
            var set = (HashSet<string>)All;
            if (!set.Contains(trimmed))
            {
                return "Unknown strategy '" + trimmed + "'. Valid examples: raster, offset_area_clear, profile, drill. "
                    + "See PowerMill docs for the full list of " + All.Count + " strategies, or use run_macro.";
            }
            return null;
        }
    }

    /// Validation for entity names (tool/boundary/pattern/etc.) when they are
    /// interpolated into PowerMill macro commands inside double quotes. Names
    /// with control characters, double quotes, or backslashes can break out of
    /// quoting and inject commands.
    public static class EntityNameValidator
    {
        public static string? Validate(string? name, string parameterLabel)
        {
            if (string.IsNullOrEmpty(name)) return null; // optional fields handled by caller
            foreach (var c in name)
            {
                if (c < 0x20 || c == 0x7F || c == '"' || c == '\\')
                    return parameterLabel + " contains invalid character (control / quote / backslash): "
                        + (c < 0x20 ? "U+" + ((int)c).ToString("X4") : c.ToString());
            }
            return null;
        }
    }
}
