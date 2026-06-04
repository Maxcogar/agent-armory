# FeatureCAM MCP Server - QUICK START

## 🚀 Get Running in 5 Minutes

### Step 1: Prerequisites Check
✅ Windows OS
✅ FeatureCAM installed
✅ Python 3.8+ installed

### Step 2: Install
```cmd
setup.bat
```

That's it! The script will:
- Install all dependencies
- Configure pywin32 for COM
- Verify FeatureCAM connection

### Step 3: Test
1. **Start FeatureCAM** and open any document
2. **Run the server**:
```cmd
python featurecam_mcp_server.py
```
3. **You should see**: Server startup messages (no errors)

### Step 4: Connect to Claude Desktop

1. **Find your config file**:
   - Press `Win+R`, type: `%APPDATA%\Claude`
   - Open `claude_desktop_config.json`

2. **Add this** (update the path!):
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

### Step 5: Use It!

Open Claude Desktop and try:

**"What tools are available for FeatureCAM?"**
→ See all 27 tools

**"Get information about my current FeatureCAM document"**
→ See document details

**"Check my document for operation errors"**
→ Get error report

**"List all setups and their status"**
→ See setup overview

## 🎯 What You Can Do

### Document Management
- Get document info
- Save documents
- Invalidate toolpaths
- Generate NC code

### Setup Operations
- List all setups
- Get setup details
- Change active setup
- Enable/disable setups

### Tool Analysis
- List all tools
- Get detailed tool specs
- Analyze tool usage

### Quality Checks
- Check for operation errors
- List features and operations
- Verify setup configuration

### Export Functions
- Export stock to STL
- Export solids to STL
- Generate NC programs

## 📚 Where to Learn More

### New User?
**Start here**: `README.md`
- Complete overview
- All tools explained
- Integration guide

### Want Examples?
**Read**: `EXAMPLES.md`
- 10 detailed scenarios
- Common workflows
- Best practices

### Deploying to Production?
**Read**: `DEPLOYMENT.md`
- Testing procedures
- Production checklist
- Security considerations
- Monitoring setup

### Understanding the Project?
**Read**: `PROJECT_SUMMARY.md`
- How it was built
- Technical details
- Architecture overview

## 🔧 Troubleshooting

### "Failed to connect to FeatureCAM"
→ Is FeatureCAM running?
→ Try opening FeatureCAM manually first

### "pywin32 not available"
→ Did `setup.bat` complete successfully?
→ Try: `pip install pywin32`

### "No active document"
→ Open a FeatureCAM file first
→ Create a new document if needed

### Server won't start
→ Check Python version: `python --version` (need 3.8+)
→ Reinstall dependencies: `pip install -r requirements.txt`

### Still stuck?
→ Check `DEPLOYMENT.md` troubleshooting section
→ Review error logs
→ Test with MCP Inspector: `npx @modelcontextprotocol/inspector python featurecam_mcp_server.py`

## 💡 Pro Tips

1. **Always check for errors first** before generating NC code
2. **Use JSON format** when you need to process data programmatically
3. **Use Markdown format** when you want readable reports
4. **Save your document** after making configuration changes
5. **Test with MCP Inspector** when developing new workflows

## 🎓 Example Conversation

```
You: "Check my FeatureCAM project for errors"
Claude: [Calls featurecam_check_operation_errors]
        "✓ No errors found in operations."

You: "Great! Generate NC code for all setups"
Claude: [Calls featurecam_generate_nc_code]
        "NC code generation initiated successfully.
         Generated files:
         - C:\CAM\MyPart_Setup1.nc
         - C:\CAM\MyPart_Setup2.nc"

You: "Export the stock for verification"
Claude: [Calls featurecam_export_stock]
        "Stock export initiated to: C:\CAM\stock.stl"
```

## 📊 Success Metrics

You'll know it's working when:
✅ Server starts without errors
✅ Claude can list FeatureCAM tools
✅ Tools return real data from your document
✅ No COM connection errors
✅ Natural language commands work

## 🚦 Next Steps

### Just Getting Started?
1. Run `setup.bat`
2. Test with a simple document
3. Try the examples in `EXAMPLES.md`

### Ready for Production?
1. Complete testing checklist in `DEPLOYMENT.md`
2. Set up monitoring
3. Document your workflows
4. Configure security

### Want to Extend?
1. Read the Python source code
2. Add custom tools for your workflow
3. Integrate with your other systems
4. Share improvements!

## 📁 File Guide

- **featurecam_mcp_server.py** - The server (run this)
- **setup.bat** - Install everything (run this first)
- **requirements.txt** - Python dependencies
- **README.md** - Full documentation
- **EXAMPLES.md** - Usage examples
- **DEPLOYMENT.md** - Production guide
- **PROJECT_SUMMARY.md** - Technical overview
- **LICENSE.txt** - MIT license

## ⚡ One-Liner Setup

Already have Python and FeatureCAM?

```cmd
setup.bat && python featurecam_mcp_server.py
```

Then add to Claude Desktop config and you're done!

## 🎉 Ready to Go!

You now have a **complete MCP server** that lets you:
- Control FeatureCAM through natural language
- Automate CAM workflows
- Check quality automatically
- Generate NC code intelligently
- Export verification files
- Analyze tool usage
- And much more!

**Just start asking Claude about your FeatureCAM projects!**

---

**Need help?** Check the other documentation files.
**Found a bug?** The code is clear and well-commented - easy to fix!
**Want to extend?** The architecture is modular - easy to add tools!

**Now go make some chips! 🔧**
