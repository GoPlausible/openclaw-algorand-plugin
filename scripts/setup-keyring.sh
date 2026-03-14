#!/usr/bin/env bash
set -e

MODE="${1:---detect}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_DIR="$(dirname "$SCRIPT_DIR")"
NODE_MODULES="$PLUGIN_DIR/node_modules"
BACKUP_SCRIPT="$SCRIPT_DIR/backup-keyring.js"
WALLET_DB="$HOME/.algorand-mcp/wallet.db"

# ═══════════════════════════════════════════════════════════
# 1. OS Detection
# ═══════════════════════════════════════════════════════════
if [[ "$(uname -s)" != "Linux" ]]; then
  case "$(uname -s)" in
    Darwin)  BACKEND="macOS Keychain" ;;
    *)       BACKEND="OS Keychain" ;;
  esac
  if [ "$MODE" = "--detect" ]; then
    echo "PLATFORM=$(uname -s | tr '[:upper:]' '[:lower:]')"
    echo "BACKEND=$BACKEND"
    echo "PERSISTENT=true"
    echo "HEADLESS=false"
  else
    echo ""
    echo "  ✅ $BACKEND — persistent by default. No setup needed."
    echo ""
  fi
  exit 0
fi

# ═══════════════════════════════════════════════════════════
# 2. Linux Environment Detection
# ═══════════════════════════════════════════════════════════

PLATFORM="linux"
KEYRING_DIR="$HOME/.local/share/keyrings"

# Display (headless?)
HAS_DISPLAY=false
[[ -n "${DISPLAY:-}" || -n "${WAYLAND_DISPLAY:-}" ]] && HAS_DISPLAY=true

# D-Bus session
HAS_DBUS=false
[[ -n "${DBUS_SESSION_BUS_ADDRESS:-}" ]] && HAS_DBUS=true

# GNOME Keyring daemon running
KEYRING_RUNNING=false
pgrep -u "$USER" gnome-keyring-daemon >/dev/null 2>&1 && KEYRING_RUNNING=true

# Keyring files on disk
KEYRING_FILES=false
[[ -d "$KEYRING_DIR" && "$(ls -A "$KEYRING_DIR" 2>/dev/null)" ]] && KEYRING_FILES=true

# Wallet DB exists and account count (via Node.js)
WALLET_DB_EXISTS=false
WALLET_DB_COUNT=0
[[ -f "$WALLET_DB" ]] && WALLET_DB_EXISTS=true
if [[ "$WALLET_DB_EXISTS" == "true" && -f "$BACKUP_SCRIPT" ]]; then
  WALLET_DB_COUNT=$(NODE_PATH="$NODE_MODULES" node "$BACKUP_SCRIPT" count 2>/dev/null || echo "0")
fi

# Package manager
PKG=""
if command -v apt >/dev/null 2>&1; then
  PKG="apt"
elif command -v dnf >/dev/null 2>&1; then
  PKG="dnf"
elif command -v yum >/dev/null 2>&1; then
  PKG="yum"
elif command -v pacman >/dev/null 2>&1; then
  PKG="pacman"
elif command -v apk >/dev/null 2>&1; then
  PKG="apk"
fi

# Container detection
IN_CONTAINER=false
[[ -f /.dockerenv ]] && IN_CONTAINER=true
grep -q 'docker\|lxc\|containerd' /proc/1/cgroup 2>/dev/null && IN_CONTAINER=true

# Persistence verdict
HEADLESS=false
if [[ "$HAS_DBUS" == "true" && "$KEYRING_RUNNING" == "true" && "$KEYRING_FILES" == "true" ]]; then
  PERSISTENT="true"
  BACKEND="GNOME Keyring (persistent)"
elif [[ "$HAS_DISPLAY" == "true" ]]; then
  PERSISTENT="true"
  BACKEND="Desktop Keyring (persistent)"
else
  PERSISTENT="false"
  BACKEND="In-memory (volatile)"
  HEADLESS=true
