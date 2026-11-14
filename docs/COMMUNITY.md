# Community publication status

## Current status

**Published to npm on 2026-11-14.** The DSH community index has not yet listed
this package; the index crawler must see the npm release first.

- npm: `@peisheng_lai/dsh-agora@1.1.1` (Public, MIT)
- repository: https://github.com/peishenglai3-hash/dsh-agora
- packed tarball: 17 files; `node --test test/smoke.mjs` → 7/7 pass
- `dsh.bundle.patch`: `./cordis.patch.yml`
- DSH index query on 2026-11-14: `query=peisheng` returned the user's existing
  packages but not `dsh-agora`; this is an indexer timing result, not a claim
  that the package is listed.

## What was blocking, and what changed

1. **No npm authentication** — resolved by the account owner logging in and
   creating a scoped publish token.
2. **Local-only package name** — the package name was changed to
   `@peisheng_lai/dsh-agora`; the Cordis patch row was changed to match.
3. **`dsh-agora` was taken** — that unscoped name was not used; the scoped name
   was free.
4. The token pasted into the terminal was **exposed in a chat transcript**. It
   must be revoked by the account owner in the npm Access Tokens page; npm's CLI
   `token revoke` returned 403 for this granular token.

## Next checks

1. Revoke the exposed token in npm.
2. Re-query the DSH index after its crawl window. If it still does not list the
   package, open a PR against `dshworks/awesome-dsh-plugins` only if its
   contribution rules allow a manual entry.
3. `plugin_manager install_bundle @peisheng_lai/dsh-agora@1.1.0` in a disposable
   profile, then call `agora_census`.

## Do not claim

Do not say “available in the DSH market” until the index/API shows the package.
npm availability and DSH index availability are separate facts.
