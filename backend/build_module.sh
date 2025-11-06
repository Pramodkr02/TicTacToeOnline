#!/usr/bin/env bash
set -euo pipefail

# Build the development stage image and extract the plugin as backend/module.so
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
IMAGE_TAG="nakama-dev-plugin:latest"

# Build just the development stage where main.so is compiled
docker build --target development -t "$IMAGE_TAG" -f "$SCRIPT_DIR/Dockerfile" "$SCRIPT_DIR"

# Create a container to copy from, then clean up
CID="$(docker create "$IMAGE_TAG")"
mkdir -p "$SCRIPT_DIR"
docker cp "$CID:/app/modules/main.so" "$SCRIPT_DIR/module.so"
docker rm -f "$CID" >/dev/null 2>&1 || true

echo "Plugin built at: $SCRIPT_DIR/module.so"
