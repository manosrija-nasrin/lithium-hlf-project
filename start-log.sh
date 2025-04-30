#!/bin/bash

# Rotating log files

LOG_DIR="./logs"
LOG_TYPE="network"
LOG_EXT="txt"
MAX_LOGS=1000

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# according to the cmdline arg supplied, determine logtype
if [ "$1" == "network" ]; then
  LOG_TYPE="network"
elif [ "$1" == "frontend" ]; then
  LOG_TYPE="frontend"
elif [ "$1" == "backend" ]; then
  LOG_TYPE="backend"
else
  echo "Usage: $0 {network|frontend|backend}"
  exit 1
fi

LOG_PREFIX="$LOG_TYPE-log"

# Find the next available log number
latest_log=$(ls -v $LOG_DIR/$LOG_PREFIX.*.$LOG_EXT 2>/dev/null | tail -n 1)
if [ -z "$latest_log" ]; then
  log_number=1
else
  log_number=$(basename "$latest_log" | grep -oE '[0-9]+' | tail -n 1)
  log_number=$((log_number + 1))
fi

# Rotate logs if exceeding MAX_LOGS
log_count=$(ls -1 $LOG_DIR/$LOG_PREFIX.*.$LOG_EXT 2>/dev/null | wc -l)
if [ "$log_count" -ge "$MAX_LOGS" ]; then
  oldest_log=$(ls -v $LOG_DIR/$LOG_PREFIX.*.$LOG_EXT | head -n 1)
  rm -f "$oldest_log"
fi

# Define log file name
LOG_FILE="$LOG_DIR/$LOG_PREFIX.$log_number.$LOG_EXT"

echo "Logging session to $LOG_FILE"

# Start logging using `script`
script -q "$LOG_FILE" bash
