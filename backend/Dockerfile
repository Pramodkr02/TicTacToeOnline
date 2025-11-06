# Development stage
FROM golang:1.21-alpine AS development

WORKDIR /app

# Install git and ca-certificates for development
RUN apk add --no-cache git ca-certificates build-base

# Copy Go files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Ensure Go modules are tidy before building
RUN go mod tidy

# Build the plugin (Go plugins require CGO)
ENV CGO_ENABLED=1
RUN cd modules && go build -buildmode=plugin -o main.so .

# Production stage
FROM heroiclabs/nakama:3.21.0 AS production

WORKDIR /nakama

# Copy compiled Go plugin to Nakama module folder
COPY --from=development /app/modules/main.so /nakama/data/modules/

# Copy config and data files
COPY --from=development /app/config /nakama/data/config
COPY --from=development /app/data /nakama/data/data

# Expose Nakama ports
EXPOSE 7349 7350 7351

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:7350/ || exit 1

# Start Nakama with migration (supports NAKAMA_DATABASE_DSN or NAKAMA_DATABASE_ADDRESS)
ENTRYPOINT ["/bin/sh", "-ec", "DB_ARG=\"${NAKAMA_DATABASE_DSN:-${NAKAMA_DATABASE_ADDRESS:-}}\"; NAME_ARG=\"${NAKAMA_DATABASE_NAME:-nakama}\"; PORT_ARG=\"${PORT:-7350}\"; if [ -z \"$DB_ARG\" ]; then echo 'Set NAKAMA_DATABASE_DSN or NAKAMA_DATABASE_ADDRESS'; exit 1; fi; /nakama/nakama migrate up --database.address \"$DB_ARG\" --database.name \"$NAME_ARG\"; /nakama/nakama --config /nakama/data/config/nakama-config.yml --database.address \"$DB_ARG\" --database.name \"$NAME_ARG\" --socket.port \"$PORT_ARG\""]
