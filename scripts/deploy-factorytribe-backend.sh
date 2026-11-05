#!/usr/bin/env bash
# ==============================================================================
# FactoryTribe Backend Direct Deployment Script
#
# Pushes backend code, built packages, and dependency definitions directly from
# this machine to the remote server without requiring git pull or remote builds.
# Installs dependencies, tests required dependencies, prompts for database
# migrations on the server's local PostgreSQL database, and restarts PM2 'api'.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

REMOTE_HOST="${FACTORYTRIBE_HOST:-factorytribe-server}"
REMOTE_KEY="${FACTORYTRIBE_KEY:-$HOME/.ssh/factorytribe-oracle.key}"
REMOTE_DIR="${FACTORYTRIBE_DIR:-/home/ubuntu/factorytribe}"

DO_BUILD=true
MIGRATE_CHOICE=""
DRY_RUN=false
VERBOSE=false

# Styling
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ${NC} $*"; }
log_success() { echo -e "${GREEN}✔${NC} $*"; }
log_warn() { echo -e "${YELLOW}⚠${NC} $*"; }
log_error() { echo -e "${RED}✖${NC} $*" >&2; }
log_step() { echo -e "\n${CYAN}==>${NC} ${BOLD}$*${NC}"; }

usage() {
  cat <<EOF
Usage: $(basename "$0") [OPTIONS]

Direct deployment of backend code, builds, and migrations to FactoryTribe server.

OPTIONS:
  -m, --migrate         Run database migrations on remote database without prompting
      --no-migrate      Skip database migrations without prompting
      --no-build        Skip local package build step (use existing builds)
  -n, --dry-run         Show what would be transferred without modifying remote
  -v, --verbose         Verbose transfer output
  -h, --help            Show this help message

ENVIRONMENT VARIABLES:
  FACTORYTRIBE_HOST     SSH host/alias (default: 'factorytribe-server' or 'ubuntu@130.210.44.243')
  FACTORYTRIBE_KEY      SSH private key path (default: '~/.ssh/factorytribe-oracle.key')
  FACTORYTRIBE_DIR      Remote root directory (default: '/home/ubuntu/factorytribe')

EXAMPLES:
  # Standard deployment (prompts whether to run migrations)
  ./scripts/deploy-factorytribe-backend.sh

  # Direct deployment with automatic database migration
  ./scripts/deploy-factorytribe-backend.sh --migrate

  # Fast hot-fix code push without rebuilding packages or migrating
  ./scripts/deploy-factorytribe-backend.sh --no-build --no-migrate
EOF
  exit 0
}

# Parse options
while [[ $# -gt 0 ]]; do
  case "$1" in
    -m|--migrate)
      MIGRATE_CHOICE="yes"
      shift
      ;;
    --no-migrate|--skip-migrate)
      MIGRATE_CHOICE="no"
      shift
      ;;
    --no-build)
      DO_BUILD=false
      shift
      ;;
    -n|--dry-run)
      DRY_RUN=true
      shift
      ;;
    -v|--verbose)
      VERBOSE=true
      shift
      ;;
    -h|--help)
      usage
      ;;
    *)
      log_error "Unknown option: $1"
      usage
      ;;
  esac
done

# Configure SSH
SSH_CMD="ssh"
if [[ -f "$REMOTE_KEY" ]]; then
  SSH_OPTS=(-i "$REMOTE_KEY" -o "ConnectTimeout=10")
  RSYNC_SSH="ssh -i $REMOTE_KEY"
else
  SSH_OPTS=(-o "ConnectTimeout=10")
  RSYNC_SSH="ssh"
fi

log_step "Connecting to remote server ($REMOTE_HOST)..."
if ! "$SSH_CMD" "${SSH_OPTS[@]}" -q "$REMOTE_HOST" "exit 0" 2>/dev/null; then
  # Fallback to direct IP if alias is not recognized
  FALLBACK_IP="130.210.44.243"
  FALLBACK_USER="ubuntu"
  log_warn "Host '$REMOTE_HOST' unreachable. Trying fallback '${FALLBACK_USER}@${FALLBACK_IP}'..."
  REMOTE_HOST="${FALLBACK_USER}@${FALLBACK_IP}"
  if ! "$SSH_CMD" "${SSH_OPTS[@]}" -q "$REMOTE_HOST" "exit 0" 2>/dev/null; then
    log_error "Failed to connect to $REMOTE_HOST. Please verify SSH connectivity."
    exit 1
  fi
fi
log_success "Connected to $REMOTE_HOST."

# Prompt for migrations if not pre-selected
if [[ -z "$MIGRATE_CHOICE" ]]; then
  echo ""
  echo -e "${YELLOW}${BOLD}Database Migration:${NC}"
  echo -e "Do you want to run pending database migrations on the remote server's database?"
  read -r -p "Migrate remote database? [y/N]: " user_input
  case "$user_input" in
    [yY][eE][sS]|[yY])
      MIGRATE_CHOICE="yes"
      ;;
    *)
      MIGRATE_CHOICE="no"
      ;;
  esac
fi

# Step 1: Local Package Compilation
if [[ "$DO_BUILD" == true ]]; then
  log_step "Compiling backend workspace packages locally..."
  cd "$REPO_ROOT"

  log_info "Compiling packages/types..."
  (cd packages/types && bun run build)

  log_info "Compiling packages/cli..."
  (cd packages/cli && bun run build)

  log_info "Compiling packages/core..."
  (cd packages/core && bun run build)

  log_success "All backend packages compiled locally."
else
  log_step "Skipping local compilation (--no-build)."
fi

