#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/deploy.sh --host <ssh-host> --domain <domain> --cert-zip <path>

Options:
  --host <ssh-host>       SSH host alias or user@host.
  --domain <domain>       Public domain served by Nginx.
  --cert-zip <path>       Nginx certificate zip containing <domain>_bundle.crt and <domain>.key.
  --remote-dir <path>     Remote application directory. Default: /opt/campusforge.
  --web-port <port>       Local web port on the server. Default: 3000.
  --api-port <port>       Local API port on the server. Default: 4000.
  -h, --help              Show this help.
EOF
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Required command '$1' was not found in PATH." >&2
    exit 1
  fi
}

HOST_NAME=""
DOMAIN=""
CERT_ZIP=""
REMOTE_DIR="/opt/campusforge"
WEB_PORT="3000"
API_PORT="4000"

while [ "$#" -gt 0 ]; do
  case "$1" in
    --host)
      HOST_NAME="${2:-}"
      shift 2
      ;;
    --domain)
      DOMAIN="${2:-}"
      shift 2
      ;;
    --cert-zip)
      CERT_ZIP="${2:-}"
      shift 2
      ;;
    --remote-dir)
      REMOTE_DIR="${2:-}"
      shift 2
      ;;
    --web-port)
      WEB_PORT="${2:-}"
      shift 2
      ;;
    --api-port)
      API_PORT="${2:-}"
      shift 2
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [ -z "$HOST_NAME" ] || [ -z "$DOMAIN" ] || [ -z "$CERT_ZIP" ]; then
  usage >&2
  exit 1
fi

if [ ! -f "$CERT_ZIP" ]; then
  echo "Certificate zip not found: $CERT_ZIP" >&2
  exit 1
fi

require_command ssh
require_command scp
require_command tar

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
STAMP="$(date +%Y%m%d%H%M%S)"
ARCHIVE="$(mktemp -t "campusforge-$STAMP.XXXXXX.tar.gz")"
REMOTE_ARCHIVE="/tmp/campusforge-$STAMP.tar.gz"
REMOTE_CERT="/tmp/campusforge-cert-$STAMP.zip"
REMOTE_SCRIPT="/tmp/campusforge-deploy-$STAMP.sh"

cleanup() {
  rm -f "$ARCHIVE"
}
trap cleanup EXIT

(
  cd "$REPO_ROOT"
  tar \
    --exclude=".git" \
    --exclude=".campusforge-data" \
    --exclude=".next" \
    --exclude=".pnpm-store" \
    --exclude=".turbo" \
    --exclude="build" \
    --exclude="coverage" \
    --exclude="dist" \
    --exclude="node_modules" \
    --exclude=".env" \
    --exclude=".env.*" \
    --exclude="config.toml" \
    --exclude="*.log" \
    --exclude="*.tsbuildinfo" \
    -czf "$ARCHIVE" .
)

REMOTE_PAYLOAD="$(mktemp)"
cat > "$REMOTE_PAYLOAD" <<'REMOTE_SCRIPT_EOF'
#!/usr/bin/env bash
set -euo pipefail

DOMAIN="$1"
REMOTE_DIR="$2"
ARCHIVE="$3"
CERT_ZIP="$4"
WEB_PORT="$5"
API_PORT="$6"
APP_USER="${SUDO_USER:-$USER}"
APP_DIR="$REMOTE_DIR/app"
ENV_FILE="$REMOTE_DIR/.env"
CONFIG_FILE="$REMOTE_DIR/config.toml"
SSL_DIR="/etc/nginx/ssl/$DOMAIN"
SITE_FILE="/etc/nginx/sites-available/$DOMAIN.conf"
ENABLED_FILE="/etc/nginx/sites-enabled/$DOMAIN.conf"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required on the server" >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "docker compose is required on the server" >&2
  exit 1
fi

sudo mkdir -p "$REMOTE_DIR" "$SSL_DIR"
sudo chown -R "$APP_USER:$APP_USER" "$REMOTE_DIR"

rm -rf "$APP_DIR.new"
mkdir -p "$APP_DIR.new"
tar -xzf "$ARCHIVE" -C "$APP_DIR.new"
rm -rf "$APP_DIR"
mv "$APP_DIR.new" "$APP_DIR"

if [ ! -f "$ENV_FILE" ]; then
  SESSION_SECRET="$(openssl rand -hex 32)"
  cat > "$ENV_FILE" <<ENVEOF
NODE_ENV=production
WEB_PORT=$WEB_PORT
API_PORT=$API_PORT
NEXT_PUBLIC_API_BASE_URL=https://$DOMAIN/v1
NEXT_PUBLIC_ADMIN_EMAIL=admin@$DOMAIN
CAMPUSFORGE_SESSION_SECRET=$SESSION_SECRET
NEXT_PUBLIC_DEBUG=false
CORS_ORIGIN=https://$DOMAIN,https://www.$DOMAIN
REPOSITORY_MODE=mock
CAMPUSFORGE_ENV_FILE=$ENV_FILE
CAMPUSFORGE_CONFIG_FILE=$CONFIG_FILE
CAMPUSFORGE_DATA_DIR=$REMOTE_DIR/data
CAMPUSFORGE_LOG_DIR=$REMOTE_DIR/logs
ENVEOF
  chmod 600 "$ENV_FILE"
