@echo off
rem Opens the RD Amazing home demo in your default browser.
rem A small local server window opens alongside it; close that window to stop the demo.
cd /d "%~dp0demo"
start "RD Amazing demo server - close to stop" /min python -m http.server 8765
timeout /t 2 /nobreak >nul
start "" "http://localhost:8765/local.html"
