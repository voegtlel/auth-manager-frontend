#!/bin/bash

if [[ -n "$PROXY_API_HOST" ]]; then
  echo "Setting PROXY_API_HOST=$PROXY_API_HOST"
  envsubst '$PROXY_API_HOST' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf
  export API_HOST=""
else
  export API_HOST="${API_HOST:-/api}"
fi

echo "Setting API_HOST=$API_HOST"
envsubst '$API_HOST' < /usr/share/nginx/html/env.js.template > /usr/share/nginx/html/client/env.js
echo "Setting OICD_ISSUER=$OICD_ISSUER"
envsubst '$OICD_ISSUER' < /usr/share/nginx/html/env.js.template > /usr/share/nginx/html/client/env.js
echo "Setting OICD_CLIENT_ID=$OICD_CLIENT_ID"
envsubst '$OICD_CLIENT_ID' < /usr/share/nginx/html/env.js.template > /usr/share/nginx/html/client/env.js

nginx -g "daemon off;"
