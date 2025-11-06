#!/usr/bin/env bash
set -e

echo "🔍 Pre-deployment validation..."

# Check environment variables
if [ -z "$NAKAMA_DATABASE_DSN" ] && [ -z "$NAKAMA_DATABASE_ADDRESS" ]; then
  echo "❌ ERROR: Missing NAKAMA_DATABASE_DSN or NAKAMA_DATABASE_ADDRESS"
  exit 1
fi

if [ -z "$SOCKET_SERVER_KEY" ]; then
  echo "⚠️  WARNING: SOCKET_SERVER_KEY not set, using default"
fi

echo "✅ Environment variables OK"

# Check if plugin exists (for local builds)
if [ -f "/nakama/data/modules/main.so" ]; then
  echo "🔍 Checking plugin binary..."
  file /nakama/data/modules/main.so || true
  echo "✅ Plugin found at /nakama/data/modules/main.so"
else
  echo "⚠️  Plugin not found at /nakama/data/modules/main.so (will be built during Docker build)"
fi

echo "✅ Pre-deployment check passed"