fi

if [ ! -f "$CONFIG_FILE" ]; then
  SESSION_SECRET="$(grep '^CAMPUSFORGE_SESSION_SECRET=' "$ENV_FILE" | cut -d= -f2-)"
  cat > "$CONFIG_FILE" <<TOMLEOF
[admin]
emails = ["admin@$DOMAIN"]
password = ""

[github]
org = "OpenCQUT"
token = ""
client_id = ""
client_secret = ""

[app]
debug = false
session_secret = "$SESSION_SECRET"

[storage]
data_dir = "$REMOTE_DIR/data"
log_dir = "$REMOTE_DIR/logs"

[email]
mode = "smtp"
from = ""
host = ""
port = 587
secure = false
user = ""
pass = ""

[verification]
code_ttl_minutes = 10
resend_cooldown_seconds = 60
TOMLEOF
  chmod 600 "$CONFIG_FILE"
fi

CERT_TMP="$(mktemp -d)"
if command -v unzip >/dev/null 2>&1; then
  unzip -q "$CERT_ZIP" -d "$CERT_TMP"
elif command -v python3 >/dev/null 2>&1; then
  python3 -m zipfile -e "$CERT_ZIP" "$CERT_TMP"
else
  echo "unzip or python3 is required to extract the certificate zip" >&2
  exit 1
fi

CRT_FILE="$(find "$CERT_TMP" -type f -name "${DOMAIN}_bundle.crt" | head -n 1)"
PEM_FILE="$(find "$CERT_TMP" -type f -name "${DOMAIN}_bundle.pem" | head -n 1)"
KEY_FILE="$(find "$CERT_TMP" -type f -name "${DOMAIN}.key" | head -n 1)"

if [ -z "$CRT_FILE" ] || [ -z "$KEY_FILE" ]; then
  echo "certificate zip must contain ${DOMAIN}_bundle.crt and ${DOMAIN}.key" >&2
  exit 1
fi

sudo cp "$CRT_FILE" "$SSL_DIR/${DOMAIN}_bundle.crt"
if [ -n "$PEM_FILE" ]; then
  sudo cp "$PEM_FILE" "$SSL_DIR/${DOMAIN}_bundle.pem"
fi
sudo cp "$KEY_FILE" "$SSL_DIR/${DOMAIN}.key"
sudo chmod 644 "$SSL_DIR/${DOMAIN}_bundle.crt" "$SSL_DIR/${DOMAIN}_bundle.pem" 2>/dev/null || true
sudo chmod 600 "$SSL_DIR/${DOMAIN}.key"

cat > /tmp/campusforge-nginx.conf <<NGINXEOF
map \$http_upgrade \$connection_upgrade {
  default upgrade;
  '' close;
}

upstream campusforge_web {
  server 127.0.0.1:$WEB_PORT;
  keepalive 32;
}

upstream campusforge_api {
  server 127.0.0.1:$API_PORT;
  keepalive 16;
}

server {
  listen 80;
  server_name $DOMAIN www.$DOMAIN;

  location / {
    return 301 https://\$host\$request_uri;
  }
}

server {
  listen 443 ssl;
  server_tokens off;
  keepalive_timeout 5;
  server_name $DOMAIN www.$DOMAIN;

  access_log /var/log/nginx/$DOMAIN.log;
  error_log /var/log/nginx/$DOMAIN.error.log;

  ssl_certificate $SSL_DIR/${DOMAIN}_bundle.crt;
  ssl_certificate_key $SSL_DIR/${DOMAIN}.key;
  ssl_session_timeout 5m;
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:HIGH:!aNULL:!MD5:!RC4:!DHE;
  ssl_prefer_server_ciphers on;

  client_max_body_size 2m;

  location /v1/ {
    proxy_pass http://campusforge_api;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Host \$host;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_read_timeout 60s;
    proxy_send_timeout 60s;
  }

  location / {
    proxy_pass http://campusforge_web;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Host \$host;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection \$connection_upgrade;
    proxy_read_timeout 60s;
    proxy_send_timeout 60s;
  }
}
NGINXEOF

sudo mv /tmp/campusforge-nginx.conf "$SITE_FILE"
sudo ln -sfn "$SITE_FILE" "$ENABLED_FILE"

cd "$APP_DIR"
docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml up -d --build
sudo nginx -t
sudo systemctl reload nginx

rm -rf "$CERT_TMP" "$ARCHIVE" "$CERT_ZIP"
docker compose --env-file "$ENV_FILE" -f docker-compose.prod.yml ps
REMOTE_SCRIPT_EOF

trap 'cleanup; rm -f "$REMOTE_PAYLOAD"' EXIT

scp "$ARCHIVE" "$HOST_NAME:$REMOTE_ARCHIVE"
scp "$CERT_ZIP" "$HOST_NAME:$REMOTE_CERT"
scp "$REMOTE_PAYLOAD" "$HOST_NAME:$REMOTE_SCRIPT"
ssh "$HOST_NAME" "chmod +x '$REMOTE_SCRIPT' && '$REMOTE_SCRIPT' '$DOMAIN' '$REMOTE_DIR' '$REMOTE_ARCHIVE' '$REMOTE_CERT' '$WEB_PORT' '$API_PORT'"
