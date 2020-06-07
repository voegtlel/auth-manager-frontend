<a href="https://cloud.docker.com/repository/docker/voegtlel/auth-manager-frontend/builds">
  <img src="https://img.shields.io/docker/cloud/build/voegtlel/auth-manager-frontend.svg" alt="Docker build status" />
</a>
<img src="https://img.shields.io/github/license/voegtlel/auth-manager-frontend.svg" alt="License" />

# Client for user authentication and management

This is the frontend for [auth-manager-backend](https://github.com/voegtlel/auth-manager-backend).

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Docker

The docker image is located at `voegtlel/auth-manager-frontend`.

# Docker compose

```
version: '3'
services:
  frontend:
    image: voegtlel/auth-manager-frontend
    restart: unless-stopped
    environment:
      # Forward backend to /api
      # (will set API_HOST='/api')
      PROXY_API_HOST: backend
      # Set this if you're behind a reverse proxy:
      # REAL_IP_RECURSIVE: on
      # REAL_IP_HEADER: X-Real-Ip  # default: X-Real-Ip
      # OR: Host backend at separate URL:
      # API_HOST: 'auth.example.com'
      OICD_ISSUER: 'auth.example.com'
      OICD_CLIENT_ID: 'manager'
    port:
      # Serve at :80, you may for sure also use a reverse proxy, etc.
      - 80:80
    networks:
      - backend

  backend:
    image: voegtlel/auth-manager-backend
    restart: unless-stopped
    volumes:
      - ./key.private:/app/key.private
    environment:
      # Override any config.yaml variable by typing API_CONFIG_<container>_<container...>_<variable>
      # where the names are automagically converted from camelCase to underscore_notation (ignoring casing).

      # Set this if you use different origin
      # API_CONFIG_ALLOW_ORIGINS: "['https://auth.example.com']"

      API_CONFIG_MONGO_URI: "mongodb://auth:<mongopw>@mongo/auth"

      # Generate this by: `openssl genrsa -out key.private 4096`
      API_CONFIG_OAUTH2_KEYS_0_KEY_FILE: '/app/key.private'
      API_CONFIG_OAUTH2_BASE_URL: 'https://auth.example.com'
      API_CONFIG_OAUTH2_ISSUER: 'auth.example.com'
      API_CONFIG_OAUTH2_MAIL_DOMAIN: 'example.com'
      API_CONFIG_OAUTH2_MAIL_API_KEY: 'generate random string here'
      API_CONFIG_MANAGER_BACKEND_CORS_ORIGIN: 'https://auth.example.com'
      API_CONFIG_MANAGER_BACKEND_BASE_URL: 'https://auth.example.com/manager'
      API_CONFIG_MANAGER_FRONTEND_BASE_URL: 'https://auth.example.com'
      API_CONFIG_MANAGER_SECRET_KEY: <generate a random string here>
      API_CONFIG_MANAGER_NAME: "My User Manager"
      API_CONFIG_MANAGER_OAUTH2_SERVER_METADATA_URL: "https://auth.example.com/.well-known/openid-configuration"
      API_CONFIG_MANAGER_OAUTH2_CLIENT_ID: "manager"

      API_CONFIG_MANAGER_MAIL_HOST: "mailhost"
      API_CONFIG_MANAGER_MAIL_SENDER: "account@example.com"
    networks:
      - backend
      # May need internet access for pwned password checks
      - default

  mongo:
    image: mongo
    volumes:
      - ./db:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: auth
      MONGO_INITDB_ROOT_PASSWORD: <mongopw>
    networks:
      - backend
networks:
  backend:
```

## Installing

Run:

```
docker-compose exec backend python -m user_manager.install
```

to create the initial `admin` user and reset the database.

# License

MIT