# Step 2: Push code & builds directly to remote
log_step "Pushing backend code & local builds directly to $REMOTE_HOST:$REMOTE_DIR..."
cd "$REPO_ROOT"

RSYNC_BASE_FLAGS=(-az)
if [[ "$VERBOSE" == true ]]; then
  RSYNC_BASE_FLAGS+=(-v --progress)
fi
if [[ "$DRY_RUN" == true ]]; then
  RSYNC_BASE_FLAGS+=(--dry-run -v)
  log_warn "DRY-RUN: Inspecting transfers without modifying remote files..."
fi

# 1. Sync root dependency and config files
log_info "Pushing root dependency files (package.json, bun.lock, turbo.json)..."
rsync "${RSYNC_BASE_FLAGS[@]}" \
  -e "$RSYNC_SSH" \
  package.json bun.lock turbo.json \
  "${REMOTE_HOST}:${REMOTE_DIR}/"

# 2. Sync packages (preserving node_modules on remote, pushing local builds and removing stale artifacts)
log_info "Pushing packages/ (built dist and .medusa/server artifacts)..."
rsync "${RSYNC_BASE_FLAGS[@]}" \
  --delete \
  -e "$RSYNC_SSH" \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.turbo' \
  --exclude '*.tsbuildinfo' \
  ./packages/ \
  "${REMOTE_HOST}:${REMOTE_DIR}/packages/"

# 3. Sync apps/api (backend code)
# CRITICAL: Preserve .env and .env.production on remote server!
log_info "Pushing apps/api/ (excluding node_modules and preserving server .env)..."
rsync "${RSYNC_BASE_FLAGS[@]}" \
  --delete \
  -e "$RSYNC_SSH" \
  --exclude 'node_modules' \
  --exclude '.env*' \
  --exclude '.git' \
  --exclude '.turbo' \
  --exclude '*.tsbuildinfo' \
  ./apps/api/ \
  "${REMOTE_HOST}:${REMOTE_DIR}/apps/api/"

log_success "Direct file transfer complete."

if [[ "$DRY_RUN" == true ]]; then
  log_info "Dry-run finished. No remote changes made."
  exit 0
fi

# Step 3: Remote Dependency Installation & Verification
log_step "Installing and testing required dependencies on remote server..."
"$SSH_CMD" "${SSH_OPTS[@]}" "$REMOTE_HOST" bash -s <<'REMOTE_INSTALL'
set -euo pipefail
cd /home/ubuntu/factorytribe

echo "==> Running 'bun install' on remote workspace..."
bun install

echo "==> Testing required backend dependencies in apps/api..."
cd /home/ubuntu/factorytribe/apps/api
bun -e '
  const required = ["@google/genai", "@medusajs/medusa", "@mercurjs/core"];
  let failed = false;
  for (const pkg of required) {
    try {
      await import(pkg);
      console.log(`  ✔ Dependency "${pkg}" is installed and loads correctly.`);
    } catch (err) {
      console.error(`  ✖ Failed to load dependency "${pkg}":`, err.message);
      failed = true;
    }
  }
  if (failed) {
    process.exit(1);
  }
'
echo "✔ All required dependencies verified on remote server."
REMOTE_INSTALL
log_success "Remote dependencies installed and tested successfully."

# Step 4: Run Database Migrations (if chosen)
if [[ "$MIGRATE_CHOICE" == "yes" ]]; then
  log_step "Running database migrations against remote database..."
  "$SSH_CMD" "${SSH_OPTS[@]}" "$REMOTE_HOST" bash -s <<'REMOTE_MIGRATE'
set -euo pipefail
cd /home/ubuntu/factorytribe/apps/api

echo "==> Executing medusa db:migrate..."
./node_modules/.bin/medusa db:migrate --execute-safe-links --execute-safe-search
echo "✔ Database migrations completed."
REMOTE_MIGRATE
  log_success "Database migrations successfully applied."
else
  log_info "Skipping database migrations (user selected 'no' or passed --no-migrate)."
fi

# Step 5: Restart Backend Service & Health Check
log_step "Restarting backend PM2 process ('api')..."
"$SSH_CMD" "${SSH_OPTS[@]}" "$REMOTE_HOST" bash -s <<'REMOTE_RESTART'
set -euo pipefail

echo "==> Restarting PM2 process 'api'..."
pm2 restart api

echo "==> Waiting for backend API health check (http://localhost:9000/health)..."
HEALTHY=false
for i in {1..45}; do
  if curl -s -f http://localhost:9000/health >/dev/null 2>&1; then
    echo "✔ Backend health check OK (port 9000 responded 200 OK after $((i * 2))s)."
    HEALTHY=true
    break
  fi
  sleep 2
done

if [[ "$HEALTHY" != true ]]; then
  echo "✖ Error: Backend API did not become healthy within 90 seconds. Displaying recent logs:"
  pm2 logs api --lines 25 --nostream
  exit 1
fi
REMOTE_RESTART
log_success "Backend process restarted and healthy."

# Final Verification
log_step "Deployment Status:"
"$SSH_CMD" "${SSH_OPTS[@]}" "$REMOTE_HOST" bash -s <<'REMOTE_STATUS'
set -euo pipefail
pm2 status api
echo ""
echo "Recent logs from API:"
pm2 logs api --lines 8 --nostream
REMOTE_STATUS

echo ""
log_success "================================================================"
log_success "  FactoryTribe Backend Successfully Deployed!                   "
log_success "================================================================"
log_info "Host        : $REMOTE_HOST"
log_info "Directory   : $REMOTE_DIR"
log_info "Migrations  : $MIGRATE_CHOICE"
log_info "Health      : http://localhost:9000/health (200 OK)"
echo ""
