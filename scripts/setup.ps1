$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

function Invoke-Npm {
  param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Args
  )

  & npm.cmd @Args
  if ($LASTEXITCODE -ne 0) {
    throw "npm.cmd $($Args -join ' ') failed with exit code $LASTEXITCODE"
  }
}

Write-Host "Yashil Quest local setup boshlanmoqda..." -ForegroundColor Cyan

if (-not (Test-Path ".env")) {
  Copy-Item ".env.example" ".env"

  $jwtSecret = node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  $refreshSecret = node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

  (Get-Content ".env") `
    -replace "change-this-to-a-secure-random-string-min-64-chars", $jwtSecret `
    -replace "change-this-to-another-secure-random-string-min-64-chars", $refreshSecret |
    Set-Content ".env"

  Write-Host ".env yaratildi." -ForegroundColor Green
} else {
  Write-Host ".env allaqachon mavjud, o'zgartirmadim." -ForegroundColor Yellow
}

Copy-Item ".env" "backend/.env" -Force

Write-Host "Backend paketlari o'rnatilmoqda..." -ForegroundColor Cyan
Push-Location "backend"
try {
  Invoke-Npm install
} finally {
  Pop-Location
}

Write-Host "Frontend paketlari o'rnatilmoqda..." -ForegroundColor Cyan
Push-Location "frontend"
try {
  Invoke-Npm install
} finally {
  Pop-Location
}

Write-Host "Prisma client generate qilinmoqda..." -ForegroundColor Cyan
Push-Location "backend"
try {
  Invoke-Npm run prisma:generate
} finally {
  Pop-Location
}

Write-Host "SQLite schema tayyorlanmoqda..." -ForegroundColor Cyan
Push-Location "backend"
try {
  Invoke-Npm run db:push
} finally {
  Pop-Location
}

Write-Host "Demo ma'lumotlar seed qilinmoqda..." -ForegroundColor Cyan
Push-Location "backend"
try {
  Invoke-Npm run prisma:seed
} finally {
  Pop-Location
}

New-Item -ItemType Directory -Force -Path "uploads" | Out-Null

Write-Host ""
Write-Host "Setup tugadi." -ForegroundColor Green
Write-Host "Ishga tushirish:" -ForegroundColor Cyan
Write-Host "  1) npm.cmd run dev:backend"
Write-Host "  2) npm.cmd run dev:frontend"
Write-Host "  3) ixtiyoriy: npm.cmd run dev:cv"
