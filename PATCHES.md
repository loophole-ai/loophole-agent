# Patch System

Loophole Agent is maintained as a set of **patches on top of upstream Kilo**
([Kilo-Org/kilocode](https://github.com/Kilo-Org/kilocode), same model as VSCodium on
top of VS Code). The Loophole-specific changes never live as a long-lived fork diff —
they live in `patches/` + `assets/`, and can be applied to any upstream snapshot.

## Layout

```
UPSTREAM-REF              full SHA of the upstream commit the patches are based on
patches/
  series                  ordered list of patches
  0001-rebrand-core.patch     branding, telemetry hard-off, icon refs, scripts
  0002-licensing-docs.patch   license, READMEs, docs
assets/                   binary overlay (icons), mirrored by repo path
  deletes.txt             files to delete from the upstream tree
scripts/patches/
  export-patches.ps1      regenerate patches + assets from committed state (HEAD vs UPSTREAM-REF)
  apply-patches.ps1       fresh upstream checkout + apply patches + overlay assets
```

Notes:
- `bun.lock` is intentionally **not** patched. It is regenerated with `bun install`
  after the patches are applied.
- Binary files (icons, PNGs) are never put inside `.patch` files. They live in
  `assets/` and are copied over the tree by the apply script.
- `patches/` also contains upstream's own dependency patches (`@ai-sdk*.patch`,
  `effect@*.patch`, ...). Those come from upstream itself; only the `0*.patch`
  files listed in `series` are Loophole's.
- Upstream sync: `git fetch upstream` → move `UPSTREAM-REF` forward → fix any
  failing patches → commit → re-run `export-patches.ps1` → commit the regenerated
  patches.
