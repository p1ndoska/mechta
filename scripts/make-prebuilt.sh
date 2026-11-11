#!/bin/sh
# Собирает mechta-prebuilt.tar.gz (backend node_modules + frontend dist) для download-prebuilt.bat
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-$ROOT/mechta-prebuilt.tar.gz}"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

docker run --rm -e HOST_UID="$(id -u)" -e HOST_GID="$(id -g)" -v "$ROOT/backend:/src:ro" -v "$WORK:/out" node:22-alpine sh -c '
  set -e
  mkdir -p /build && cd /build
  cp /src/package.json /src/package-lock.json .
  npm ci --include=dev --ignore-scripts --no-audit --no-fund
  rm -rf node_modules/@prisma/engines/dist/*.node node_modules/.cache
  find node_modules -name "*.map" -delete
  find node_modules/prisma node_modules/@prisma/client -type f \
    \( -name "*mysql*" -o -name "*sqlite*" -o -name "*sqlserver*" -o -name "*cockroachdb*" -o -name "*react-native*" \) -delete
  mkdir -p /out/backend/prebuilt && mv node_modules /out/backend/prebuilt/
  chown -R "$HOST_UID:$HOST_GID" /out
'

docker run --rm -e HOST_UID="$(id -u)" -e HOST_GID="$(id -g)" -v "$ROOT/frontend:/src:ro" -v "$WORK:/out" node:22-alpine sh -c '
  set -e
  mkdir -p /build && cd /build
  cp /src/package.json /src/package-lock.json /src/index.html /src/vite.config.js .
  cp -r /src/public /src/src .
  npm ci --include=dev --no-audit --no-fund
  npm run build
  mkdir -p /out/frontend/prebuilt && mv dist /out/frontend/prebuilt/
  chown -R "$HOST_UID:$HOST_GID" /out
'

tar -czf "$OUT" -C "$WORK" backend frontend
ls -lh "$OUT"
