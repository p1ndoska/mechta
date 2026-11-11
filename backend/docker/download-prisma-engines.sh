#!/bin/sh
set -e

COMMIT="${PRISMA_ENGINE_COMMIT:-c2990dca591cba766e3b7ef5d9e8a84796e47ab7}"
TARGET="${PRISMA_ENGINE_TARGET:-linux-musl-openssl-3.0.x}"
DEST="${1:-/opt/prisma-engines}"
# Файлы, скачанные вручную (см. prisma-engines/README.txt)
LOCAL_DIR="${PRISMA_ENGINES_LOCAL_DIR:-/tmp/local-engines}"

MIRRORS="
https://binaries.prisma.sh
https://registry.npmmirror.com/-/binary/prisma
"

mkdir -p "$DEST"

WGET_OPTS="-T 120"
if [ "$WGET_INSECURE" = "1" ]; then
  WGET_OPTS="$WGET_OPTS --no-check-certificate"
fi

use_local_file() {
  file="$1"
  output="$2"

  for candidate in "$LOCAL_DIR/${file}.gz" "$LOCAL_DIR/$(basename "$output").gz"; do
    if [ -s "$candidate" ]; then
      echo "Using local $candidate"
      gunzip -c "$candidate" > "$output"
      return 0
    fi
  done

  for candidate in "$LOCAL_DIR/${file}" "$LOCAL_DIR/$(basename "$output")"; do
    if [ -s "$candidate" ]; then
      echo "Using local $candidate"
      cp "$candidate" "$output"
      return 0
    fi
  done

  return 1
}

download_file() {
  file="$1"
  output="$2"

  if use_local_file "$file" "$output"; then
    return 0
  fi

  for mirror in $MIRRORS; do
    url="$mirror/all_commits/$COMMIT/$TARGET/${file}.gz"
    rm -f "/tmp/${file}.gz"
    for attempt in 1 2 3; do
      echo "Trying $url (attempt $attempt)"
      # -c докачивает файл после обрыва соединения
      if wget $WGET_OPTS -c "$url" -O "/tmp/${file}.gz" && gunzip -t "/tmp/${file}.gz" 2>/dev/null; then
        gunzip -c "/tmp/${file}.gz" > "$output"
        rm -f "/tmp/${file}.gz"
        echo "Downloaded $file"
        return 0
      fi
    done
    rm -f "/tmp/${file}.gz"
  done

  echo "Failed to download $file from all mirrors."
  echo "Download it in a browser and put it into backend/prisma-engines/ (see README.txt):"
  echo "  https://binaries.prisma.sh/all_commits/$COMMIT/$TARGET/${file}.gz"
  return 1
}

download_file "schema-engine" "$DEST/schema-engine-linux-musl-openssl-3.0.x"
download_file "libquery_engine.so.node" "$DEST/libquery_engine-linux-musl-openssl-3.0.x.so.node"

chmod +x "$DEST/schema-engine-linux-musl-openssl-3.0.x"
