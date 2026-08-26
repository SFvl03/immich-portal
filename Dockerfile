FROM nginx:alpine

# gettext provides envsubst, used to inject runtime config at container start.
# apache2-utils provides htpasswd, used to generate the Basic Auth password file.
RUN apk add --no-cache gettext apache2-utils

COPY html /usr/share/nginx/html
COPY nginx/portal.conf.template /etc/nginx/templates/portal.conf.template
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
