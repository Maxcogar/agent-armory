# FeatureCAM MCP Server - Deployment & Testing Guide

## Quick Start Deployment

### Option 1: Automated Setup (Recommended)

1. **Run the setup script**:
```cmd
setup.bat
```

This will:
- Check Python version
- Install all dependencies
- Configure pywin32
- Verify FeatureCAM installation

2. **Test the server**:
```cmd
python featurecam_mcp_server.py
```

### Option 2: Manual Setup

1. **Install dependencies**:
```cmd
pip install -r requirements.txt
```

2. **Configure pywin32**:
```cmd
python Scripts/pywin32_postinstall.py -install
```

3. **Verify installation**:
```cmd
python -c "import win32com.client; print('✓ pywin32 OK')"
```

## Integration Methods

### Method 1: Claude Desktop (Recommended for Development)

1. **Locate your Claude Desktop config file**:
```
%APPDATA%\Claude\claude_desktop_config.json
```

2. **Add the MCP server**:
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

3. **Restart Claude Desktop**

4. **Verify integration**:
Open Claude Desktop and ask: "List the available FeatureCAM tools"

### Method 2: MCP Inspector (for Development & Testing)

1. **Install MCP Inspector** (if not already installed):
```cmd
npm install -g @modelcontextprotocol/inspector
```

2. **Launch Inspector with server**:
```cmd
npx @modelcontextprotocol/inspector python featurecam_mcp_server.py
```

3. **Open browser**: http://localhost:5173

4. **Test tools**:
   - View all available tools
   - Call tools with parameters
   - Inspect responses
   - Debug issues

### Method 3: Streamable HTTP (for Remote Access)

1. **Modify server to use HTTP transport**:

In `featurecam_mcp_server.py`, change the last line:
```python
if __name__ == "__main__":
    mcp.run(transport="streamable_http", port=8000)
```

2. **Run the server**:
```cmd
python featurecam_mcp_server.py
```

3. **Server will be available at**: http://localhost:8000

4. **Configure client** to connect to the HTTP endpoint

## Testing Procedures

### Pre-Test Setup

1. **Start FeatureCAM**
2. **Open a test document** (or create a simple part)
3. **Verify document has**:
   - At least one setup
   - Some features and operations
   - Tools assigned

### Basic Functionality Tests

#### Test 1: Connection Test
```
Tool: featurecam_get_document_info
Expected: Returns document information
```

**Success Criteria**: 
- No connection errors
- Returns valid document name, path, and counts

#### Test 2: Setup Management
```
1. Tool: featurecam_list_setups
2. Tool: featurecam_get_active_setup
3. Tool: featurecam_get_setup_details (with a setup name from step 1)
```

**Success Criteria**:
- All setups listed
- Active setup identified
- Setup details retrieved successfully

#### Test 3: Operation Error Check
```
Tool: featurecam_check_operation_errors
Expected: Returns operation status
```

**Success Criteria**:
- Completes without errors
- Correctly identifies any operation errors in the document

#### Test 4: Tool Library Access
```
1. Tool: featurecam_list_tools
2. Tool: featurecam_get_tool_details (with a tool from step 1)
```

**Success Criteria**:
- All tools listed
- Tool details retrieved with correct geometry data

### Advanced Functionality Tests

#### Test 5: Solid Operations
```
1. Tool: featurecam_list_solids
2. Tool: featurecam_export_solid
   Parameters: {
     "solid_name": "<name from step 1>",
     "output_path": "C:\\Temp\\test_export.stl"
   }
```

**Success Criteria**:
- Solids listed correctly
- Export initiated (file creation may depend on FeatureCAM API version)

#### Test 6: Feature & Operation Traversal
```
1. Tool: featurecam_list_features
   Parameters: { "setup_name": "<active setup>" }
2. Tool: featurecam_get_operations
   Parameters: { "setup_name": "<active setup>" }
```

**Success Criteria**:
- All features in setup listed
- All operations retrieved with tool assignments

#### Test 7: Setup Modification
```
1. Tool: featurecam_get_active_setup (note current active setup)
2. Tool: featurecam_set_active_setup
   Parameters: { "setup_name": "<different setup>" }
3. Tool: featurecam_get_active_setup (verify change)
4. Tool: featurecam_set_active_setup (restore original)
```

**Success Criteria**:
- Active setup changes successfully
- Can restore original state

### Error Handling Tests

#### Test 8: Invalid Setup Name
```
Tool: featurecam_get_setup_details
Parameters: { "setup_name": "NonExistentSetup123" }
Expected: Clear error message
```

**Success Criteria**:
- Returns: "Error: Setup 'NonExistentSetup123' not found."

#### Test 9: No Active Document
1. Close all documents in FeatureCAM
2. Call any tool
3. Expected: "No active document" error

**Success Criteria**:
- Clear error message
- Server doesn't crash

#### Test 10: Invalid Tool Name
```
Tool: featurecam_get_tool_details
Parameters: { "tool_name": "InvalidTool999" }
```

**Success Criteria**:
- Returns: "Error: Tool 'InvalidTool999' not found."

## Performance Testing

### Response Time Benchmarks

Expected response times (may vary based on document size):

- **Document Info**: < 1 second
- **List Setups**: < 2 seconds
- **List Tools**: < 3 seconds
- **Get Operations**: < 5 seconds (depends on feature count)
- **Export Operations**: Variable (depends on geometry complexity)

### Load Testing

For production environments:

