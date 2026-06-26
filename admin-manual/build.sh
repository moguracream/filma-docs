#!/usr/bin/env bash
# Re-exec with bash if invoked via sh
if [ -z "${BASH_VERSION:-}" ]; then
  exec /usr/bin/env bash "$0" "$@"
fi

set -euo pipefail

# Local build/preview helper for the Admin Manual (MkDocs)
# Usage:
#   ./build.sh serve   # start local preview at http://127.0.0.1:8000
#   ./build.sh build   # build static site into ./site
#   ./build.sh clean   # remove ./site and local venv
#   ./build.sh draft-deploy  # rsync site to db.xcream.net (draft only)

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_PATH="$ROOT_DIR/mkdocs.yml"
VENV_DIR="$ROOT_DIR/.venv"
VENV_PY="$VENV_DIR/bin/python3"
VENV_PIP="$VENV_DIR/bin/pip"
VENV_MKDOCS="$VENV_DIR/bin/mkdocs"

ensure_venv() {
  if [[ ! -x "$VENV_PY" ]]; then
    echo "[setup] Creating virtual environment at $VENV_DIR"
    rm -rf "$VENV_DIR"
    if ! python3 -m venv "$VENV_DIR"; then
      echo "[error] python3 -m venv failed. Ensure python3 is installed and try again." >&2
      exit 1
    fi
  fi
  "$VENV_PY" -m pip install --upgrade pip >/dev/null
  # watchdog を入れてファイル変更の自動リロードを安定化させる
  "$VENV_PIP" install -q mkdocs-material watchdog
}

cmd="${1:-serve}"
case "$cmd" in
  serve)
    ensure_venv
    echo "[serve] Using config: $CONFIG_PATH"
    exec "$VENV_MKDOCS" serve -f "$CONFIG_PATH" -a 127.0.0.1:8000 --livereload
    ;;
  build)
    ensure_venv
    echo "[build] Using config: $CONFIG_PATH"
    exec "$VENV_MKDOCS" build --strict -f "$CONFIG_PATH"
    ;;
  draft-deploy)
    echo "[deploy] Syncing site to db.xcream.net"
    /usr/bin/rsync -av --delete $ROOT_DIR/site/ db.xcream.net:/home/koki-h/filma-docs/admin_manual/
    echo "[deploy] Done. https://filma-dev.xcream.net/filma-docs/admin_manual/"
    ;;
  clean)
    echo "[clean] Removing site and venv"
    rm -rf "$ROOT_DIR/site" "$VENV_DIR"
    ;;
  *)
    echo "Usage: $0 {serve|build|clean|draft-deploy}" >&2
    exit 1
    ;;
esac
