@echo off
echo Cleaning up bin and obj folders...
echo.

REM Remove all bin folders
for /d /r . %%d in (bin) do @if exist "%%d" (
    echo Deleting: %%d
    rd /s /q "%%d"
)

REM Remove all obj folders
for /d /r . %%d in (obj) do @if exist "%%d" (
    echo Deleting: %%d
    rd /s /q "%%d"
)

echo.
echo Cleanup complete!
pause

