# Step 1: Build stage
FROM golang:1.22 AS builder

WORKDIR /app

# Copy Go files
COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Build Go plugin for Nakama
RUN go build -o main .

# Step 2: Final stage with Nakama server
FROM heroiclabs/nakama:3.20.0

WORKDIR /nakama/data/modules

# Copy compiled Go plugin to Nakama module folder
COPY --from=builder /app/main ./main.so

# Expose Nakama ports
EXPOSE 7350 7351

ENTRYPOINT ["/bin/sh", "-ecx", "nakama migrate up --database.address root@cockroachdb:26257 && nakama --config /nakama/data/config.yml"]
