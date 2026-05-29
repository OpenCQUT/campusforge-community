#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  scripts/update-server.sh --host <ssh-host> [options]

Options:
  --host <ssh-host>       SSH host alias or user@host.
  --repo-url <url>        Git repository URL. Default: current origin URL.
  --branch <branch>       Branch to deploy. Default: main.
  --remote-dir <path>     Remote application directory. Default: /opt/campusforge.
  --schedule <cron>       Cron schedule for --install-nightly. Default: "30 3 * * *".
  --install-nightly       Install a nightly server-side update cron.
  --skip-immediate        With --install-nightly, install cron without running an update now.
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
REPO_URL=""
BRANCH="main"
REMOTE_DIR="/opt/campusforge"
SCHEDULE="30 3 * * *"
INSTALL_NIGHTLY="false"
SKIP_IMMEDIATE="false"

while [ "$#" -gt 0 ]; do
  case "$1" in
    --host)
      HOST_NAME="${2:-}"
      shift 2
      ;;
    --repo-url)
      REPO_URL="${2:-}"
      shift 2
      ;;
    --branch)
      BRANCH="${2:-}"
      shift 2
      ;;
    --remote-dir)
      REMOTE_DIR="${2:-}"
      shift 2
      ;;
    --schedule)
      SCHEDULE="${2:-}"
      shift 2
      ;;
    --install-nightly)
      INSTALL_NIGHTLY="true"
      shift
      ;;
    --skip-immediate)
      SKIP_IMMEDIATE="true"
      shift
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

if [ -z "$HOST_NAME" ]; then
  usage >&2
  exit 1
fi

if [ -z "$REPO_URL" ]; then
  REPO_URL="$(git config --get remote.origin.url || true)"
fi

if [ -z "$REPO_URL" ]; then
  echo "Repository URL was not provided and remote.origin.url is not configured." >&2
  exit 1
fi

require_command ssh
require_command scp

STAMP="$(date +%Y%m%d%H%M%S)"
LOCAL_SCRIPT="$(mktemp -t "campusforge-update-$STAMP.XXXXXX.sh")"
REMOTE_SCRIPT="/tmp/campusforge-update-$STAMP.sh"

cleanup() {
  rm -f "$LOCAL_SCRIPT"
}
trap cleanup EXIT

cat > "$LOCAL_SCRIPT" <<'REMOTE_SCRIPT_EOF'
#!/usr/bin/env bash
set -euo pipefail

MODE="$1"
REMOTE_DIR="$2"
REPO_URL="$3"
BRANCH="$4"
SCHEDULE="$5"
SKIP_IMMEDIATE="$6"

APP_DIR="$REMOTE_DIR/app"
ENV_FILE="$REMOTE_DIR/.env"
CONFIG_FILE="$REMOTE_DIR/config.toml"
UPDATE_SCRIPT="$REMOTE_DIR/update.sh"
LOG_FILE="$REMOTE_DIR/update.log"
CRON_TAG="campusforge-nightly-update"

write_update_script() {
  sudo mkdir -p "$REMOTE_DIR"
  sudo chown -R "${SUDO_USER:-$USER}:${SUDO_USER:-$USER}" "$REMOTE_DIR"

  cat > "$UPDATE_SCRIPT" <<UPDATEEOF
#!/usr/bin/env bash
set -euo pipefail

REMOTE_DIR="$REMOTE_DIR"
APP_DIR="$APP_DIR"
ENV_FILE="$ENV_FILE"
CONFIG_FILE="$CONFIG_FILE"
REPO_URL="$REPO_URL"
BRANCH="$BRANCH"
LOG_FILE="$LOG_FILE"
LOCK_FILE="\$REMOTE_DIR/update.lock"

exec 9>"\$LOCK_FILE"
if ! flock -n 9; then
  echo "[\$(date -Is)] another update is already running"
  exit 0
fi

echo "[\$(date -Is)] starting campusforge update"

if ! command -v git >/dev/null 2>&1; then
  echo "git is required on the server" >&2
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required on the server" >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "docker compose is required on the server" >&2
  exit 1
fi

if [ ! -f "\$ENV_FILE" ] || [ ! -f "\$CONFIG_FILE" ]; then
  echo "\$ENV_FILE and \$CONFIG_FILE must exist before updates can run" >&2
  exit 1
fi

mkdir -p "\$REMOTE_DIR"

if [ ! -d "\$APP_DIR/.git" ]; then
  BACKUP_DIR="\$APP_DIR.backup.\$(date +%Y%m%d%H%M%S)"
  if [ -d "\$APP_DIR" ]; then
    mv "\$APP_DIR" "\$BACKUP_DIR"
    echo "[\$(date -Is)] moved existing app tree to \$BACKUP_DIR"
  fi
  git clone --branch "\$BRANCH" --single-branch "\$REPO_URL" "\$APP_DIR"
else
  cd "\$APP_DIR"
  git fetch origin "\$BRANCH"
  git checkout "\$BRANCH"
  git reset --hard "origin/\$BRANCH"
fi

cd "\$APP_DIR"
docker compose --env-file "\$ENV_FILE" -f docker-compose.prod.yml up -d --build

wait_for_url() {
  local url="\$1"
  local label="\$2"

  for attempt in \$(seq 1 30); do
    if curl -fsS "\$url" >/dev/null; then
      echo "[\$(date -Is)] \$label is healthy"
      return 0
    fi

    echo "[\$(date -Is)] waiting for \$label (\$attempt/30)"
    sleep 2
  done

  echo "\$label did not become healthy" >&2
  return 1
}

wait_for_url http://127.0.0.1:4000/v1/health api
wait_for_url http://127.0.0.1:3000/zh web

docker compose --env-file "\$ENV_FILE" -f docker-compose.prod.yml ps
echo "[\$(date -Is)] campusforge update completed"
UPDATEEOF

  chmod 700 "$UPDATE_SCRIPT"
}

install_cron() {
  write_update_script
  CRON_LINE="$SCHEDULE $UPDATE_SCRIPT >> $LOG_FILE 2>&1 # $CRON_TAG"
  (crontab -l 2>/dev/null | grep -v "$CRON_TAG" || true; echo "$CRON_LINE") | crontab -
  echo "Installed nightly update: $CRON_LINE"
}

run_update() {
  write_update_script
  "$UPDATE_SCRIPT"
}

case "$MODE" in
  install)
    install_cron
    if [ "$SKIP_IMMEDIATE" != "true" ]; then
      run_update
    fi
    ;;
  run)
    run_update
    ;;
  *)
    echo "unknown mode: $MODE" >&2
    exit 1
    ;;
esac
REMOTE_SCRIPT_EOF

MODE="run"
if [ "$INSTALL_NIGHTLY" = "true" ]; then
  MODE="install"
fi

scp "$LOCAL_SCRIPT" "$HOST_NAME:$REMOTE_SCRIPT"
ssh "$HOST_NAME" "chmod +x '$REMOTE_SCRIPT' && '$REMOTE_SCRIPT' '$MODE' '$REMOTE_DIR' '$REPO_URL' '$BRANCH' '$SCHEDULE' '$SKIP_IMMEDIATE'"
