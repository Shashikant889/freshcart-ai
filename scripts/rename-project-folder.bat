@echo off
setlocal

echo ==============================================================================
echo   Renaming project folder to:
echo   "AI-Driven Intelligent Grocery Retail System Using Machine Learning"
echo ==============================================================================

set "PARENT_DIR=C:\Users\shash"
set "OLD_FOLDER=%PARENT_DIR%\demo1"
set "NEW_FOLDER=%PARENT_DIR%\AI-Driven Intelligent Grocery Retail System Using Machine Learning"

if not exist "%OLD_FOLDER%" (
    echo [ERROR] Source folder "%OLD_FOLDER%" was not found or already renamed!
    goto :check_new
)

if exist "%NEW_FOLDER%" (
    echo [WARNING] Target folder "%NEW_FOLDER%" already exists!
    pause
    exit /b 1
)

echo.
echo Attempting to rename folder...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Rename-Item -LiteralPath '%OLD_FOLDER%' -NewName 'AI-Driven Intelligent Grocery Retail System Using Machine Learning' -ErrorAction Stop"

if %ERRORLEVEL% equ 0 (
    echo.
    echo [SUCCESS] Folder successfully renamed to:
    echo "%NEW_FOLDER%"
    echo.
    echo You can now open this folder directly in your IDE.
) else (
    echo.
    echo [NOTICE] If the rename was blocked by Windows because the folder is in use by Antigravity IDE:
    echo 1. Close or reload Antigravity IDE.
    echo 2. Run this script again from Command Prompt:
    echo    "%~dp0rename-project-folder.bat"
    echo 3. Open "%NEW_FOLDER%" in Antigravity IDE.
)

:check_new
echo.
pause
