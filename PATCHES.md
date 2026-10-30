# Patch System

Loophole Agent is maintained as a set of **patches on top of upstream Kilo**
([Kilo-Org/kilocode](https://github.com/Kilo-Org/kilocode)), the same model as VSCodium on
top of VS Code. Loophole-specific changes never live as a long-lived fork diff — they live in
`patches/` + `assets/` and can be applied to any upstream snapshot.

## Layout

```
upstream/kilo.json       pinned upstream commit ({ref, commit})
patches/
  0001-rebrand-core.patch    branding, telemetry hard-off, icon refs, extension metadata
  user/                      optional extra patches, applied after the numbered stack
  series                     legacy list, ignored by the scripts (sorted order wins)
  @ai-sdk%2F...@x.patch      copies of upstream bun patchedDependencies - NEVER applied
assets/                  binary overlay (icons), mirrored by repo path
  deletes.txt            files to delete from the upstream tree (none currently)
```

Application order: every numbered `patches/[0-9]*-*.patch` sorted, then
`patches/user/*.patch` sorted. There is no series file (the old `series` is kept for
reference only).

Why the numbered filter: `patches/` also contains copies of **upstream Kilo's bun dependency
patches** (`@ai-sdk/...`, `effect@...`, ...). They are byte-identical to upstream and are
supplied by the `kilo/` checkout, so they must not be applied as source patches. Only
numbered files are Loophole's stack.

Notes:
- `bun.lock` is intentionally **not** patched. It is regenerated with `bun install` after the
  patches are applied.
- Binary files (icons, PNGs) live in `assets/` and are copied over the tree by
  `prepare_src.sh`; they are never put inside `.patch` files.

## Building a patched tree

```bash
bash ./get_repo.sh        # ./kilo at the pinned commit
bash ./prepare_src.sh     # reset + apply patches + overlay assets
```

This installs nothing and builds nothing. Afterwards:

```bash
bash ./build.sh           # bun install + CLI (all targets) + VSIX (all targets)
```

`prepare_src.sh` always resets the tree to the pin first, so it is safe to re-run and it never
depends on what you did in a previous session.

## Syncing upstream (the routine)

1. See what moved:
   ```bash
   bash ./check_tags.sh
   ```
2. Move the pin:
   ```bash
   bash ./update_upstream.sh <commit>
   ```
3. Rebuild the tree and check that every patch still applies:
   ```bash
   FORCE=yes bash ./get_repo.sh
   bash ./prepare_src.sh
   ```
4. If a patch fails, either fix that one:
   ```bash
   bash dev/patch.sh 0001-rebrand-core
   ```
   or regenerate the whole stack against the new base:
   ```bash
   bash dev/update_patches.sh
   ```
5. Round-trip check (must print `OK`):
   ```bash
   bash ./dev/verify-patches.sh
   ```

## Adding a new Loophole feature

1. Build the tree: `bash ./get_repo.sh && bash ./prepare_src.sh`.
2. Edit files directly under `./kilo` like a normal checkout.
3. Export it:
   ```bash
   bash dev/update_patches.sh
   ```
   New files are picked up automatically because patches are regenerated from the tree diff.
   If you prefer an isolated patch, create `patches/user/<name>.patch` by hand and
   regenerate after it.

## Generating / refreshing a patch

`dev/patch.sh <name>` is the single-patch editor:
reset to the pin, apply all earlier patches as a throwaway commit, apply the target with
`--reject`, wait while you resolve conflicts, then write the new patch with
`git diff --staged -U3` and reset the tree.

`dev/update_patches.sh` is the batch version: apply the stack cumulatively, regenerating each
patch against the state produced by the previous one, then reset.

## CI usage

```bash
bash ./get_repo.sh          # clone upstream at the pin into ./kilo
bash ./prepare_src.sh       # patches + assets
bash ./build.sh             # bun install + CLI + VSIX
```

That is exactly what `.github/workflows/ci-build-linux.yml` does. One Linux runner produces the
CLI for every target and one VSIX per target, the same way upstream Kilo publishes.
