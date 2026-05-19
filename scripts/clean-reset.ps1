# Clean-reset for Windows (PowerShell).
#
# Use this when:
#   - npm has wedged itself on a Windows file lock
#     (esbuild.exe / rollup .node files commonly held open by VS Code,
#     a previous `npm run dev` process, or Windows Defender)
#   - npm install / npm ci complains about an out-of-sync lockfile
#   - "Cannot read properties of null (reading 'createProvider')"
#     suggests a corrupt vendor bundle and you want a clean rebuild.
#
# What it does:
#   1. Stops common Node-based dev processes that hold .exe locks.
#   2. Wipes node_modules and package-lock.json with retries so the
#      occasional "Access denied" doesn't leave a half-deleted tree.
#   3. Clears Vite's cache (.vite), the npm cache, and the bootstrap
#      Laravel cache so a stale config can't bleed in.
#   4. Reinstalls deps fresh from package.json.
#   5. Rebuilds the frontend.
#
# Run from the project root:
#     powershell -ExecutionPolicy Bypass -File .\scripts\clean-reset.ps1

$ErrorActionPreference = "Stop"

Write-Host "==> 1/5  Stopping any lingering Node / esbuild / rollup processes" -ForegroundColor Cyan
Get-Process -Name "node","esbuild","rollup" -ErrorAction SilentlyContinue |
    ForEach-Object {
        Write-Host "    killing $($_.Name) (pid $($_.Id))"
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }
Start-Sleep -Seconds 1

function Remove-PathWithRetry {
    param([string]$Path, [int]$Retries = 5)
    if (-not (Test-Path $Path)) { return }
    for ($i = 1; $i -le $Retries; $i++) {
        try {
            Remove-Item -Path $Path -Recurse -Force -ErrorAction Stop
            return
        } catch {
            Write-Host "    retry $i for $Path ($($_.Exception.Message.Split([Environment]::NewLine)[0]))" -ForegroundColor Yellow
            Start-Sleep -Seconds 2
        }
    }
    Write-Host "    WARN: could not fully delete $Path — close VS Code / Defender scans and try again." -ForegroundColor Red
}

Write-Host "==> 2/5  Removing node_modules and package-lock.json" -ForegroundColor Cyan
Remove-PathWithRetry -Path "node_modules"
Remove-PathWithRetry -Path "package-lock.json"

Write-Host "==> 3/5  Clearing build caches (.vite, public/build, bootstrap/cache)" -ForegroundColor Cyan
Remove-PathWithRetry -Path ".vite"
Remove-PathWithRetry -Path "public/build"
Get-ChildItem -Path "bootstrap/cache" -Filter "*.php" -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -ne ".gitignore" } |
    Remove-Item -Force -ErrorAction SilentlyContinue
npm cache verify 2>$null | Out-Null

Write-Host "==> 4/5  Installing fresh dependencies (this may take a couple of minutes)" -ForegroundColor Cyan
npm install --no-audit --no-fund
if ($LASTEXITCODE -ne 0) {
    Write-Host "    npm install failed. Stopping." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host "==> 5/5  Rebuilding the frontend" -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "    npm run build failed. Stopping." -ForegroundColor Red
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "Done. Now run: php artisan config:clear; php artisan view:clear; php artisan route:clear" -ForegroundColor Green
Write-Host "Then commit the regenerated package-lock.json so CI and other devs are in sync:" -ForegroundColor Green
Write-Host "    git add package-lock.json" -ForegroundColor Green
Write-Host "    git commit -m 'chore(deps): regenerate package-lock.json'" -ForegroundColor Green
