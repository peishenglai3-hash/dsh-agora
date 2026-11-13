---
name: agora
description: Use at the start of a non-trivial task when Agora tools are available. Call agora_census once, then agora_route with a task frame; use the advisory receipt to choose or reject assets. It never executes a skill/tool. Do not use for single-line answers or when the user already named the exact asset.
---

# Agora · 资产准入

Agora is a **read-only adviser** for DSH plugins, skills and MCPs. It does not
install, execute or change anything.

## Use

1. If `agora_*` tools exist:
   - `agora_census` for the live profile/asset counts;
   - `agora_route` with `{kind, risk, goal}` for a receipt.
2. Read the receipt:
   - `candidates`: plausible assets, with path and reason;
   - `rejected`: why not selected;
   - `overlap` + `needsUser`: do **not** silently pick when true;
   - `manifest`: whether a workspace manifest was used.
3. Choose the smallest applicable skill/tool; a receipt is advice, not execution.
4. If Agora is unavailable, fall back to `scenario-dispatch` + direct skill use.

## Frames

`kind`: core / code / research / writing / audit / mixed.  
`risk`: low / medium / high / irreversible.

For irreversible work, prefer `audit` + verification assets; never let a route
advise you into an irreversible action without user approval.

## Overlap

If two candidates are in the same `overlapGroup`, show both and ask the user, or
use an explicit canonical declared in the manifest. Do not use both "to be safe".

## Boundaries

- No auto-tool execution.
- No profile writes.
- No cleanup decisions; use Agora health reports, then a human decides.
- `preStepHint` is opt-in and disabled by default; do not claim it is active.
