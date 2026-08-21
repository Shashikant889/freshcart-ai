# FreshCart AI — 1-Click GitHub Setup & Deployment Helper Script
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  🌿 FreshCart AI — GitHub Setup & Cloud Deployment" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan

$git = "C:\Users\shash\AppData\Local\Programs\Git\cmd\git.exe"
$gh = "C:\Users\shash\AppData\Local\Programs\GitHubCLI\bin\gh.exe"

# 1. Verify Git Status
Write-Host "`n[1/3] Checking Git Repository..." -ForegroundColor Yellow
& $git status

# 2. GitHub Authentication Check
Write-Host "`n[2/3] Checking GitHub CLI Authentication..." -ForegroundColor Yellow
$authCheck = & $gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n⚠️ You are not logged into GitHub yet." -ForegroundColor Yellow
    Write-Host "Starting 1-click web login... A browser window will open." -ForegroundColor Cyan
    & $gh auth login --web --hostname github.com -p https
}

# 3. Create Remote GitHub Repository and Push
Write-Host "`n[3/3] Creating GitHub Repository & Pushing Code..." -ForegroundColor Yellow
& $gh repo create freshcart-ai --public --source=. --remote=origin --push

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host "  🎉 SUCCESS! Your code is now live on GitHub!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host "Next Step: Deploy for free on Render.com in 1 Click:" -ForegroundColor Cyan
Write-Host "1. Open https://render.com" -ForegroundColor White
Write-Host "2. Click 'New +' -> 'Web Service'" -ForegroundColor White
Write-Host "3. Connect your new 'freshcart-ai' repository" -ForegroundColor White
Write-Host "4. Click 'Create Web Service'!" -ForegroundColor White
