# FeatureCAM MCP Server

A comprehensive Model Context Protocol (MCP) server for Autodesk FeatureCAM, enabling LLMs to interact with FeatureCAM for manufacturing automation, CAM operations, and NC code generation.

## Overview

This MCP server provides programmatic access to FeatureCAM's extensive API through well-designed tools that enable:

- **Document Management**: Get document info, save documents, manage toolpaths
- **Setup Operations**: List, configure, enable/disable setups
- **Tool Library Access**: Query tools, get detailed tool geometry and properties
- **Stock & Geometry**: Access stock data, export solids to STL
- **Feature & Operations**: List features, access operations, check for errors
- **NC Code Generation**: Generate and export NC programs
- **UCS Management**: Work with user coordinate systems
- **Work Offsets**: Access work offset data

## Requirements

### System Requirements

- **Operating System**: Windows (FeatureCAM is Windows-only)
- **FeatureCAM**: Installed and running
- **Python**: 3.8 or higher

### Python Dependencies

```bash
pip install -r requirements.txt
```

Required packages:
- `mcp>=1.1.0` - MCP Server Framework
- `pydantic>=2.0.0` - Input validation
- `pywin32>=300` - Windows COM automation

## Installation

1. **Clone or download this repository**

2. **Install dependencies**:
```bash
pip install -r requirements.txt
```

3. **Verify FeatureCAM is installed**:
   - FeatureCAM must be installed on the Windows machine
   - The server connects to a running FeatureCAM instance via COM

## Usage

### Running the Server

**Stdio Transport (Local Integration)**:
```bash
python featurecam_mcp_server.py
```

**Streamable HTTP (Remote Access)**:
Modify the last line in `featurecam_mcp_server.py`:
```python
mcp.run(transport="streamable_http", port=8000)
```

### Integration with Claude Desktop

