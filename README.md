# Loophole Agent

Loophole Agent is a patch distribution on top of [Kilo](https://github.com/Kilo-Org/kilocode).
This repository contains **no kilo code**: only the patches that turn upstream Kilo into
Loophole, plus the scripts that apply them.

## Layout

```
upstream/kilo.json          pinned upstream commit the patches are based on ({ref, commit})
patches/series              ordered patch list
patches/*.patch             Loophole's changes as text patches
assets/                     binary overlay (icons), mirrored by repo path
assets/deletes.txt          files removed from the upstream tree
scripts/prepare-loophole.*  clone upstream at the pin, apply patches, overlay assets
.github/workflows/          build CI
```

## Build

```bash
bash scripts/prepare-loophole.sh        # or scripts\prepare-loophole.ps1 on Windows
cd ../loophole-agent-build
bun install
# then the normal kilo build commands
```

The full development fork (source + patches as commits) lives on the `kilo` branch.
See `PATCHES.md` for the patch-system workflow.
