# Architecture

Agora is a **read-only management layer** for a DSH profile. It is deliberately
small: no database, no scheduler, no automatic installer, no model calls.

## Primitives

```text
Census  ->  Frame  ->  Route  ->  Rite (receipt)  ->  Steward
inventory    situation   candidates   evidence          human/owner decision
```

| Primitive | Implementation | Output |
|---|---|---|
| Census | `lib/core.mjs:census` | profile hash, bundle/dependency counts, live/archived skills, duplicate names |
| Frame | caller supplies `kind/risk/goal` | normalized frame in the receipt |
| Route | `route` + optional `.agora/manifest.json` | candidates, rejected assets, overlap, needsUser, unique receiptId |
| Rite | receipt object returned by `agora_route` | auditable JSON; not persisted by default |
| Steward | `health` + human decision | issues with severity; no automatic mutation |

## Data sources

- `DSH_PROFILE_DIR/package.json` — bundles and dependencies.
- `<workspace>/.agents/skills/**/SKILL.md` — workspace skills.
- `<workspace>/dsh-plugins/*/skills/**/SKILL.md` — local plugin skills.
- reference dirs are counted separately so archival copies do not look live.
- `<workspace>/.agora/manifest.json` — optional explicit asset metadata.

## Routing

1. **Manifest mode** if a manifest exists: filter by scenario/risk/goalAny;
   score scenario/risk/tag matches; top candidates are grouped by overlapGroup.
2. **Keyword fallback** if no manifest: description/name heuristic.
3. `manifestPath: false` forces fallback for A/B testing.
4. `needsUser` is true only when >1 top candidate shares an overlapGroup; it is a
   request for a human decision, not a failure.

## Health

`agora_health` validates manifest assets against the live census:

- missing / archived assets;
- duplicate assets;
- unknown scenarios/roles;
- multiple canonical members in one overlapGroup;
- plus archived-reference count and unlinked local plugin dirs.

P1/P0 issues make `ok:false`; P2 is advisory. Agora never repairs.

## Pre-step hint

Disabled by default. When `preStepHint: true`:

- runs on `agent/pre-step` for a new user prompt only;
- infers a coarse kind, calls census/route, injects one short user-role context
  message with at most 3 candidates;
- deduplicates per agent/prompt and catches every error so a turn is never blocked;
- does **not** execute a tool or edit a profile.

## Extension points

- Add an asset: edit the manifest; `agora_health` will flag stale names.
- New scenario: extend `VALID_SCENARIOS` and the caller's frame.
- New overlap family: add a manifest `overlapGroup`; do not hardcode it.
- New environment: pass `workspace`, `profile`, `manifest` via bundle config.

## Non-goals

- No auto-install, auto-remove, auto-cleanup.
- No semantic planner or LLM call.
- No UI.
- No ownership arbitration; it exposes conflicts and requires a human/owner.
- No claim that a route is correct; it is a decision aid with a receipt.

## Design sources

Organization/sociology concepts are used as **design heuristics**:

- Mintzberg — contingency, differentiation/integration, coordination mechanisms.
- Laloux — self-management/wholeness/purpose, with governance safeguards.
- Team Topologies — platform/enabling/stream-aligned, cognitive load, team API.
- Goffman — front/back stage and frames.
- Collins — interaction rituals and emotional energy.
- Garfinkel — accountability/indexicality/breaching.
- Durkheim — division of labour, anomie, integration.
- Selectorate theory — principal/selectorate and hidden coalition risk.

See `PROVENANCE.md` for editions, access limits and what was not read in full.
