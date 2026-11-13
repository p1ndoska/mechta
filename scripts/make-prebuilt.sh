#!/bin/sh
# Собирает frontend/dist (коммитится в git) и архив backend node_modules для download-prebuilt.bat
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

docker run --rm -e HOST_UID="$(id -u)" -e HOST_GID="$(id -g)" -v "$ROOT/backend:/src:ro" -v "$WORK:/out" node:22-alpine sh -c '
  set -e
  mkdir -p /build && cd /build
  cp /src/package.json /src/package-lock.json .
  npm ci --include=dev --ignore-scripts --no-audit --no-fund
  rm -rf node_modules/@prisma/engines/dist/*.node node_modules/.cache node_modules/.bin
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
  rm -rf /out/frontend-dist && mv dist /out/frontend-dist
  chown -R "$HOST_UID:$HOST_GID" /out
'
rm -rf "$ROOT/frontend/dist" && mv "$WORK/frontend-dist" "$ROOT/frontend/dist"
echo "frontend/dist обновлен"

# Имя зависит только от package-lock.json: архив меняется только при смене зависимостей backend
NAME="mechta-backend-$(sha256sum "$ROOT/backend/package-lock.json" | cut -c1-12).tar.gz"
OUT="${1:-$ROOT}/$NAME"
tar -czf "$OUT" -C "$WORK" backend
printf '%s' "$NAME" > "$ROOT/prebuilt.txt"
ls -lh "$OUT"
echo "Если $NAME еще нет в релизе: gh release upload images \"$OUT\""
echo "Закоммитьте frontend/dist и prebuilt.txt"
