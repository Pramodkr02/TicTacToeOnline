# Build plugin stage - use glibc-based Go image (not Alpine/musl)
# CRITICAL: Must match Nakama 3.21.0's exact Go version
# Using golang:1.21.0 (first 1.21 release) - most likely to match Nakama 3.21.0
# If this still fails, try: golang:1.21.1, golang:1.21.2, etc.
FROM golang:1.21.0 AS plugin-builder

WORKDIR /app

# Install build dependencies for CGO
RUN apt-get update && apt-get install -y gcc libc6-dev && rm -rf /var/lib/apt/lists/*

# Copy Go module files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY modules/ ./modules/

# Build plugin for Linux glibc (Nakama uses Debian, not Alpine)
# CRITICAL: These must match exactly
ENV CGO_ENABLED=1
ENV GOOS=linux
ENV GOARCH=amd64

# Verify Go version (should be 1.21.x)
RUN go version

# Build the plugin with exact same toolchain as Nakama
# Using -trimpath to ensure reproducible builds
RUN cd modules && go build -trimpath -buildmode=plugin -o main.so .

# Production stage - Nakama server with Go plugin
FROM heroiclabs/nakama:3.21.0

WORKDIR /nakama

# Copy compiled Go plugin (must be glibc-compatible)
COPY --from=plugin-builder /app/modules/main.so /nakama/data/modules/main.so

# Copy config and data files
COPY config/ /nakama/data/config/
COPY data/ /nakama/data/data/

# Expose Nakama ports
EXPOSE 7349 7350 7351

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:7350/ || exit 1

# Start Nakama with migration and proper environment variables
ENTRYPOINT ["/bin/sh", "-ec", "DB_ARG=\"${NAKAMA_DATABASE_DSN:-${NAKAMA_DATABASE_ADDRESS:-}}\"; PORT_ARG=\"${PORT:-7350}\"; SOCKET_KEY=\"${SOCKET_SERVER_KEY:-defaultkey}\"; if [ -z \"$DB_ARG\" ]; then echo 'ERROR: Set NAKAMA_DATABASE_DSN or NAKAMA_DATABASE_ADDRESS'; exit 1; fi; echo 'Running database migrations...'; /nakama/nakama migrate up --database.address \"$DB_ARG\" || { echo 'Migration failed!'; exit 1; }; echo 'Starting Nakama server...'; exec /nakama/nakama --config /nakama/data/config/nakama-config.yml --database.address \"$DB_ARG\" --socket.port \"$PORT_ARG\" --socket.server_key \"$SOCKET_KEY\" --runtime.path /nakama/data/modules"]
