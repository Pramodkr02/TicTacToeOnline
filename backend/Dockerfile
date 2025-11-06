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

# Start Nakama with migration
ENTRYPOINT ["/bin/sh", "-ecx", "/nakama/nakama migrate up --database.address ${NAKAMA_DATABASE_ADDRESS:-root@cockroachdb:26257} && /nakama/nakama --config /nakama/data/config/nakama-config.yml --database.address ${NAKAMA_DATABASE_ADDRESS:-root@cockroachdb:26257}"]
