#!/usr/bin/env bash
# Install and build the prepared tree. Run get_repo.sh + prepare_src.sh first.
#
#   bash ./build.sh                    -> CLI for every target + all VSIX packages
#   BUILD_TARGET=cli bash ./build.sh   -> CLI only
#   BUILD_TARGET=vsix bash ./build.sh  -> VSIX only (needs an existing CLI dist)
#
# Building the Linux targets needs Zig on PATH (the bundled Bubblewrap sandbox
# helper is compiled with it). The CI workflow installs Zig; locally, install it
# yourself or set KILO_SKIP_BUNDLED_BWRAP=1 to skip that helper.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"
. ./utils.sh

[ -d "$REPO_DIR/.git" ] || die "no ./$REPO_DIR checkout - run ./get_repo.sh and ./prepare_src.sh first"

BUILD_TARGET="${BUILD_TARGET:-all}"

# Keep bun's global cache out of the user profile (C:) - everything stays next to
# the tree unless BUN_INSTALL_CACHE_DIR is already set.
export BUN_INSTALL_CACHE_DIR="${BUN_INSTALL_CACHE_DIR:-$ROOT/.bun-cache}"

cd "$REPO_DIR"
DIST="$(pwd)/packages/opencode/dist"

log "installing dependencies (cache: $BUN_INSTALL_CACHE_DIR)"
bun install

case "$BUILD_TARGET" in
  cli|all)
    log "building CLI (all targets)"
    ( cd packages/opencode && bun script/build.ts )
    ;;
esac

case "$BUILD_TARGET" in
  vsix|all)
    log "building VSIX packages (all targets)"
    ( cd packages/kilo-vscode && CLI_DIST_DIR="$DIST" bun script/build.ts )
    ;;
esac

log "build finished ($BUILD_TARGET)"
