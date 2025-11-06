# Build plugin for Linux glibc (not musl) - compatible with Nakama Debian base image
FROM golang:1.22

WORKDIR /app

# Copy Go module files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY modules/ ./modules/

# Build Nakama plugin for Linux glibc (not musl/Alpine)
# CGO_ENABLED=1 is required for plugins
# GOOS=linux GOARCH=amd64 ensures Linux x86_64
# Using Debian-based golang image ensures glibc compatibility
ENV CGO_ENABLED=1
ENV GOOS=linux
ENV GOARCH=amd64

RUN cd modules && go build -buildmode=plugin -o module.so .

# Output the plugin
FROM scratch
COPY --from=0 /app/modules/module.so /module.so

