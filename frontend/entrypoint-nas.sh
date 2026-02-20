#!/bin/bash
set -e

cd /repo
echo "[entrypoint] Pulling latest code..."
git pull --ff-only origin main || true

cd /repo/frontend

if [ -n "$EXPO_PUBLIC_API_URL" ]; then
  echo "EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL" > .env
  echo "[entrypoint] .env written: EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL"
fi

echo "[entrypoint] Installing dependencies..."
npm install

/sync.sh &

echo "[entrypoint] Starting Expo dev server..."
REACT_NATIVE_PACKAGER_HOSTNAME=${EXPO_HOSTNAME:-localhost} npx expo start --port 80
