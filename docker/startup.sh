#!/bin/bash

if [[ -n "$PROXY_API_HOST" ]]; then
  echo "Setting PROXY_API_HOST=$PROXY_API_HOST"
  envsubst '$PROXY_API_HOST' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf
  export API_HOST="/api/v1/manager"
else
  export API_HOST="${API_HOST:-/api/v1/manager}"
fi

echo "Setting API_HOST=$API_HOST"
echo "Setting OICD_ISSUER=$OICD_ISSUER"
echo "Setting OICD_CLIENT_ID=$OICD_CLIENT_ID"
envsubst '$API_HOST $OICD_ISSUER $OICD_CLIENT_ID' < /usr/share/nginx/html/env.js.template > /usr/share/nginx/html/authlib-usermanager-frontend/env.js

nginx -g "daemon off;"
