@echo off
cd /d "d:\Screw Puzzle"
echo Current folder: %CD%
echo.
echo Pushing to GitHub...
git push -u origin main
if errorlevel 1 (
    echo.
    echo Push failed. Common fixes:
    echo   1. Log in to GitHub when browser/credential prompt appears
    echo   2. Confirm repo exists: https://github.com/iig64625-bot/Match-3-Puzzle
    echo   3. If repo name differs, tell me the correct URL
    pause
    exit /b 1
)
echo.
echo Success! Next: GitHub - Settings - Pages - Source - GitHub Actions
echo Demo: https://iig64625-bot.github.io/Match-3-Puzzle/
pause
