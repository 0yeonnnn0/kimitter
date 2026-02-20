#!/bin/bash
set -e

cd /repo/frontend

# Write .env from environment variable
if [ -n "$EXPO_PUBLIC_API_URL" ]; then
  echo "EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL" > .env
  echo "[entrypoint] .env written: EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL"
fi

# Start sync loop in background (checks every 5 minutes)
/sync.sh &

echo "[entrypoint] Starting Expo dev server..."
REACT_NATIVE_PACKAGER_HOSTNAME=${EXPO_HOSTNAME:-localhost} npx expo start --port 80
