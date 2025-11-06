# Build plugin stage - use glibc-based Go image (not Alpine/musl)
FROM golang:1.22 AS plugin-builder

WORKDIR /app

# Copy Go module files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY modules/ ./modules/

# Build plugin for Linux glibc (Nakama uses Debian, not Alpine)
ENV CGO_ENABLED=1
ENV GOOS=linux
ENV GOARCH=amd64

RUN cd modules && go build -buildmode=plugin -o main.so .

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
