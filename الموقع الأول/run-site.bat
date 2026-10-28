@echo off
rem Opens the full site (the docs folder) in your default browser.
rem A small local server window opens alongside it; close that window to stop the site.
cd /d "%~dp0docs"
start "RD Amazing site server - close to stop" /min python -m http.server 8765
timeout /t 2 /nobreak >nul
start "" "http://localhost:8765/"
