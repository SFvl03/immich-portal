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

PORTAL_USER="${PORTAL_USER:-guest}"
: "${PORTAL_PASSWORD:?Set PORTAL_PASSWORD to protect this portal with Basic Auth — see README}"

# Basic Auth: guests must enter PORTAL_USER/PORTAL_PASSWORD before the page loads at all.
htpasswd -bc /etc/nginx/.htpasswd "$PORTAL_USER" "$PORTAL_PASSWORD"

export ALBUMS UPLOAD_URL PORTAL_TITLE

envsubst '${ALBUMS} ${UPLOAD_URL} ${PORTAL_TITLE}' \
  < /usr/share/nginx/html/config.js.template \
  > /usr/share/nginx/html/config.js

# Only PORTAL_TITLE is substituted here — nginx variables like $uri are left untouched.
envsubst '${PORTAL_TITLE}' \
  < /etc/nginx/templates/portal.conf.template \
  > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
