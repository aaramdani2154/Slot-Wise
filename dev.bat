@echo off
setlocal
echo ========================================================
echo        SlotWise - Launching Development Server
echo ========================================================
echo.
set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%~dp0"
echo Starting Vite dev server on http://localhost:5173/ ...
node .\node_modules\vite\bin\vite.js --open
pause