fi

# ═══════════════════════════════════════════════════════════
# 3. Detect-only mode
# ═══════════════════════════════════════════════════════════
if [ "$MODE" = "--detect" ]; then
  echo "PLATFORM=$PLATFORM"
  echo "BACKEND=$BACKEND"
  echo "PERSISTENT=$PERSISTENT"
  echo "HEADLESS=$HEADLESS"
  echo "HAS_DISPLAY=$HAS_DISPLAY"
  echo "HAS_DBUS=$HAS_DBUS"
  echo "KEYRING_RUNNING=$KEYRING_RUNNING"
  echo "KEYRING_FILES=$KEYRING_FILES"
  echo "WALLET_DB_EXISTS=$WALLET_DB_EXISTS"
  echo "WALLET_DB_COUNT=$WALLET_DB_COUNT"
  echo "PKG_MANAGER=$PKG"
  echo "IN_CONTAINER=$IN_CONTAINER"
  exit 0
fi

# ═══════════════════════════════════════════════════════════
# 4. Setup mode
# ═══════════════════════════════════════════════════════════

echo ""
echo "  ── Algorand MCP Keyring Persistence Setup ──"
echo ""

# ─── 4a. Status display ───
echo "  Platform:        Linux"
echo "  Display:         $( [[ "$HAS_DISPLAY" == "true" ]] && echo "✅ Yes" || echo "❌ No (headless)" )"
echo "  D-Bus session:   $( [[ "$HAS_DBUS" == "true" ]] && echo "✅ Active" || echo "❌ Not found" )"
echo "  Keyring daemon:  $( [[ "$KEYRING_RUNNING" == "true" ]] && echo "✅ Running" || echo "❌ Not running" )"
echo "  Keyring files:   $( [[ "$KEYRING_FILES" == "true" ]] && echo "✅ Found in $KEYRING_DIR" || echo "❌ None (in-memory only)" )"
echo "  Wallet DB:       $( [[ "$WALLET_DB_EXISTS" == "true" ]] && echo "✅ $WALLET_DB ($WALLET_DB_COUNT account(s))" || echo "— Not found (fresh install)" )"
echo "  Package manager: ${PKG:-unknown}"
echo "  Container:       $( [[ "$IN_CONTAINER" == "true" ]] && echo "Yes" || echo "No" )"
echo ""

# Already persistent with keyring files on disk?
if [[ "$PERSISTENT" == "true" && "$KEYRING_FILES" == "true" ]]; then
  echo "  ✅ Keyring is persistent and will survive reboots."
  echo ""
  exit 0
fi

# ─── 4b. Backup existing wallet mnemonics (UPDATE scenario only) ───
BACKUP_FILE=""
if [[ "$WALLET_DB_COUNT" -gt 0 && "$KEYRING_RUNNING" == "true" && -f "$BACKUP_SCRIPT" ]]; then
  echo "  ── Step 1: Backup wallet mnemonics from current keyring ──"
  echo ""
  echo "  Found $WALLET_DB_COUNT account(s) in wallet.db."
  echo "  Reading mnemonics from current keyring before setup..."
  echo ""

  BACKUP_FILE=$(mktemp /tmp/algorand-mcp-keyring-backup.XXXXXX)
  chmod 600 "$BACKUP_FILE"

  BACKUP_RESULT=$(NODE_PATH="$NODE_MODULES" node "$BACKUP_SCRIPT" backup "$BACKUP_FILE" 2>&1)
  echo "  $BACKUP_RESULT"

  # Check if backup actually has content
  if [[ ! -s "$BACKUP_FILE" ]]; then
    rm -f "$BACKUP_FILE"
    BACKUP_FILE=""
    echo "  ℹ️  No mnemonics to backup (keyring may be empty after a reboot)."
  fi
  echo ""
