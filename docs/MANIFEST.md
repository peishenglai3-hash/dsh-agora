# Manifest

Agora can use an explicit manifest instead of keyword scoring. Put it at
`<workspace>/.agora/manifest.json`, or set the bundle row's `manifest` config to
an absolute/relative path.

```json
{
  "version": 1,
  "assets": [
    {
      "asset": "code-review",
      "scenarios": ["code"],
      "risk": ["low", "medium"],
      "role": "enabling",
      "tags": ["review", "spec"],
      "canonical": true,
      "overlapGroup": "code-review",
      "why": "review against standards and spec"
    }
  ]
}
```

- `asset` must match a live skill name.
- `scenarios` is the allowed frame kind list; empty means all.
- `risk` bounds when the asset is eligible.
- `goalAny` (optional) requires at least one goal keyword; this is how a generic
  `writing` frame excludes `chinese-novelist` unless the goal names fiction.
- `overlapGroup` is used for `needsUser`; only top candidates are compared.
- Missing manifest = keyword fallback (v0.1 behavior).
- `agora_health` reports manifest assets that are missing, archived, duplicated,
  use unknown scenarios/roles, or have multiple canonical members in one overlap
  group.
- Manifest is advisory metadata; it never installs/executes anything.
