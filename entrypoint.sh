#!/bin/sh
set -e

: "${IMMICH_URL:?Set IMMICH_URL to your Immich share link}"
: "${UPLOAD_URL:?Set UPLOAD_URL to your public upload/proxy link}"
PORTAL_TITLE="${PORTAL_TITLE:-Photo Portal}"

export IMMICH_URL UPLOAD_URL PORTAL_TITLE

envsubst '${IMMICH_URL} ${UPLOAD_URL} ${PORTAL_TITLE}' \
  < /usr/share/nginx/html/config.js.template \
  > /usr/share/nginx/html/config.js

exec nginx -g 'daemon off;'
