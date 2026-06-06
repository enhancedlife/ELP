#!/bin/sh
# Toggle maintenance mode for yourenhancedlife.com (nginx reads deploy/maintenance/on).
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FLAG="$ROOT/deploy/maintenance/on"
if [ -f "$FLAG" ]; then
  rm -f "$FLAG"
  echo "Maintenance OFF"
else
  mkdir -p "$(dirname "$FLAG")"
  touch "$FLAG"
  echo "Maintenance ON"
fi
if command -v docker >/dev/null 2>&1; then
  docker compose -f "$ROOT/docker-compose.yml" exec nginx nginx -s reload 2>/dev/null || true
fi
