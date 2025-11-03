# Multi-stage build for Go application
FROM --platform=$BUILDPLATFORM golang:alpine AS builder

# Build arguments for target platform
ARG TARGETOS TARGETARCH
WORKDIR /app
COPY go.mod ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH go build -o main .

FROM alpine:latest
WORKDIR /root/
COPY --from=builder /app/main .
CMD ["./main"]