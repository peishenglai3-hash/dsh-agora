# Community publication status

## Current status

**Not submitted to the DSH community index.** This is a condition failure, not
an unpublished local change.

Official index checked on 2026-11-13:

- `https://dsh.works/awesome-dsh-plugins/market/index.json`
- The index description says: “dsh bundles published to npm … Each npm name is
  checked to name its repository back.”

## Blockers (observed)

1. **No npm authentication**
   ```text
   npm whoami -> npm error code E401 (Unauthorized)
   ```
   Publishing requires a maintainer token; this session has no npm credential.
2. **Package name is local-only**
   - current package name: `@local/agora`
   - `@local/*` is not a publishable public scope.
3. **`dsh-agora` is already taken**
   ```text
   npm view dsh-agora version -> 0.2.8
   ```
   So the obvious unscoped fallback cannot be used either.
4. A DSH bundle installed from npm also needs a publishable package name that
   matches its Cordis patch row; a wrapper package with a different name would
   need its own tested patch, not a rename of this one.

## What would unblock it

- own/obtain a publishable scope, or a free unscoped name;
- authenticate npm in a maintainer session;
- publish a version whose `repository` field points back to this repo;
- wait for the indexer, or open a PR to `dshworks/awesome-dsh-plugins` if its
  contribution rules allow a manual entry;
- re-run `plugin_manager install_bundle` from the npm target in a clean profile.

## What is already ready

- public GitHub repo + MIT license;
- README, architecture, books/provenance and limits;
- 7 fixture tests;
- `npm pack --dry-run` succeeds and includes the skill;
- version/tag/release v1.0.0.

## Do not claim

Do not say “published to the DSH community”, “available in the market”, or
“installable from npm” until the above is actually done.
