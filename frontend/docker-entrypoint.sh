#!/bin/sh
set -e
# Docker Compose: BACKEND_HOST=backend (service DNS). ECS Fargate (same task): 127.0.0.1.
export BACKEND_HOST="${BACKEND_HOST:-127.0.0.1}"
mkdir -p /etc/nginx/conf.d
envsubst '${BACKEND_HOST}' </etc/nginx/templates/default.conf.template >/etc/nginx/conf.d/default.conf
# -e: pre-config errors avoid compiled-in /var/log/nginx/error.log (not writable as appuser).
exec su-exec appuser nginx -e /tmp/nginx-emerg.log -g 'daemon off;'
