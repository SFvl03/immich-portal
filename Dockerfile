FROM nginx:alpine

# gettext provides envsubst, used to inject the two guest URLs at container start
RUN apk add --no-cache gettext

COPY html /usr/share/nginx/html
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
