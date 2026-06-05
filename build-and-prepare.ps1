# build-and-prepare.ps1
# This script builds the React frontend and copies the compiled assets inside the backend folder.
# Once run, the backend folder becomes a self-contained web app ready for GCP deployment.

$ErrorActionPreference = "Stop"

# Get current script folder path
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
if ([string]::IsNullOrEmpty($scriptPath)) {
    $scriptPath = Get-Location
}

Write-Host "[1/3] Building React Frontend..." -ForegroundColor Cyan
Set-Location "$scriptPath\frontend"
npm install
npm run build

Write-Host ""
Write-Host "[2/3] Preparing Backend Public Directory..." -ForegroundColor Cyan
Set-Location "$scriptPath\backend"
if (Test-Path "public") {
    Remove-Item -Recurse -Force "public"
}
New-Item -ItemType Directory -Path "public" | Out-Null

Write-Host ""
Write-Host "[3/3] Copying Frontend build files to Backend public folder..." -ForegroundColor Cyan
Copy-Item -Path "$scriptPath\frontend\build\*" -Destination "public" -Recurse -Force

Write-Host ""
Write-Host "SUCCESS: Preparation complete! The 'backend' folder is now a self-contained app ready to deploy." -ForegroundColor Green
Write-Host "Next Step: You can now deploy it to GCP using Google Cloud Run or Google App Engine." -ForegroundColor Yellow
Set-Location $scriptPath
