Param()
$ErrorActionPreference = 'Stop'

# Paths
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ImageTag = 'nakama-dev-plugin:latest'

# Build the development stage image where main.so is produced
docker build --target development -t $ImageTag -f "$ScriptDir/Dockerfile" $ScriptDir

# Create temp container and copy artifact
$cid = (docker create $ImageTag).Trim()
try {
  docker cp "$cid`:/app/modules/main.so" "$ScriptDir/module.so"
} finally {
  docker rm -f $cid | Out-Null
}

Write-Host "Plugin built at: $ScriptDir/module.so"
