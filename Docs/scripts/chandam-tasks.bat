@echo off
REM Chandam Tasks - Convenience wrapper for Windows
REM Usage: chandam-tasks.bat <command> [options]

cd /d "%~dp0..\.."
dotnet run --project Chandam.Tasks --no-build -- %*
