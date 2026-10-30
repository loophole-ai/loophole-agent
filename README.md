# Loophole Agent

Loophole Agent is a patch distribution on top of [Kilo](https://github.com/Kilo-Org/kilocode),
built the same way [VSCodium](https://github.com/VSCodium/vscodium) sits on top of VS Code.
This repository contains **no Kilo source**: only the patches that turn upstream Kilo into
Loophole, the binary overlay, and the scripts that apply them.

The upstream tree always lives **inside the workspace**, at `./kilo`, so local runs and CI
use exactly the same paths.

## Layout

```
upstream/kilo.json       pinned upstream commit ({ref, commit})
patches/[0-9]*-*.patch   Loophole changes, applied in sorted order (no series file)
patches/user/*.patch     optional, applied after the numbered stack
assets/                  binary overlay (icons), mirrored by repo path
assets/deletes.txt       files removed from the upstream tree (none currently)
get_repo.sh              clone pinned upstream -> ./kilo
prepare_src.sh           apply patches + overlay assets
build.sh                 bun install + CLI (all targets) + VSIX (all targets)
dev/patch.sh             edit one patch against ./kilo, re-export it
dev/update_patches.sh    re-apply the whole stack and re-export every patch
dev/verify-patches.sh    fast apply check, no compile
check_tags.sh            show upstream commits/tags newer than the pin
update_upstream.sh       bump the pin and commit it
.github/workflows/       ci-build-linux.yml (VSIX for every target)
```

`patches/` also holds copies of upstream Kilo's bun `patchedDependencies` (`@ai-sdk/...`,
`effect@...`, ...). They are byte-identical to upstream and arrive with the `kilo/` checkout,
so only the numbered `patches/[0-9]*-*.patch` files are applied.

## Build

Requires `git`, `bun`, and a bash shell (Git Bash on Windows). `jq` is optional.
Building the Linux targets also needs **Zig** on `PATH` (for the bundled Bubblewrap helper);
`KILO_SKIP_BUNDLED_BWRAP=1` skips that helper.

```bash
bash ./get_repo.sh        # clone upstream at the pin -> ./kilo
bash ./prepare_src.sh     # reset the tree, apply patches, overlay assets
bash ./build.sh           # bun install + CLI (all targets) + VSIX (all targets)
```

Outputs:

```
kilo/packages/opencode/dist/cli-*/          CLI binaries for every target
kilo/packages/kilo-vscode/out/*.vsix        one VSIX per target
```

`BUILD_TARGET=cli` or `BUILD_TARGET=vsix` builds only one side.

## Syncing upstream

No merges, ever. The patches are the source of truth.

1. `bash ./check_tags.sh` — see what upstream moved to.
2. `bash ./update_upstream.sh <commit>` — bump `upstream/kilo.json`.
3. `bash ./get_repo.sh` (with `FORCE=yes` after a pin change) and `bash ./prepare_src.sh`.
4. If a patch fails, fix it with `bash dev/patch.sh <name>`, or regenerate the stack with
   `bash dev/update_patches.sh`.
5. `bash ./dev/verify-patches.sh` — must print `OK`.

## Developing a feature

```bash
bash ./get_repo.sh
bash ./prepare_src.sh
# edit files under ./kilo like any normal checkout
bash dev/update_patches.sh     # folds the tree back into patches/*.patch
```

To edit a single existing patch (VSCodium's `dev/patch.sh` flow):

```bash
bash dev/patch.sh 0001-rebrand-core
# resolve any .rej files, press Enter, patch is regenerated
```

New features go in `patches/user/*.patch` unless they belong in the existing rebrand group.
Patches are regenerated with 3 lines of context.

## CI

`ci-build-linux.yml` is the build workflow: `get_repo.sh` → `prepare_src.sh` → `build.sh` →
upload. It runs on a push to `main`, on PRs to `main`, and manually.

One runner is enough: the CLI is cross-compiled for every target (linux/alpine/darwin/win32,
x64 and arm64) and the VSIX packages bundle those binaries. That is exactly how upstream
Kilo builds its VSIX.

## Note on the `kilo` branch

`kilo` is the old full-source development branch. It is no longer used by the pipeline; the
patches fully reproduce it. Keep it as a backup until you are comfortable, then delete it
with `git branch -D kilo`.

See [PATCHES.md](PATCHES.md) for the patch inventory.
