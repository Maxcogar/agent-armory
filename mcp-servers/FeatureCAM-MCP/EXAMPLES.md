# FeatureCAM MCP Server - Example Usage Scenarios

This document provides practical examples of how to use the FeatureCAM MCP server with an LLM like Claude.

## Prerequisites

1. FeatureCAM is running with a document open
2. The MCP server is configured in your MCP client
3. You're interacting through an MCP-enabled client (e.g., Claude Desktop)

## Example Scenarios

### Scenario 1: Project Overview and Health Check

**User Request**: "Give me a complete overview of my current FeatureCAM project and check for any errors"

**Tool Sequence**:

1. **Get Document Info**
```json
Tool: featurecam_get_document_info
Parameters: {
  "response_format": "markdown"
}
```

2. **Check for Operation Errors**
```json
Tool: featurecam_check_operation_errors
Parameters: {
  "setup_name": null,
  "response_format": "markdown"
}
```

3. **List All Setups**
```json
Tool: featurecam_list_setups
Parameters: {
  "setup_type": "all",
  "enabled_only": false,
  "response_format": "markdown"
}
```

**Expected Output**: 
- Document name, path, and component counts
- List of any operation errors that need fixing
- Overview of all setups with their status

---

### Scenario 2: Setup Configuration Review

**User Request**: "Show me details about all my milling setups and their tools"

**Tool Sequence**:

1. **List Milling Setups**
```json
Tool: featurecam_list_setups
Parameters: {
  "setup_type": "milling",
  "enabled_only": true,
  "response_format": "markdown"
}
```

2. **Get Setup Details** (for each setup)
```json
Tool: featurecam_get_setup_details
Parameters: {
  "setup_name": "Setup1",
  "response_format": "markdown"
}
```

3. **List Features** (for each setup)
```json
Tool: featurecam_list_features
Parameters: {
  "setup_name": "Setup1",
  "enabled_only": true,
  "response_format": "markdown"
}
```

4. **List Tools**
```json
Tool: featurecam_list_tools
Parameters: {
  "setup_name": "Setup1",
  "response_format": "markdown"
}
```

---

### Scenario 3: Tool Analysis

**User Request**: "What tools am I using and give me details on the endmills"

**Tool Sequence**:

1. **List All Tools**
```json
Tool: featurecam_list_tools
Parameters: {
  "setup_name": null,
  "response_format": "markdown"
}
```

2. **Get Tool Details** (for each endmill identified)
```json
Tool: featurecam_get_tool_details
Parameters: {
  "tool_name": "1/2 ENDMILL",
  "response_format": "json"
}
```

**Expected Output**:
- Complete list of all tools used in the document
- Detailed specifications for each endmill including:
  - Diameter
  - Number of flutes
  - Corner radius
  - Exposed length
  - Metric/Imperial units

---

### Scenario 4: NC Code Generation Workflow

**User Request**: "Generate NC code for all enabled setups after checking for errors"

**Tool Sequence**:

1. **Check for Errors First**
```json
Tool: featurecam_check_operation_errors
Parameters: {
  "setup_name": null,
  "response_format": "markdown"
}
```

2. **If no errors, invalidate toolpaths**
```json
Tool: featurecam_invalidate_toolpaths
Parameters: {}
```

3. **Generate NC Code**
```json
Tool: featurecam_generate_nc_code
Parameters: {
  "setup_name": null,
  "output_directory": "C:\\CAM\\NC_Output",
  "file_extension": ".nc",
  "combine_setups": false
}
```

4. **Save Document**
```json
Tool: featurecam_save_document
Parameters: {
  "filepath": null
}
```

**Expected Output**:
- Error check report (hopefully "No errors found")
- Confirmation of toolpath invalidation
- List of generated NC files with their paths
- Confirmation of document save

---

### Scenario 5: Export for Simulation/Verification

**User Request**: "Export my stock and all part solids to STL files for verification"

**Tool Sequence**:

1. **Get Stock Info**
```json
Tool: featurecam_get_stock_info
Parameters: {
  "response_format": "json"
}
```

