@echo off
cd /d "%~dp0"
set "TAIL_NODE=node"
where node >nul 2>nul
if errorlevel 1 set "TAIL_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not exist "%TAIL_NODE%" if not "%TAIL_NODE%"=="node" (
  echo Node.js 24 or newer is required.
  pause
  exit /b 1
)
"%TAIL_NODE%" --env-file-if-exists=.env server/index.mjs
if errorlevel 1 pause
