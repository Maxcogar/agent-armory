@echo off
REM FeatureCAM MCP Server Setup Script
REM Run this script to install all dependencies

echo ========================================
echo FeatureCAM MCP Server Setup
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8 or higher from https://www.python.org/
    pause
    exit /b 1
)

echo Python found:
python --version
echo.

REM Check Python version (basic check)
echo Checking Python version...
python -c "import sys; assert sys.version_info >= (3, 8), 'Python 3.8+ required'; print('✓ Python version OK')"
if %errorlevel% neq 0 (
    echo ERROR: Python 3.8 or higher is required
    pause
    exit /b 1
)
echo.

REM Install dependencies
echo Installing Python dependencies...
echo.
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo.

REM Run pywin32 post-install script
echo Running pywin32 post-install script...
python -c "import sys; import os; scripts_dir = os.path.join(sys.prefix, 'Scripts'); postinstall = os.path.join(scripts_dir, 'pywin32_postinstall.py'); exec(open(postinstall).read())" -install
echo.

REM Check if FeatureCAM is installed
echo Checking for FeatureCAM installation...
python -c "import win32com.client; app = win32com.client.Dispatch('FeatureCAM.Application'); print('✓ FeatureCAM COM interface found'); del app" 2>nul
if %errorlevel% neq 0 (
    echo WARNING: Could not connect to FeatureCAM COM interface
    echo Please ensure FeatureCAM is installed and has been run at least once
    echo.
) else (
    echo ✓ FeatureCAM is properly installed
    echo.
)

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Ensure FeatureCAM is running
echo 2. Open a FeatureCAM document
echo 3. Run the server: python featurecam_mcp_server.py
echo.
echo For Claude Desktop integration, add this to your config:
echo {
echo   "mcpServers": {
echo     "featurecam": {
echo       "command": "python",
echo       "args": ["%CD%\\featurecam_mcp_server.py"]
echo     }
echo   }
echo }
echo.
echo Configuration file location:
echo %%APPDATA%%\Claude\claude_desktop_config.json
echo.

pause