2. **Export Stock**
```json
Tool: featurecam_export_stock
Parameters: {
  "output_path": "C:\\CAM\\Verification\\stock.stl",
  "setup_name": null
}
```

3. **List All Solids**
```json
Tool: featurecam_list_solids
Parameters: {
  "solid_type": "all",
  "response_format": "json"
}
```

4. **Export Each Part Solid**
```json
Tool: featurecam_export_solid
Parameters: {
  "solid_name": "PartSolid1",
  "output_path": "C:\\CAM\\Verification\\part1.stl"
}
```

---

### Scenario 6: Setup Management

**User Request**: "Disable Setup3 and make Setup2 the active setup"

**Tool Sequence**:

1. **Disable Setup3**
```json
Tool: featurecam_enable_setup
Parameters: {
  "setup_name": "Setup3",
  "enabled": false
}
```

2. **Set Active Setup to Setup2**
```json
Tool: featurecam_set_active_setup
Parameters: {
  "setup_name": "Setup2"
}
```

3. **Verify Active Setup**
```json
Tool: featurecam_get_active_setup
Parameters: {}
```

**Expected Output**:
- Confirmation that Setup3 is disabled
- Confirmation that Setup2 is now active
- Verification showing "Active setup: Setup2"

---

### Scenario 7: Feature and Operation Deep Dive

**User Request**: "Show me all operations in Setup1 and identify any that have errors"

**Tool Sequence**:

1. **List Features in Setup1**
```json
Tool: featurecam_list_features
Parameters: {
  "setup_name": "Setup1",
  "enabled_only": false,
  "response_format": "markdown"
}
```

2. **Get All Operations**
```json
Tool: featurecam_get_operations
Parameters: {
  "setup_name": "Setup1",
  "feature_name": null,
  "response_format": "markdown"
}
```

**Expected Output**:
- List of all features in Setup1 with their enabled status
- Detailed list of operations showing:
  - Feature name
  - Operation name
  - Tool used
  - Error status (✓ OK or ⚠️ HAS ERRORS)
  - Specific error messages for any problematic operations

---

### Scenario 8: Coordinate System Review

**User Request**: "What UCS (User Coordinate Systems) are defined in my document?"

**Tool Sequence**:

1. **List All UCS**
```json
Tool: featurecam_list_ucs
Parameters: {
  "response_format": "markdown"
}
```

2. **Get Details for Specific UCS**
```json
Tool: featurecam_get_ucs_details
Parameters: {
  "ucs_name": "UCS1",
  "response_format": "markdown"
}
```

---

### Scenario 9: Multi-Setup NC Generation

**User Request**: "Generate separate NC files for each setup, but combine all operations into a single file"

**Tool Sequence**:

1. **Check Operation Errors**
```json
Tool: featurecam_check_operation_errors
Parameters: {
  "setup_name": null,
  "response_format": "markdown"
}
```

2. **Generate Combined NC Code**
```json
Tool: featurecam_generate_nc_code
Parameters: {
  "setup_name": null,
  "output_directory": "C:\\CAM\\Combined_Output",
  "file_extension": ".nc",
  "combine_setups": true
}
```

---

### Scenario 10: Tool Inventory Report

**User Request**: "Create a complete tool inventory report showing all tools, their types, and specifications"

**Tool Sequence**:

1. **List All Tools**
```json
Tool: featurecam_list_tools
Parameters: {
  "setup_name": null,
  "response_format": "json"
}
```

2. **Get Details for Each Tool** (iterating through the list)
```json
Tool: featurecam_get_tool_details
Parameters: {
  "tool_name": "TOOL_NAME_HERE",
  "response_format": "json"
}
```

**Expected Output**:
A comprehensive report showing:
- Total number of tools
- Tool types (EndMill, Drill, Tap, etc.)
- Dimensions (diameter, length)
- Cutting parameters (flutes, angles)
- Metric/Imperial units

---

## Advanced Workflows

### Pre-Flight Check Before Production

