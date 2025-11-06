Param()
$ErrorActionPreference = 'Stop'

# Paths
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ImageTag = 'nakama-plugin-builder:latest'

Write-Host "🔨 Building Linux glibc-compatible plugin..." -ForegroundColor Cyan

# Build using the glibc-based Dockerfile (not Alpine/musl)
docker build --target plugin-builder -t $ImageTag -f "$ScriptDir/Dockerfile" $ScriptDir
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build plugin" -ForegroundColor Red
    exit 1
}

# Create temp container and copy artifact
$cid = (docker create $ImageTag).Trim()
try {
    docker cp "$cid`:/app/modules/main.so" "$ScriptDir/module.so"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to copy plugin" -ForegroundColor Red
        exit 1
    }
} finally {
    docker rm -f $cid | Out-Null
}

Write-Host "✅ Plugin built successfully at: $ScriptDir/module.so" -ForegroundColor Green
