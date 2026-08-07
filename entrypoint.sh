#!/bin/sh
set -e

# ALBUMS format: "Name|URL;Name|URL;..." — one tab per album.
# Falls back to a single album built from IMMICH_URL for backward compatibility.
if [ -z "$ALBUMS" ]; then
  : "${IMMICH_URL:?Set ALBUMS (or IMMICH_URL for a single album) — see README}"
  ALBUMS="View & Save|${IMMICH_URL}"
fi

PORTAL_TITLE="${PORTAL_TITLE:-Photo Portal}"
UPLOAD_URL="${UPLOAD_URL:-}"

export ALBUMS UPLOAD_URL PORTAL_TITLE

envsubst '${ALBUMS} ${UPLOAD_URL} ${PORTAL_TITLE}' \
  < /usr/share/nginx/html/config.js.template \
  > /usr/share/nginx/html/config.js

exec nginx -g 'daemon off;'
