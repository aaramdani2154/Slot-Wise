@echo off
setlocal
echo ========================================================
echo        SlotWise - GitHub One-Click Push Utility
echo ========================================================
echo.

:: Ensure MinGit and Node are available in PATH
set "PATH=C:\Users\Faiza\AppData\Local\Microsoft\WinGet\Packages\Git.MinGit_Microsoft.Winget.Source_8wekyb3d8bbwe\cmd;C:\Program Files\nodejs;%PATH%"

cd /d "C:\Users\Faiza\.gemini\antigravity\scratch\slotwise-app"

echo [1/3] Checking Git Status and Staging Files...
git add -A

git diff-index --quiet HEAD --
if %ERRORLEVEL% NEQ 0 (
    echo [2/3] Committing changes...
    git commit -m "SlotWise Auto-Sync: Updates and AI Chatbot improvements"
) else (
    echo [2/3] All changes already committed.
)

echo [3/3] Pushing to https://github.com/aaramdani2154/Slot-Wise.git ...
git push -u origin main --force

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================================
    echo  SUCCESS: SlotWise has been successfully pushed!
    echo  View repository: https://github.com/aaramdani2154/Slot-Wise
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo  Push encountered an issue. See git error message above.
    echo ========================================================
)

echo.
pause