Add to your Claude Desktop configuration (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "featurecam": {
      "command": "python",
      "args": ["C:\\path\\to\\featurecam_mcp_server.py"]
    }
  }
}
```

### Using with MCP Inspector

Test the server with MCP Inspector:

```bash
npx @modelcontextprotocol/inspector python featurecam_mcp_server.py
```

## Available Tools

### Document Operations

#### `featurecam_get_document_info`
Get comprehensive information about the active document.

**Parameters**:
- `response_format` (optional): "json" or "markdown" (default: "markdown")

**Returns**: Document name, path, part name, unit system, component counts, stock info

**Example**:
```json
{
  "response_format": "markdown"
}
```

#### `featurecam_save_document`
Save the active document.

**Parameters**:
- `filepath` (optional): Path to save to, or null for current location

**Example**:
```json
{
  "filepath": "C:\\CAM\\MyPart_v2.fm"
}
```

#### `featurecam_invalidate_toolpaths`
Invalidate all toolpaths to force recalculation.

**No parameters required**

#### `featurecam_generate_nc_code`
Generate NC code for the document or specific setup.

**Parameters**:
- `setup_name` (optional): Specific setup name, or null for all setups
- `output_directory` (optional): Output directory, or null for document directory
- `file_extension` (default: ".nc"): File extension for NC files
- `combine_setups` (default: false): Combine all setups into one file

**Example**:
```json
{
  "setup_name": null,
  "output_directory": "C:\\CAM\\Output",
  "file_extension": ".nc",
  "combine_setups": false
}
```

### Setup Management

#### `featurecam_list_setups`
List all setups in the document.

**Parameters**:
- `setup_type` (default: "all"): Filter by "all", "milling", "turning", or "wire"
- `enabled_only` (default: false): Show only enabled setups
- `response_format` (default: "markdown"): Output format

**Example**:
```json
{
  "setup_type": "milling",
  "enabled_only": true,
  "response_format": "markdown"
}
```

#### `featurecam_get_setup_details`
Get detailed information about a specific setup.

**Parameters**:
- `setup_name`: Name of the setup
- `response_format` (default: "markdown"): Output format

**Example**:
```json
{
  "setup_name": "Setup1",
  "response_format": "json"
}
```

#### `featurecam_get_active_setup`
Get the currently active setup name.

**No parameters required**

#### `featurecam_set_active_setup`
Change the active setup.

**Parameters**:
- `setup_name`: Name of setup to activate

**Example**:
```json
{
  "setup_name": "Setup2"
}
```

#### `featurecam_enable_setup`
Enable or disable a setup.

**Parameters**:
- `setup_name`: Name of the setup
- `enabled`: true to enable, false to disable

**Example**:
```json
{
  "setup_name": "Setup3",
  "enabled": false
}
```

### Stock Operations

#### `featurecam_get_stock_info`
Get stock information and program settings.

**Parameters**:
- `response_format` (default: "markdown"): Output format

**Returns**: Index type, single program settings, tool-dominant mode

#### `featurecam_export_stock`
Export stock geometry to STL file.

**Parameters**:
- `output_path`: Full path for output STL file
- `setup_name` (optional): Specific setup or null for active

**Example**:
```json
{
  "output_path": "C:\\CAM\\Export\\stock.stl",
  "setup_name": null
}
```

### Tool Library

#### `featurecam_list_tools`
List all tools in the document or setup.

**Parameters**:
- `setup_name` (optional): Filter by setup, or null for all
- `response_format` (default: "markdown"): Output format

**Returns**: Tool names, types, diameters, exposed lengths

#### `featurecam_get_tool_details`
Get detailed information about a specific tool.

**Parameters**:
- `tool_name`: Name of the tool
- `response_format` (default: "markdown"): Output format

**Returns**: Tool type, geometry, dimensions, number of flutes, angles, etc.

**Example**:
```json
{
  "tool_name": "1/2 ENDMILL",
  "response_format": "json"
}
```

### Solid/Geometry Operations

#### `featurecam_list_solids`
List all solids in the document.

**Parameters**:
- `solid_type` (default: "all"): Filter by "all", "stock", "part", "clamp", "fixture"
- `response_format` (default: "markdown"): Output format

#### `featurecam_export_solid`
Export a solid to STL file.

**Parameters**:
- `solid_name`: Name of the solid to export
- `output_path`: Full path for output STL file

**Example**:
```json
{
  "solid_name": "PartSolid1",
  "output_path": "C:\\CAM\\Export\\part.stl"
}
```

### UCS (User Coordinate Systems)

#### `featurecam_list_ucs`
List all User Coordinate Systems.

**Parameters**:
- `response_format` (default: "markdown"): Output format

#### `featurecam_get_ucs_details`
Get detailed information about a UCS.

**Parameters**:
- `ucs_name`: Name of the UCS
- `response_format` (default: "markdown"): Output format

### Features & Operations

#### `featurecam_list_features`
List all features in a setup.

**Parameters**:
- `setup_name`: Name of the setup
- `enabled_only` (default: false): Show only enabled features
- `response_format` (default: "markdown"): Output format

**Example**:
```json
{
  "setup_name": "Setup1",
  "enabled_only": false,
  "response_format": "markdown"
}
```

#### `featurecam_get_operations`
Get operations from features in a setup.

**Parameters**:
- `setup_name`: Name of the setup
- `feature_name` (optional): Specific feature, or null for all
- `response_format` (default: "markdown"): Output format

**Returns**: Operation names, tools, error status for each operation

**Example**:
```json
{
  "setup_name": "Setup1",
  "feature_name": "Hole1",
  "response_format": "json"
}
```

#### `featurecam_check_operation_errors`
Check all operations for errors.

**Parameters**:
- `setup_name` (optional): Specific setup, or null for all
- `response_format` (default: "markdown"): Output format

**Returns**: Detailed error report for any operations with errors

### Work Offsets

#### `featurecam_get_work_offsets`
Get work offset information for setups.

**Parameters**:
- `setup_name` (optional): Specific setup, or null for all
- `response_format` (default: "markdown"): Output format

## Example Workflows

### 1. Document Inspection
```
1. Get document info
2. List all setups
3. Check for operation errors
4. List all tools
```

### 2. Setup Configuration
```
1. List setups
2. Get setup details for specific setup
3. Enable/disable setups as needed
4. Set active setup
```

### 3. NC Code Generation
```
1. Check operation errors
2. Fix any errors in FeatureCAM
3. Generate NC code for all setups
4. Export stock and parts to STL for verification
```

### 4. Tool Analysis
```
1. List all tools
2. Get detailed info for specific tools
3. Analyze tool usage across operations
```

## Architecture

### COM Integration

The server uses `pywin32` to connect to FeatureCAM via COM automation:

```python
import win32com.client

