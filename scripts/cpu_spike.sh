#!/bin/bash

DURATION=15

TOTAL_CORES=$(nproc 2>/dev/null || echo 1)
TARGET_CORES=$((TOTAL_CORES / 2))

if [ "$TARGET_CORES" -eq 0 ]; then
    TARGET_CORES=1
fi

echo "Spiking CPU to ~50% (Maxing out $TARGET_CORES of $TOTAL_CORES cores) for $DURATION seconds..."

PIDS=()

cleanup() {
    for pid in "${PIDS[@]}"; do
        kill -9 "$pid" 2>/dev/null
    done
    echo -e "\nDropped back down. Done!"
    exit 0
}

trap cleanup SIGINT SIGTERM

for ((i=0; i<TARGET_CORES; i++)); do
    while true; do :; done &
    PIDS+=($!)
done
sleep $DURATION

cleanup