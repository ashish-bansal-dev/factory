#!/usr/bin/env bash
set -euo pipefail

# Mercur Public Hosting Script
# Uses Cloudflare Tunnels (cloudflared) to securely expose all services to the public internet
# without needing port forwarding, firewall configuration, or public IP.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CLOUDFLARED_BIN="${CLOUDFLARED_PATH:-$HOME/.local/bin/cloudflared}"
LOG_DIR="$REPO_ROOT/.tunnels"
PID_FILE="$LOG_DIR/tunnels.pid"
ENDPOINTS_JSON="$REPO_ROOT/public-endpoints.json"
ENDPOINTS_TXT="$REPO_ROOT/public-endpoints.txt"

mkdir -p "$LOG_DIR"

# Ensure cloudflared binary exists
if ! command -v "$CLOUDFLARED_BIN" >/dev/null 2>&1; then
  if command -v cloudflared >/dev/null 2>&1; then
    CLOUDFLARED_BIN="$(command -v cloudflared)"
  else
    echo "→ Downloading cloudflared..."
    mkdir -p "$HOME/.local/bin"
    curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64 -o "$HOME/.local/bin/cloudflared"
    chmod +x "$HOME/.local/bin/cloudflared"
    CLOUDFLARED_BIN="$HOME/.local/bin/cloudflared"
  fi
fi

stop_tunnels() {
  echo "→ Stopping all public tunnels..."
  if [ -f "$PID_FILE" ]; then
    while IFS= read -r pid; do
      if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
        kill "$pid" 2>/dev/null || true
      fi
    done < "$PID_FILE"
    rm -f "$PID_FILE"
  fi
  pkill -f "cloudflared tunnel --url" 2>/dev/null || true
  rm -f "$ENDPOINTS_JSON" "$ENDPOINTS_TXT"
  echo "✓ All tunnels stopped."
}

status_tunnels() {
  if [ -f "$ENDPOINTS_TXT" ] && pgrep -f "cloudflared tunnel --url" >/dev/null 2>&1; then
    echo "================================================================="
    echo " Mercur Public Endpoints (Active)"
    echo "================================================================="
    cat "$ENDPOINTS_TXT"
    echo "================================================================="
  else
    echo "No active tunnels running."
  fi
}

if [ "${1:-}" = "stop" ]; then
  stop_tunnels
  exit 0
fi

if [ "${1:-}" = "status" ]; then
  status_tunnels
  exit 0
fi

# Stop any previous tunnels
stop_tunnels >/dev/null 2>&1 || true

echo "→ Checking local service availability..."
SERVICES=(
  "API:9000:http://127.0.0.1:9000/health"
  "Admin:7001:http://127.0.0.1:7001/dashboard"
  "Vendor:7002:http://127.0.0.1:7002/seller"
  "Storefront:8000:http://127.0.0.1:8000"
)

for svc in "${SERVICES[@]}"; do
  IFS=":" read -r name port url <<< "$svc"
  if curl -s -m 2 "$url" >/dev/null 2>&1; then
    echo "  ✓ $name is running on port $port"
  else
    echo "  ⚠️  $name is not responding on port $port ($url)"
  fi
done

echo ""
echo "→ Launching Cloudflare Tunnels for all services..."

start_tunnel() {
  local name="$1"
  local port="$2"
  local log_file="$LOG_DIR/$name.log"
  rm -f "$log_file"

  setsid "$CLOUDFLARED_BIN" tunnel \
    --url "http://127.0.0.1:$port" \
    --protocol http2 \
    --metrics "127.0.0.1:0" \
    --http-host-header "localhost:$port" \
    --no-autoupdate < /dev/null > "$log_file" 2>&1 &
  local pid=$!
  echo "$pid" >> "$PID_FILE"
}

start_tunnel "storefront" 8000
start_tunnel "admin" 7001
start_tunnel "vendor" 7002
start_tunnel "api" 9000

echo "→ Connecting tunnels and waiting for registration..."

extract_url() {
  local name="$1"
  local log_file="$LOG_DIR/$name.log"
  local url=""
  local attempts=0

  while [ $attempts -lt 30 ]; do
    if [ -f "$log_file" ]; then
      url=$(grep -o 'https://[a-zA-Z0-9.-]*\.trycloudflare\.com' "$log_file" | head -n 1 || true)
      if [ -n "$url" ] && grep -q "Registered tunnel connection" "$log_file"; then
        echo "$url"
        return 0
      fi
    fi
    sleep 1
    attempts=$((attempts + 1))
  done

  # Fallback if URL found even if log grep for registration didn't match yet
  if [ -n "$url" ]; then
    echo "$url"
    return 0
  fi

  echo "TIMEOUT"
  return 1
}

STOREFRONT_URL=$(extract_url "storefront")
ADMIN_URL=$(extract_url "admin")
VENDOR_URL=$(extract_url "vendor")
API_URL=$(extract_url "api")

# Save to JSON
cat > "$ENDPOINTS_JSON" <<EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "storefront": "$STOREFRONT_URL",
  "admin": "$ADMIN_URL/dashboard",
  "vendor": "$VENDOR_URL/seller",
  "api": "$API_URL"
}
EOF

# Save to TXT
cat > "$ENDPOINTS_TXT" <<EOF
  🛍️  Storefront:       $STOREFRONT_URL
  ⚙️  Admin Dashboard:  $ADMIN_URL/dashboard
  🏢  Vendor Hub:       $VENDOR_URL/seller
  🔌  Medusa API:       $API_URL
EOF

echo ""
echo "=========================================================================="
echo "           🚀 MERCUR IS LIVE ON THE PUBLIC INTERNET 🚀                    "
echo "=========================================================================="
cat "$ENDPOINTS_TXT"
echo "=========================================================================="
echo "• URLs are secured with Cloudflare HTTPS certificates."
echo "• Admin and Vendor dashboards automatically proxy API requests to backend."
echo "• To stop all tunnels: ./scripts/host-public.sh stop"
echo "• To check status:     ./scripts/host-public.sh status"
echo "=========================================================================="

# If running as daemon flag, exit cleanly and leave tunnels in background
if [ "${1:-}" = "--daemon" ]; then
  echo "Tunnels running in background (PID file: $PID_FILE)."
  exit 0
fi

# Trap Ctrl+C and exit signals
cleanup() {
  echo ""
  stop_tunnels
  exit 0
}
trap cleanup INT TERM EXIT

echo ""
echo "Press Ctrl+C to stop public hosting."
while true; do
  sleep 5
  # Verify tunnels are alive
  if ! pgrep -f "cloudflared tunnel --url" >/dev/null 2>&1; then
    echo "⚠️  Tunnel process exited unexpectedly."
    exit 1
  fi
done
