#!/bin/bash

SYNC_INTERVAL=${SYNC_INTERVAL:-300}

while true; do
  sleep "$SYNC_INTERVAL"

  cd /repo
  BEFORE=$(git rev-parse HEAD)
  git pull --ff-only origin main 2>/dev/null || continue
  AFTER=$(git rev-parse HEAD)

  if [ "$BEFORE" != "$AFTER" ]; then
    echo "[sync] Changes detected ($BEFORE -> $AFTER)"

    if git diff --name-only "$BEFORE" "$AFTER" | grep -q "^frontend/"; then
      echo "[sync] Frontend changed, reinstalling dependencies..."
      cd /repo/frontend
      npm ci
      echo "[sync] Restarting Expo server..."
      pkill -f "expo start" || true
      sleep 2
      npx expo start --tunnel --non-interactive &
    fi
  fi
done
