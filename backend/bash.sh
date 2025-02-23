#!/bin/bash
# Usage: ./script.sh <number_of_instances> <m>

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <number_of_instances> <m>"
  exit 1
fi

n=$1
m=$2

if ! [[ "$n" =~ ^[0-9]+$ ]]; then
  echo "Error: <number_of_instances> must be a positive integer."
  exit 1
fi

if ! [[ "$m" =~ ^[0-9]+$ ]]; then
  echo "Error: <m> must be a positive integer."
  exit 1
fi

if [ "$m" -lt 2 ]; then
  echo "Error: <m> must be at least 2 (for the two fixed neighbor peers)."
  exit 1
fi

if [ "$m" -gt "$n" ]; then
  echo "Warning: m cannot exceed n. Setting m = n."
  m=$n
fi

export REDIS_HOST="127.0.0.1"
export REDIS_PORT="6379"
export NODE_ENV="development"

# Create a "logs" directory if it doesn't exist
LOG_DIR="logs"
mkdir -p "$LOG_DIR"

ports=()
start_port=3000
for (( i=0; i<n; i++ )); do
  ports+=($(( start_port + i )))
done

for port in "${ports[@]}"; do
    peer_ports=()

    if [ "$port" -eq "$start_port" ]; then
        peer_ports+=($(( start_port + n - 1 )))
    else
        peer_ports+=($(( port - 1 )))
    fi

    if [ "$port" -eq $(( start_port + n - 1 )) ]; then
        peer_ports+=( "$start_port" )
    else
        peer_ports+=($(( port + 1 )))
    fi

    random_count=$(( m - 2 ))
    for (( j=0; j<random_count; j++ )); do
         while true; do
             random_peer=$(( RANDOM % n + start_port ))
             if [ "$random_peer" -eq "$port" ]; then
                continue
             fi
             duplicate=0
             for p in "${peer_ports[@]}"; do
                 if [ "$random_peer" -eq "$p" ]; then
                    duplicate=1
                    break
                 fi
             done
             if [ "$duplicate" -eq 0 ]; then
                peer_ports+=("$random_peer")
                break
             fi
         done
    done

    args="$port ${peer_ports[*]}"
    echo "Starting peer1Express.js on port $port with peers: ${peer_ports[*]}"

    # Store logs inside the "logs" directory
    nohup node peer1Express.js $args > "$LOG_DIR/peer_${port}.log" 2>&1 &
done

# Store query.js log inside the "logs" directory
nohup node query.js $n > "$LOG_DIR/query.log" 2>&1 &

wait