elif [[ "$WALLET_DB_COUNT" -gt 0 && "$KEYRING_RUNNING" != "true" ]]; then
  echo "  ── Step 1: Backup ──"
  echo ""
  echo "  ⚠️  Keyring daemon not running — cannot backup existing mnemonics."
  echo "  If the system was rebooted, in-memory mnemonics are already lost."
  echo ""
fi

# ─── 4c. Install keyring packages ───
echo "  ── Step 2: Install keyring packages ──"
echo ""

if [[ -z "$PKG" ]]; then
  echo "  Could not detect package manager. Install manually:"
  echo "    gnome-keyring, libsecret-tools, dbus-user-session (or equivalent)"
  echo ""
else
  case "$PKG" in
    apt)
      INSTALL_CMD="sudo DEBIAN_FRONTEND=noninteractive NEEDRESTART_MODE=a apt update && sudo DEBIAN_FRONTEND=noninteractive NEEDRESTART_MODE=a apt install -y gnome-keyring libsecret-tools dbus-user-session"
      ;;
    dnf)
      INSTALL_CMD="sudo dnf install -y gnome-keyring libsecret libsecret-tools"
      ;;
    yum)
      INSTALL_CMD="sudo yum install -y gnome-keyring libsecret libsecret-tools"
      ;;
    pacman)
      INSTALL_CMD="sudo pacman -Sy --noconfirm gnome-keyring libsecret"
      ;;
    apk)
      INSTALL_CMD="sudo apk add gnome-keyring libsecret dbus secret-tool"
      ;;
  esac

  echo "  Run:"
  echo "    $INSTALL_CMD"
  echo ""
  read -r -p "  Install now? [y/N] " REPLY
  if [[ "$REPLY" =~ ^[Yy]$ ]]; then
    echo ""
    eval "$INSTALL_CMD"
    echo ""
    echo "  ✅ Packages installed."
  else
    echo "  Skipped. Install later with the command above."
  fi
  echo ""
fi

# ─── 4d. Enable lingering user session ───
echo "  ── Step 3: Enable user session lingering ──"
echo ""
echo "  This keeps D-Bus and keyring daemon alive after SSH logout."
echo ""

if loginctl show-user "$USER" 2>/dev/null | grep -q "Linger=yes"; then
  echo "  ✅ Lingering already enabled for $USER"
else
  read -r -p "  Enable lingering for $USER? [y/N] " REPLY
  if [[ "$REPLY" =~ ^[Yy]$ ]]; then
    loginctl enable-linger "$USER"
    echo "  ✅ Lingering enabled."
  else
    echo "  Skipped."
  fi
fi
echo ""

# ─── 4e. Start D-Bus and keyring daemon ───
echo "  ── Step 4: Start D-Bus session and keyring daemon ──"
echo ""

# Ensure D-Bus is available
if [[ -z "${DBUS_SESSION_BUS_ADDRESS:-}" ]]; then
  echo "  Starting D-Bus session..."
  eval $(dbus-launch --sh-syntax)
  echo "  ✅ D-Bus session started."
else
  echo "  ✅ D-Bus session already active."
fi

# Kill stale keyring daemons (leftover --unlock processes, etc.)
STALE_COUNT=$(pgrep -u "$USER" gnome-keyring-daemon 2>/dev/null | wc -l)
if [[ "$STALE_COUNT" -gt 1 ]]; then
  echo "  Cleaning up $STALE_COUNT stale keyring daemon processes..."
  pkill -9 -u "$USER" gnome-keyring-daemon 2>/dev/null || true
  sleep 2
fi

# Start the daemon via --start (D-Bus activated, stays resident)
# Note: on headless, the daemon may be D-Bus activated on demand rather than
# staying resident. This is normal — secret-tool and @napi-rs/keyring will
# trigger D-Bus activation automatically when they query the Secret Service.
echo "  Starting gnome-keyring-daemon..."
eval $(gnome-keyring-daemon --start --components=secrets 2>&1 | grep -v '^\*\*') || true
sleep 1

if pgrep -u "$USER" gnome-keyring-daemon >/dev/null 2>&1; then
  echo "  ✅ Keyring daemon running."
