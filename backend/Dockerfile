# Development stage
FROM golang:1.21-alpine AS development

WORKDIR /app

# Install git and ca-certificates for development
RUN apk add --no-cache git ca-certificates

# Copy Go files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the plugin
RUN cd modules && go build -buildmode=plugin -o main.so .

# Production stage
FROM heroiclabs/nakama:3.21.0 AS production

WORKDIR /nakama

# Copy compiled Go plugin to Nakama module folder
COPY --from=development /app/modules/main.so /nakama/data/modules/main.so

# Copy config and data files
COPY --from=development /app/config /nakama/data/config
COPY --from=development /app/data /nakama/data/data

# Expose Nakama ports
EXPOSE 7349 7350 7351

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:7350/ || exit 1

# Start Nakama with migration
ENTRYPOINT ["/bin/sh", "-ecx", "nakama migrate up --database.address root@cockroachdb:26257 && nakama --config /nakama/data/config/nakama-config.yml"]
