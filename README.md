# Agora

**A read-only asset steward for DSH plugins, skills and MCPs.**

Agora is a small management layer for the moment when a Harness profile has more
plugins, skills and tools than a person (or a model) can reliably choose from.
It does not replace `plugin_manager`; it makes the existing inventory legible,
checkable and routable.

> Status: **v0.1 preview**, advisory only. It does not install, uninstall,
> execute a skill/tool, or edit the DSH profile.

## What it does

- `agora_census` — read the live profile, workspace skills and local plugin
  skills; distinguish **live** from **archived** reference copies; report
  profile hash and counts.
- `agora_health` — duplicate live skill names, archived-reference count,
  unlinked local plugin dirs, and issue families.
- `agora_route` — given a task frame (`core`, `code`, `research`, `writing`,
  `audit`, `mixed`; risk; goal), return candidates, rejected assets, overlap
  groups and a unique receipt. **It never executes the route.**

## Design

Agora has five primitives:

```text
Census (inventory) → Frame (situation) → Route (candidates/reasons)
                  → Rite (receipt) → Steward (ownership/lifecycle)
```

It draws on organization and social theory as **design heuristics**, not as a
claim that software is a society:

- Mintzberg: contingency, differentiation/integration, coordination mechanisms.
- Laloux: self-management, wholeness, evolutionary purpose — with governance.
- Team Topologies: platform/enabling/stream-aligned/complicated-subsystem,
  cognitive load, team API.
- Goffman: front stage/back stage, frames.
- Collins: interaction rituals, emotional energy.
- Garfinkel: accountability, indexicality, breaching.
- Durkheim: division of labour, anomie, integration.
- Selectorate theory: the user is the principal; hidden coalitions must not
  control defaults.

See [`docs/PROVENANCE.md`](docs/PROVENANCE.md) for sources and evidence limits.

## Install

Agora is a DSH bundle (Host-only, dependency-free). From a checkout:

1. Review `cordis.patch.yml`, `index.js` and `lib/core.mjs`.
2. In DSH use **Plugins → Add plugin** with this directory, or `plugin_manager`
   `install_bundle` when you explicitly want the change.
3. After activation, call `agora_census` / `agora_health` / `agora_route`.

The tools census `process.cwd()` by default. To pin another root, set
`workspace` in the bundle row's `config`.

## Manifest

For less noisy routing, add `<workspace>/.agora/manifest.json` (or set the
bundle's `manifest` config). It declares scenario/risk/role/overlap/tags for
live skills; without it, v0.1 keyword fallback remains. See
[`docs/MANIFEST.md`](docs/MANIFEST.md) and
[`examples/manifest.example.json`](examples/manifest.example.json).

## Verification

```powershell
node --check index.js
node --check lib/core.mjs
node --test test/smoke.mjs
```

Expected: 6 tests pass; no profile writes. The fixture covers live/archived,
duplicate names, manifest health, overlap arbitration and the three-tool registration.

## Limits

- Keyword routing, not a semantic planner; expect false positives.
- No pre-step hook, no enforce mode, no UI, no live MCP probing.
- No auto-cleanup: it reports; a human decides.
- Full text of the cited books was not all legally accessible; see PROVENANCE.
- Not yet submitted to a DSH community index.

## License

MIT. See [LICENSE](LICENSE).
