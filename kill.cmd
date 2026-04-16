 @echo off
setlocal enabledelayedexpansion
echo Finding and going to kill processes on ports related to this application

call :KillPort 5000
call :KillPort 5001
call :KillPort 59694

echo Done.
exit /b

:KillPort
set PORT=%1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :!PORT!') do (
    echo Killing process %%a on port !PORT!
    taskkill /pid %%a /f 2>nul
)
exit /b