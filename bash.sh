#!/bin/bash
# Usage: ./script.sh <number_of_instances> <m>
#   <number_of_instances> (n) is the total number of Node.js server instances.
#   <m> is the total number of peer ports each instance should have.
#       Two are fixed (neighbors: previous and next in a circular list),
#       and m-2 will be randomly selected from the available ports.
#       Also, m will be capped at n (if m > n, then m = n).

# Check if the correct number of arguments is provided.
if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <number_of_instances> <m>"
  exit 1
fi

n=$1
m=$2

# Validate that n and m are positive integers.
if ! [[ "$n" =~ ^[0-9]+$ ]]; then
  echo "Error: <number_of_instances> must be a positive integer."
  exit 1
fi

if ! [[ "$m" =~ ^[0-9]+$ ]]; then
  echo "Error: <m> must be a positive integer."
  exit 1
fi

# Ensure m is at least 2 (for the two fixed neighbor peers).
if [ "$m" -lt 2 ]; then
  echo "Error: <m> must be at least 2 (for the two fixed neighbor peers)."
  exit 1
fi

# Cap m to n if necessary.
if [ "$m" -gt "$n" ]; then
  echo "Warning: m cannot exceed n. Setting m = n."
  m=$n
fi

# Export required environment variables.
export REDIS_HOST="127.0.0.1"
export REDIS_PORT="6379"
export NODE_ENV="development"

# Generate an array of ports starting from 3000.
ports=()
start_port=3000
for (( i=0; i<n; i++ )); do
  ports+=($(( start_port + i )))
done

# Launch each peer1Express.js instance.
for port in "${ports[@]}"; do
    # Build the list of peer ports.
    peer_ports=()

    # Fixed neighbors (using circular logic).
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

    # Add m-2 random peer ports.
    random_count=$(( m - 2 ))
    for (( j=0; j<random_count; j++ )); do
         while true; do
             # Generate a random port in the range [start_port, start_port+n-1]
             random_peer=$(( RANDOM % n + start_port ))
             
             # Skip the current node's port.
             if [ "$random_peer" -eq "$port" ]; then
                continue
             fi

             # Check for duplicates.
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

    # Build command-line arguments.
    args="$port ${peer_ports[*]}"
    
    echo "Starting peer1Express.js on port $port with peers: ${peer_ports[*]}"
    
    # Launch the Node.js server in the background with nohup.
    nohup node peer1Express.js $args > peer_${port}.log 2>&1 &
done

# Launch query.js in the background with nohup.
nohup node query.js $n > query.log 2>&1 &

# Wait for all background processes.
wait
