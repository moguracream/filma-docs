#!/usr/bin/env bash
# Re-exec with bash if invoked via sh
if [ -z "${BASH_VERSION:-}" ]; then
  exec /usr/bin/env bash "$0" "$@"
fi

set -euo pipefail

# Local build/preview helper for API specification (MkDocs)
# Usage:
#   ./build.sh serve   # start local preview at http://127.0.0.1:8001
#   ./build.sh build   # build static site into ./site
#   ./build.sh generate # generate mkdocs nav config from split source files
#   ./build.sh clean   # remove ./site and local venv
#   ./build.sh draft-deploy  # rsync site to db.xcream.net (draft only)

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
DOCS_DIR="$ROOT_DIR/docs"
CONFIG_PATH="$ROOT_DIR/mkdocs.yml"
GENERATED_CONFIG_PATH="$ROOT_DIR/mkdocs.generated.yml"
SECTIONS_DIR="$DOCS_DIR"
VENV_DIR="$ROOT_DIR/.venv"
VENV_PY="$VENV_DIR/bin/python3"
VENV_PIP="$VENV_DIR/bin/pip"
VENV_MKDOCS="$VENV_DIR/bin/mkdocs"

ensure_venv() {
  local mode="${1:-build}"

  if [[ ! -x "$VENV_PY" ]]; then
    echo "[setup] Creating virtual environment at $VENV_DIR"
    rm -rf "$VENV_DIR"
    python3 -m venv "$VENV_DIR"
    "$VENV_PY" -m pip install --upgrade pip >/dev/null
  fi

  if ! "$VENV_PIP" show mkdocs-material >/dev/null 2>&1; then
    echo "[setup] Installing mkdocs-material"
    "$VENV_PIP" install -q mkdocs-material
  fi

  # Live reload用のwatchdogはserve時のみ必要
  if [[ "$mode" == "serve" ]] && ! "$VENV_PIP" show watchdog >/dev/null 2>&1; then
    echo "[setup] Installing watchdog (serve mode)"
    "$VENV_PIP" install -q watchdog
  fi
}

sync_source() {
  local tmpdir sections_file section_count
  tmpdir="$(mktemp -d)"
  sections_file="$tmpdir/sections.tsv"

  mkdir -p "$SECTIONS_DIR"
  : > "$sections_file"

  # 分割された章ファイル（NN-*.md）を正本として扱う
  section_count=0
  for part_file in "$SECTIONS_DIR"/[0-9][0-9]-*.md; do
    if [[ ! -f "$part_file" || ! -s "$part_file" ]]; then
      continue
    fi

    local filename rel_path title
    section_count=$((section_count + 1))
    filename="$(basename "$part_file")"
    rel_path="$filename"
    title="$(sed -n '1s/^#[[:space:]]*//p' "$part_file" | sed -e 's/[[:space:]]*$//')"
    if [[ -z "$title" ]]; then
      title="$filename"
    fi

    printf '%s\t%s\n' "$title" "$rel_path" >> "$sections_file"
  done

  if [[ "$section_count" -eq 0 ]]; then
    echo "[error] No section files found in $SECTIONS_DIR (expected NN-*.md)" >&2
    rm -rf "$tmpdir"
    exit 1
  fi

  # MkDocs用の nav を含む設定ファイルを自動生成
  cp -f "$CONFIG_PATH" "$GENERATED_CONFIG_PATH"
  {
    echo
    echo "nav:"
    echo "  - API仕様書: index.md"
    while IFS=$'\t' read -r title rel_path; do
      escaped_title="${title//\"/\\\"}"
      printf '  - "%s": %s\n' "$escaped_title" "$rel_path"
    done < "$sections_file"
  } >> "$GENERATED_CONFIG_PATH"

  rm -rf "$tmpdir"
}

cmd="${1:-serve}"
case "$cmd" in
  serve)
    ensure_venv serve
    sync_source
    echo "[serve] Using config: $GENERATED_CONFIG_PATH"
    exec "$VENV_MKDOCS" serve -f "$GENERATED_CONFIG_PATH" -a 127.0.0.1:8001 --livereload
    ;;
  build)
    ensure_venv build
    sync_source
    echo "[build] Using config: $GENERATED_CONFIG_PATH"
    exec "$VENV_MKDOCS" build --strict -f "$GENERATED_CONFIG_PATH"
    ;;
  generate)
    sync_source
    echo "[generate] Generated docs and config: $GENERATED_CONFIG_PATH"
    ;;
  draft-deploy)
    echo "[deploy] Syncing site to db.xcream.net"
    /usr/bin/rsync -av --delete $ROOT_DIR/site/ db.xcream.net:/home/koki-h/filma-docs/api_spec/
    echo "[deploy] Done. https://filma-dev.xcream.net/filma-docs/api_spec/"
    ;;
  clean)
    echo "[clean] Removing site and venv"
    rm -rf "$ROOT_DIR/site" "$VENV_DIR" "$GENERATED_CONFIG_PATH"
    # NN-*.md は正本なので削除しない
    ;;
  *)
    echo "Usage: $0 {serve|build|generate|clean|draft-deploy}" >&2
    exit 1
    ;;
esac