1. **Concurrent Request Test**: Test multiple tool calls in quick succession
2. **Large Document Test**: Test with documents containing 100+ operations
3. **Extended Session Test**: Run server for extended period (hours) to check for memory leaks

## Troubleshooting Guide

### Problem: "pywin32 not available"

**Solutions**:
1. Install pywin32: `pip install pywin32`
2. Run post-install: `python Scripts/pywin32_postinstall.py -install`
3. Restart command prompt and try again

### Problem: "Failed to connect to FeatureCAM"

**Solutions**:
1. Verify FeatureCAM is running
2. Check Task Manager for "fm.exe" process
3. Try opening FeatureCAM manually
4. Verify COM registration:
   ```cmd
   reg query "HKEY_CLASSES_ROOT\FeatureCAM.Application" /s
   ```
5. Reinstall FeatureCAM if registration is missing

### Problem: "No active document"

**Solutions**:
1. Open a FeatureCAM file
2. Create a new document in FeatureCAM
3. Verify document is visible in FeatureCAM window

### Problem: COM Exceptions

**Solutions**:
1. Restart FeatureCAM
2. Ensure FeatureCAM and Python are running with same privilege level (both as admin or both as user)
3. Check Windows Event Viewer for COM errors
4. Verify FeatureCAM version is compatible

### Problem: "Setup not found" errors

**Solutions**:
1. Use `featurecam_list_setups` to get exact names (case-sensitive)
2. Check for special characters in setup names
3. Verify setup exists in active document

### Problem: MCP Inspector won't connect

**Solutions**:
1. Check firewall settings
2. Verify port 5173 is not in use
3. Try: `npx @modelcontextprotocol/inspector python featurecam_mcp_server.py`
4. Check browser console for errors

## Production Deployment Checklist

- [ ] FeatureCAM installed and tested
- [ ] Python 3.8+ installed
- [ ] All dependencies installed (`pip install -r requirements.txt`)
- [ ] pywin32 post-install completed
- [ ] Connection test passed
- [ ] Basic functionality tests passed
- [ ] Error handling tests passed
- [ ] Server runs without crashes for 1+ hour
- [ ] Client configuration tested
- [ ] Documentation reviewed
- [ ] Backup/recovery procedure documented

## Security Considerations

### Local Deployment

- Server runs locally, no network exposure
- Uses stdio transport by default (secure)
- COM access limited to current user

### Remote Deployment (HTTP)

If using streamable HTTP:

- [ ] Use authentication middleware
- [ ] Implement rate limiting
- [ ] Use HTTPS with valid certificate
- [ ] Restrict access to trusted IP ranges
- [ ] Monitor for unauthorized access attempts
- [ ] Regular security updates

### COM Security

- Ensure Python and FeatureCAM run with same privilege level
- Don't run as Administrator unless necessary
- Limit COM access to authorized users only

## Monitoring & Logging

### Enable Detailed Logging

Add to server code:
```python
import logging

logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('featurecam_mcp.log'),
        logging.StreamHandler()
    ]
)
```

### Monitor for Issues

Watch for:
- Repeated connection failures
- COM exceptions
- Tool call failures
- Memory growth over time
- Response time degradation

### Log Rotation

For production:
```python
from logging.handlers import RotatingFileHandler

handler = RotatingFileHandler(
    'featurecam_mcp.log',
    maxBytes=10*1024*1024,  # 10MB
    backupCount=5
)
```

## Maintenance

### Regular Tasks

**Daily** (Production):
- Check error logs
- Verify server is running
- Test basic connectivity

**Weekly**:
- Review performance metrics
- Check for FeatureCAM updates
- Test backup/restore procedures

**Monthly**:
- Update dependencies: `pip install --upgrade -r requirements.txt`
- Review and clean logs
- Test disaster recovery

### Updates

**Updating Dependencies**:
```cmd
pip install --upgrade mcp pydantic pywin32
```

**Updating Server Code**:
1. Backup current version
2. Test new version with MCP Inspector
3. Deploy to production
4. Monitor for issues

## Support & Resources

### Getting Help

1. **Check Logs**: Review server logs for error details
2. **Check Examples**: Review EXAMPLES.md for usage patterns
3. **Test with Inspector**: Use MCP Inspector to debug
4. **FeatureCAM Forums**: https://forums.autodesk.com/t5/featurecam-forum/bd-p/276

### Useful Commands

**Test Python Environment**:
```cmd
python --version
pip list | findstr "mcp pydantic pywin32"
```

**Test COM Connection**:
```cmd
python -c "import win32com.client; app = win32com.client.Dispatch('FeatureCAM.Application'); print('Connected to FeatureCAM version:', app.Version)"
```

**Verify Server Syntax**:
```cmd
python -m py_compile featurecam_mcp_server.py
```

**Run Server with Verbose Output**:
```cmd
python featurecam_mcp_server.py --help
```

## Success Metrics

Track these metrics for production deployment:

- **Uptime**: % of time server is available
- **Response Time**: Average/median time for tool calls
- **Error Rate**: % of failed tool calls
- **Tool Usage**: Most frequently used tools
- **Document Types**: Variety of documents successfully processed

## Conclusion

Following this deployment and testing guide ensures:

✓ Proper installation and configuration
✓ Comprehensive functionality verification
✓ Production-ready deployment
✓ Ongoing maintenance and monitoring
✓ Quick troubleshooting and resolution

For additional help, refer to:
- README.md - Complete documentation
- EXAMPLES.md - Usage examples
- FeatureCAM API Examples - https://github.com/Autodesk/featurecam-api-examples
