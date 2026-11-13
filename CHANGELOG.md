# Changelog

## 0.7.1 — 2026-11-13

- Include `skills/` in the package file list; refresh description.
- No runtime change.

## 0.7.0 — 2026-11-13

- Ship the portable `skills/agora/SKILL.md` front-door skill.
- Clarify that a bundle does not auto-install workspace skills.
- No runtime behavior change.

## 0.6.0 — 2026-11-13

- Opt-in `preStepHint` (default false): one advisory hint per new prompt,
  deduplicated, fail-open; no tool execution.
- Coarse prompt-kind inference for the hint.
- 7 fixture tests.

## 0.5.0 — 2026-11-13

- Fix manifestPath:false for true keyword-fallback benchmarks.
- 5-frame benchmark: manifest 6/6 code, 4/4 research, 5/5 writing, 2/2 audit.
- No auto-execution; still advisory.

## 0.4.0 — 2026-11-13

- Manifest health: missing/archived assets, unknown scenarios/roles, duplicate
  assets and multiple canonical members per overlap group.
- 6 fixture tests.
- Still read-only/advisory.

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