```
1. Get document info → Verify correct file
2. Check operation errors → Must be zero
3. List all setups → Verify setup configuration
4. List all tools → Verify tool availability
5. Get stock info → Verify material setup
6. Generate NC code → Only if all checks pass
7. Export stock and parts to STL → For verification
8. Save document → Preserve changes
```

### Setup Comparison

```
1. Get setup details for Setup1
2. Get setup details for Setup2
3. Get operations for Setup1
4. Get operations for Setup2
5. List tools for Setup1
6. List tools for Setup2
→ Compare tooling, operation counts, complexity
```

### Error Investigation and Resolution

```
1. Check operation errors
2. For each error:
   a. Get operation details
   b. Get tool details for that operation
   c. Get feature details
3. Identify patterns (tool issues, geometry problems, etc.)
4. Provide recommendations for fixes
```

---

## Tips for Effective Usage

### 1. Always Check for Errors First
Before generating NC code or making changes, run `featurecam_check_operation_errors` to ensure there are no issues.

### 2. Use JSON for Programmatic Processing
When you need to process the results further or extract specific data, use `response_format: "json"`.

### 3. Use Markdown for Human Review
When you want a readable report, use `response_format: "markdown"`.

### 4. Combine Related Queries
Group related tool calls together for efficiency:
- Get document info + list setups + check errors = Project overview
- List features + get operations = Setup analysis
- List tools + get tool details = Tool inventory

### 5. Save After Making Changes
After using tools that modify the document (enable/disable setups, set active setup), save the document to preserve changes.

### 6. Verify Paths Exist
Before exporting files, ensure the output directories exist or the tools will create them.

### 7. Handle Errors Gracefully
The tools provide clear error messages. Read them carefully:
- "No active document" → Open a file in FeatureCAM first
- "Setup not found" → Check the exact setup name with list_setups
- "Failed to connect" → Ensure FeatureCAM is running

---

## Common Conversational Patterns

### "What's in my document?"
→ Get document info + List setups + Check errors

### "Tell me about Setup1"
→ Get setup details + List features + Get operations + List tools

### "Generate NC code"
→ Check errors + (fix if needed) + Invalidate toolpaths + Generate NC + Save

### "What tools do I need?"
→ List tools + Get details for each tool type

### "Is everything ready for production?"
→ Check errors + Verify all setups enabled + List tools + Get stock info

### "Export for simulation"
→ Export stock + Export all part solids + Generate NC code

---

## Integration with External Tools

The STL export capabilities enable integration with:

- **Vericut**: Import stock and parts for toolpath verification
- **NCSimul**: Simulate machining with exported geometry
- **CAMplete**: Verify and optimize NC programs
- **EUREKA**: Advanced simulation and verification

The NC code generation integrates with:

- **Post processors**: Custom formatting via FeatureCAM settings
- **CAM verification tools**: Use generated NC for validation
- **Machine simulators**: Test programs before production

---

## Best Practices

1. **Start with Overview**: Always begin by getting document info and checking for errors
2. **Work Hierarchically**: Document → Setups → Features → Operations → Tools
3. **Verify Before Changes**: Check current state before making modifications
4. **Save Frequently**: Save the document after making configuration changes
5. **Export for Backup**: Regularly export critical geometry to STL
6. **Test Before Production**: Use error checking and verification tools
7. **Document Your Workflow**: Create consistent processes using these tools

---

## Troubleshooting Common Issues

### Issue: "No active document"
**Solution**: Open a FeatureCAM file before using the tools

### Issue: "Setup not found"
**Solution**: Use `featurecam_list_setups` to get exact setup names (case-sensitive)

### Issue: "Operation has errors"
**Solution**: 
1. Use `featurecam_check_operation_errors` to identify the errors
2. Fix them in FeatureCAM UI
3. Run the check again to verify

### Issue: "NC generation failed"
**Solution**: 
1. Check for operation errors
2. Verify post processor settings in FeatureCAM
3. Ensure output directory exists and is writable

### Issue: "Tool not found"
**Solution**: Use `featurecam_list_tools` to get exact tool names

---

This examples file should give you a comprehensive understanding of how to effectively use the FeatureCAM MCP server!
