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

# Ensure m does not exceed n.
if [ "$m" -gt "$n" ]; then
  echo "Warning: m cannot exceed n. Setting m = n."
  m=$n
fi

# Export any required environment variables.
export REDIS_HOST="127.0.0.1"
export REDIS_PORT="6379"
export NODE_ENV="development"

# Generate an array of ports starting from 3000.
ports=()
start_port=3000
for (( i=0; i<n; i++ )); do
  ports+=($(( start_port + i )))
done

# Loop over each port and launch the server instance.
for port in "${ports[@]}"; do
    # Build the list of peer ports.
    # First, add the two fixed neighbors (using circular logic).
    peer_ports=()

    # Previous neighbor: if current port is the first, wrap to the last port.
    if [ "$port" -eq "$start_port" ]; then
        peer_ports+=($(( start_port + n - 1 )))
    else
        peer_ports+=($(( port - 1 )))
    fi

    # Next neighbor: if current port is the last, wrap to the first port.
    if [ "$port" -eq $(( start_port + n - 1 )) ]; then
        peer_ports+=( "$start_port" )
    else
        peer_ports+=($(( port + 1 )))
    fi

    # Now add m-2 random peer ports.
    random_count=$(( m - 2 ))
    for (( j=0; j<random_count; j++ )); do
         while true; do
             # Generate a random port in the range [start_port, start_port+n-1]
             random_peer=$(( RANDOM % n + start_port ))
             
             # Exclude the current node's port.
             if [ "$random_peer" -eq "$port" ]; then
                continue
             fi

             # Exclude any port already added to peer_ports.
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

    # Combine the current port and the peer ports into command-line arguments.
    args="$port ${peer_ports[*]}"
    
    echo "Starting server on port $port with peers: ${peer_ports[*]}"
    
    # Launch the Node.js server in the background.
    # Using nohup detaches the process from the terminal.
    nohup node peer1Express.js $args >/dev/null 2>&1 &
done

nohup node query.js $n >/dev/null 2>&1 &

# Optionally, wait for all background processes if needed.
wait
