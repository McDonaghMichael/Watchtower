FROM golang:bookworm AS builder

RUN apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Download ONNX Runtime shared library for linux/amd64
RUN wget -q https://github.com/microsoft/onnxruntime/releases/download/v1.20.1/onnxruntime-linux-x64-1.20.1.tgz \
    && tar -xzf onnxruntime-linux-x64-1.20.1.tgz \
    && cp onnxruntime-linux-x64-1.20.1/lib/libonnxruntime.so* /usr/local/lib/ \
    && ldconfig

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=1 GOOS=linux GOARCH=amd64 go build -o main .

FROM debian:bookworm-slim
WORKDIR /root/

RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/local/lib/libonnxruntime.so* /usr/local/lib/
RUN ldconfig

COPY --from=builder /app/main .
COPY schema.sql /root/schema.sql

EXPOSE 8080
CMD ["./main"]
