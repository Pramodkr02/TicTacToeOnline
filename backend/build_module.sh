#!/usr/bin/env bash
set -euo pipefail

# Build the Linux glibc-compatible plugin using Docker
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
IMAGE_TAG="nakama-plugin-builder:latest"

echo "🔨 Building Linux glibc-compatible plugin..."

# Build using the glibc-based Dockerfile (not Alpine/musl)
docker build --target plugin-builder -t "$IMAGE_TAG" -f "$SCRIPT_DIR/Dockerfile" "$SCRIPT_DIR" || {
  echo "❌ Failed to build plugin"
  exit 1
}

# Create a container to copy from, then clean up
CID="$(docker create "$IMAGE_TAG")"
mkdir -p "$SCRIPT_DIR"
docker cp "$CID:/app/modules/main.so" "$SCRIPT_DIR/module.so" || {
  echo "❌ Failed to copy plugin"
  docker rm -f "$CID" >/dev/null 2>&1 || true
  exit 1
}
docker rm -f "$CID" >/dev/null 2>&1 || true

echo "✅ Plugin built successfully at: $SCRIPT_DIR/module.so"
echo "📋 Verifying plugin type..."
file "$SCRIPT_DIR/module.so" || echo "⚠️  'file' command not available, but plugin copied successfully"