app = win32com.client.Dispatch("FeatureCAM.Application")
doc = app.ActiveDocument
```

### Error Handling

All tools include comprehensive error handling:
- Connection errors (FeatureCAM not running)
- Document errors (no active document)
- API errors (invalid parameters, missing objects)
- Clear, actionable error messages

### Response Formats

Most tools support two response formats:

**JSON Format**: Structured data for programmatic processing
```json
{
  "name": "Setup1",
  "type": "milling",
  "enabled": true,
  "num_features": 5
}
```

**Markdown Format**: Human-readable with formatting
```markdown
# Setup: Setup1

## Configuration
- **Type**: Milling
- **Status**: ✓ Enabled
- **Features**: 5
```

## API Reference

Based on the [Autodesk FeatureCAM API Examples](https://github.com/Autodesk/featurecam-api-examples) repository.

### Key COM Objects

- **Application**: `FeatureCAM.Application`
- **Document**: `FMDocument` - Active document
- **Setup**: `FMSetup` - Manufacturing setup
- **Feature**: `FMFeature` - Machining feature
- **Operation**: `FMOperation` - Toolpath operation
- **Tool**: `FMTool` - Cutting tool
- **Solid**: `FMSolid` - 3D geometry
- **UCS**: `FMUcs` - Coordinate system
- **Stock**: `FMStock` - Stock material

## Troubleshooting

### "Failed to connect to FeatureCAM"
- Ensure FeatureCAM is running
- Check that you have the correct FeatureCAM version installed
- Verify COM registration: FeatureCAM should register itself on installation

### "pywin32 not available"
```bash
pip install pywin32
```

After installation, you may need to run:
```bash
python Scripts/pywin32_postinstall.py -install
```

### "No active document"
- Open a FeatureCAM file before using the tools
- Use the FeatureCAM UI to verify a document is loaded

### COM Errors
- Restart FeatureCAM
- Ensure you're not running FeatureCAM as Administrator while running the server as a normal user (or vice versa)
- Check Windows Event Viewer for COM-related errors

## Development

### Adding New Tools

1. Define Pydantic input model:
```python
class NewToolInput(BaseModel):
    param1: str = Field(..., description="Description")
```

2. Implement tool function:
```python
@mcp.tool(
    name="featurecam_new_tool",
    annotations={...}
)
async def new_tool(params: NewToolInput) -> str:
    # Implementation
    pass
```

3. Follow the existing patterns for error handling and response formatting

### Testing

Test individual tools using MCP Inspector:
```bash
npx @modelcontextprotocol/inspector python featurecam_mcp_server.py
```

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Maintain consistent code style
2. Add comprehensive docstrings
3. Include input validation with Pydantic
4. Provide both JSON and Markdown response formats where applicable
5. Test with actual FeatureCAM instances

## License

This MCP server is provided as-is for integration with Autodesk FeatureCAM. See LICENSE.txt for details.

## Acknowledgments

- Based on the [Autodesk FeatureCAM API Examples](https://github.com/Autodesk/featurecam-api-examples)
- Built with [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)
- Uses the [FastMCP](https://github.com/jlowin/fastmcp) framework

## Support

For issues specific to this MCP server, please file an issue on the repository.

For FeatureCAM API questions, refer to:
- [FeatureCAM API Examples](https://github.com/Autodesk/featurecam-api-examples)
- [Autodesk FeatureCAM Forum](https://forums.autodesk.com/t5/featurecam-forum/bd-p/276)
- [FeatureCAM Product Page](https://www.autodesk.com/products/featurecam/overview)
