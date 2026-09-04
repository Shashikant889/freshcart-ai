# PowerShell script to rename project folder
$ParentDir = "C:\Users\shash"
$OldFolder = Join-Path $ParentDir "demo1"
$NewFolder = Join-Path $ParentDir "AI-Driven Intelligent Grocery Retail System Using Machine Learning"

Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "  Renaming project folder to: AI-Driven Intelligent Grocery Retail System Using Machine Learning" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan

if (-not (Test-Path $OldFolder)) {
    if (Test-Path $NewFolder) {
        Write-Host "[INFO] Folder is already named '$NewFolder'." -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Could not find '$OldFolder'." -ForegroundColor Red
    }
    return
}

if (Test-Path $NewFolder) {
    Write-Host "[WARNING] Target folder '$NewFolder' already exists." -ForegroundColor Yellow
    return
}

try {
    Rename-Item -LiteralPath $OldFolder -NewName "AI-Driven Intelligent Grocery Retail System Using Machine Learning" -ErrorAction Stop
    Write-Host "[SUCCESS] Folder successfully renamed to '$NewFolder'." -ForegroundColor Green
    Write-Host "You can now open '$NewFolder' in Antigravity IDE." -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Could not rename folder: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`nTo resolve file-locking on Windows:" -ForegroundColor Yellow
    Write-Host "1. Close the current window in Antigravity IDE."
    Write-Host "2. Open PowerShell and run: powershell -File '$ParentDir\demo1\scripts\rename-project-folder.ps1'"
    Write-Host "3. Open the renamed folder in Antigravity IDE."
}