else
  # On D-Bus activated systems, the daemon starts on demand — verify by querying
  if command -v secret-tool >/dev/null 2>&1; then
    secret-tool search --all service algorand-mcp 2>/dev/null && echo "  ✅ Keyring daemon available (D-Bus activated)." || true
  fi
  echo "  ℹ️  Daemon is D-Bus activated (starts on demand when queried)."
fi
echo ""

# ─── 4f. Create persistent login keyring collection ───
KEYRING_FILE="$KEYRING_DIR/login.keyring"
mkdir -p "$KEYRING_DIR"

echo "  ── Step 5: Create persistent keyring ──"
echo ""

if [[ -f "$KEYRING_FILE" ]]; then
  echo "  ✅ Keyring already exists at $KEYRING_FILE"
else
  # On headless Linux, gnome-keyring-daemon refuses to create a collection
  # via normal prompts (no GUI). We use the D-Bus internal interface
  # CreateWithMasterPassword to create the "login" collection with an
  # empty master password — making it auto-unlocked and persistent on disk.
  echo "  Creating login keyring collection via D-Bus..."

  python3 << 'PYEOF'
import sys
try:
    from jeepney import new_method_call, DBusAddress
    from jeepney.io.blocking import open_dbus_connection

    conn = open_dbus_connection(bus='SESSION')

    # Open a plain-text session with the Secret Service
    msg = new_method_call(
        DBusAddress('/org/freedesktop/secrets',
                    bus_name='org.freedesktop.secrets',
                    interface='org.freedesktop.Secret.Service'),
        'OpenSession',
        'sv',
        ('plain', ('s', ''))
    )
    reply = conn.send_and_get_reply(msg)
    session_path = reply.body[1]

    # Create the "login" collection with empty master password
    # Uses the internal gnome-keyring interface (bypasses GUI prompt)
    props = {
        'org.freedesktop.Secret.Collection.Label': ('s', 'login')
    }
    master_password = (session_path, b'', b'', 'text/plain')

    msg = new_method_call(
        DBusAddress('/org/freedesktop/secrets',
                    bus_name='org.gnome.keyring',
                    interface='org.gnome.keyring.InternalUnsupportedGuiltRiddenInterface'),
        'CreateWithMasterPassword',
        'a{sv}(oayays)',
        (props, master_password)
    )
    reply = conn.send_and_get_reply(msg)
    print(f"  Collection created: {reply.body[0]}")
    conn.close()
except Exception as e:
    print(f"  Error: {e}", file=sys.stderr)
    sys.exit(1)
