#!/usr/bin/env bash
# ensure-port-free.sh <port>
#
# Release a port held by a previous dev/prod instance of this app. In the
# v0 sandbox the platform keeps `pnpm run dev` alive at boot, so production
# `next start` would otherwise crash with EADDRINUSE. Last command wins:
# whichever of dev/start runs next takes over the ports.
#
# Sends SIGTERM, then escalates to SIGKILL if a process still holds the port.
set -u

port="${1:?usage: ensure-port-free.sh <port>}"

# Resolve pid(s) bound to the port. `lsof` cannot inspect processes inside
# this sandbox (it returns nothing for other processes), but `fuser` reads
# /proc/net directly and works.
listeners() {
  fuser "$port/tcp" 2>/dev/null | tr ' ' '\n' | grep -E '^[0-9]+$' || true
}

pids="$(listeners)"
if [ -z "$pids" ]; then
  exit 0
fi

echo "Port $port is held by: $(echo "$pids" | tr '\n' ' ')"
echo "Releasing it before starting…"

kill $pids 2>/dev/null || true

for i in $(seq 1 24); do
  sleep 0.25
  pids="$(listeners)"
  if [ -z "$pids" ]; then
    echo "Port $port released."
    exit 0
  fi
  # After ~1.5s escalate to SIGKILL.
  if [ "$i" -ge 6 ]; then
    kill -9 $pids 2>/dev/null || true
  fi
done

echo "ERROR: port $port could not be released." >&2
exit 1