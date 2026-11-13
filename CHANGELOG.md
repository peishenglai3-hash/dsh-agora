# Changelog

## 0.3.0 — 2026-11-13

- Manifest `goalAny` filter for goal-sensitive assets.
- Manifest `why`/role/canonical/overlapGroup retained in route.
- 5 fixture tests; still advisory only.

## 0.2.1 — 2026-11-13

- Remove UTF-8 BOM from package.json (DSH plugin_manager rejected it).
- No behavior change.

## 0.2.0 — 2026-11-13

- Optional explicit asset manifest (scenario/risk/role/tags/overlap/canonical).
- Manifest-driven overlap arbitration; keyword fallback retained.
- 5 fixture tests; docs/MANIFEST.md and examples manifest.
- No profile writes; still advisory only.

## 0.1.0 — 2026-11-13

- Initial preview: read-only census/health/route Host-only bundle.
- Self-contained `lib/core.mjs`; no DSH imports.
- 4 fixture tests: registration, live/archived, overlap, plugin execution.
- MIT license and provenance notes.