PYEOF

  if [[ $? -eq 0 && -f "$KEYRING_FILE" ]]; then
    echo "  ✅ Persistent keyring created at $KEYRING_FILE"
  else
    FOUND_FILE=$(ls "$KEYRING_DIR"/*.keyring 2>/dev/null | head -1 || true)
    if [[ -n "$FOUND_FILE" ]]; then
      echo "  ✅ Persistent keyring created at $FOUND_FILE"
    else
      echo "  ⚠️  Keyring file not created. Ensure python3 and jeepney are installed."
      echo "     Install with: pip3 install jeepney"
    fi
  fi
fi
echo ""

# ─── 4g. Restore backed-up wallet mnemonics (UPDATE scenario only) ───
if [[ -n "$BACKUP_FILE" && -f "$BACKUP_FILE" && -s "$BACKUP_FILE" ]]; then
  echo "  ── Step 6: Restore wallet mnemonics ──"
  echo ""

  RESTORE_RESULT=$(NODE_PATH="$NODE_MODULES" node "$BACKUP_SCRIPT" restore "$BACKUP_FILE" 2>&1)
  echo "  $RESTORE_RESULT"

  # Securely delete backup
  shred -u "$BACKUP_FILE" 2>/dev/null || rm -f "$BACKUP_FILE"
  echo "  ✅ Temporary backup securely deleted."
  echo ""
fi

# ─── 4h. Docker-specific guidance ───
if [[ "$IN_CONTAINER" == "true" ]]; then
  echo "  ── Docker / Container Notes ──"
  echo ""
  echo "  Add to your Dockerfile:"
  echo "    RUN apt-get update && apt-get install -y \\"
  echo "        gnome-keyring libsecret-tools dbus-user-session \\"
  echo "        && rm -rf /var/lib/apt/lists/*"
  echo ""
  echo "  Entrypoint wrapper (entrypoint.sh):"
  echo '    #!/bin/bash'
  echo '    export $(dbus-launch)'
  echo '    eval $(gnome-keyring-daemon --start --components=secrets)'
  echo '    # Create login collection if not exists (headless — no GUI prompt)'
  echo '    if [ ! -f ~/.local/share/keyrings/login.keyring ]; then'
  echo '      python3 -c "'
  echo '        from jeepney import new_method_call, DBusAddress'
  echo '        from jeepney.io.blocking import open_dbus_connection'
  echo '        conn = open_dbus_connection(bus=\"SESSION\")'
  echo '        r = conn.send_and_get_reply(new_method_call(DBusAddress(\"/org/freedesktop/secrets\",bus_name=\"org.freedesktop.secrets\",interface=\"org.freedesktop.Secret.Service\"),\"OpenSession\",\"sv\",(\"plain\",(\"s\",\"\"))))'
  echo '        s = r.body[1]'
  echo '        conn.send_and_get_reply(new_method_call(DBusAddress(\"/org/freedesktop/secrets\",bus_name=\"org.gnome.keyring\",interface=\"org.gnome.keyring.InternalUnsupportedGuiltRiddenInterface\"),\"CreateWithMasterPassword\",\"a{sv}(oayays)\",({\"org.freedesktop.Secret.Collection.Label\":(\"s\",\"login\")},(s,b\"\",b\"\",\"text/plain\"))))'
  echo '        conn.close()'
  echo '      "'
  echo '    fi'
  echo '    exec "$@"'
  echo ""
  echo "  Persist keyring + wallet data (docker-compose.yml):"
  echo "    volumes:"
  echo "      - keyring-data:/home/user/.local/share/keyrings"
  echo "      - wallet-data:/home/user/.algorand-mcp"
  echo ""
fi

# ─── 4i. Final verification ───
echo "  ── Results ──"
echo ""

# Re-check
VERIFY_RUNNING=false
pgrep -u "$USER" gnome-keyring-daemon >/dev/null 2>&1 && VERIFY_RUNNING=true

VERIFY_FILES=false
[[ -d "$KEYRING_DIR" && "$(ls -A "$KEYRING_DIR" 2>/dev/null)" ]] && VERIFY_FILES=true

if [[ "$VERIFY_RUNNING" == "true" ]]; then
  echo "  ✅ Daemon:      Running"
else
  echo "  ✅ Daemon:      D-Bus activated (starts on demand)"
fi

if [[ "$VERIFY_FILES" == "true" ]]; then
  echo "  ✅ Persistent:  Yes (files at $KEYRING_DIR)"
else
  echo "  ⚠️  Persistent:  No keyring files yet"
fi

# Verify wallet mnemonics via Node.js
if [[ -f "$BACKUP_SCRIPT" && "$WALLET_DB_EXISTS" == "true" ]]; then
  VERIFY_RESULT=$(NODE_PATH="$NODE_MODULES" node "$BACKUP_SCRIPT" verify 2>/dev/null | tail -1)
  echo "  ✅ Wallets:     $VERIFY_RESULT"
fi

echo ""
echo "  Behavior after setup:"
echo "    • Keyring stored on disk, auto-unlocked on boot via D-Bus activation"
echo "    • loginctl linger keeps D-Bus session alive between SSH sessions"
echo "    • Wallet keys persist across reboots — no user interaction needed"
echo "    • Keep agent wallet funds minimal — use QR code top-ups as needed"
echo ""
