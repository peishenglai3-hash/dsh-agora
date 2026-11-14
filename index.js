/**
 * @peisheng_lai/dsh-agora v1.1 — Host-only, read-only asset census/health/route.
 * No DSH imports; no profile writes; no tool execution.
 */
import { randomUUID } from 'node:crypto'
import { census as coreCensus, health as coreHealth, route as coreRoute } from './lib/core.mjs'

export const name = 'agora'
export const inject = ['tools']

// No `export const Config`: Cordis expects a schemastery schema with validate(),
// not a raw JSON Schema. Configuration is read defensively in configOf().

function configOf(config) {
  return { workspace: config?.workspace || process.cwd(), profile: config?.profile || process.env.DSH_PROFILE_DIR, manifest: config?.manifest, preStepHint: config?.preStepHint === true }
}
function text(v) { return [{ type: 'text', text: typeof v === 'string' ? v : JSON.stringify(v, null, 2) }] }
function contextMessage(textValue) {
  return { id: randomUUID(), role: 'user', content: [{ type: 'text', text: textValue }], source: { kind: 'agora-pre-step' } }
}
function lastUserText(messages) {
  const list = Array.isArray(messages) ? messages : []
  for (let i = list.length - 1; i >= 0; i--) {
    const m = list[i]
    if (m?.role !== 'user') continue
    const parts = Array.isArray(m.content) ? m.content : []
    const textPart = parts.find((p) => p?.type === 'text' && typeof p.text === 'string')
    if (textPart) return textPart.text
  }
  return ''
}
function inferKind(prompt) {
  const p = String(prompt || '').toLowerCase()
  if (/(audit|backup|irreversible|发布|投稿|恢复|回滚)/.test(p)) return 'audit'
  if (/(code|bug|test|plugin|refactor|build|代码|插件|修复|重构)/.test(p)) return 'code'
  if (/(paper|research|literature|citation|论文|文献|研究)/.test(p)) return 'research'
  if (/(write|essay|novel|draft|写作|论文|小说|润色)/.test(p)) return 'writing'
  return 'core'
}
function hintFor(prompt, cfg) {
  const c = coreCensus(cfg)
  const kind = inferKind(prompt)
  const r = coreRoute({ kind, risk: 'low', goal: prompt.slice(0, 300) }, c, { manifestPath: cfg.manifest })
  const top = r.candidates.slice(0, 3).map((x) => x.asset)
  if (!top.length) return ''
  const overlap = r.overlap.length ? ` overlap=${r.overlap.map((x) => x.group).join(',')}` : ''
  return `[Agora hint] frame=${kind} candidates=${top.join(',')}${overlap}${r.needsUser ? ' needsUser=true' : ''}. Advisory only; do not treat as executed.`
}

const censusTool = {
  name: 'agora_census',
  description: 'Read-only census of the current DSH profile, skills and archived references. Does not modify profile or execute tools.',
  parameters: { type: 'object', additionalProperties: false, properties: {} },
  output: { schema: { type: 'string' }, render: (_a, v) => text(v) },
  async execute(_args, ctx) {
    const c = coreCensus(configOf(ctx?.config))
    return JSON.stringify({ asOf: c.asOf, profileHash: c.profileHash, counts: c.counts, duplicates: c.duplicates }, null, 2)
  },
}

const healthTool = {
  name: 'agora_health',
  description: 'Read-only health check: duplicate live skills, archived references and unlinked local plugin dirs. Advisory only.',
  parameters: { type: 'object', additionalProperties: false, properties: {} },
  output: { schema: { type: 'string' }, render: (_a, v) => text(v) },
  async execute(_args, ctx) {
    const cfg = configOf(ctx?.config)
    const c = coreCensus(cfg)
    const h = coreHealth(c, cfg.workspace, { manifestPath: cfg.manifest })
    return JSON.stringify({ asOf: h.asOf, ok: h.ok, issues: h.issues, unlinkedLocalDirs: h.unlinkedLocalDirs, manifest: h.manifest }, null, 2)
  },
}

const routeTool = {
  name: 'agora_route',
  description: 'Advisory route for a task frame. Returns candidates, rejected assets and overlap conflicts; it never executes a skill or tool.',
  parameters: {
    type: 'object',
    additionalProperties: false,
    required: ['kind'],
    properties: {
      kind: { type: 'string', enum: ['core', 'code', 'research', 'writing', 'audit', 'mixed'] },
      risk: { type: 'string', enum: ['low', 'medium', 'high', 'irreversible'], default: 'low' },
      goal: { type: 'string', description: 'Short task goal, not full private text' },
    },
  },
  output: { schema: { type: 'string' }, render: (_a, v) => text(v) },
  async execute(args, ctx) {
    const cfg = configOf(ctx?.config)
    const c = coreCensus(cfg)
    const r = coreRoute({ kind: args.kind, risk: args.risk || 'low', goal: args.goal || '' }, c, { manifestPath: cfg.manifest })
    return JSON.stringify({ receiptId: r.receiptId, frame: r.frame, manifest: r.manifest, candidates: r.candidates, rejected: r.rejected, overlap: r.overlap, needsUser: r.needsUser }, null, 2)
  },
}

export function apply(ctx, config) {
  const cfg = configOf(config)
  ctx.effect(() => {
    const disposers = [censusTool, healthTool, routeTool].map((def) =>
      ctx.tools.register({ ...def, execute: (args) => def.execute(args, { config }) }))
    return () => { for (const d of disposers.reverse()) { try { d?.() } catch {} } }
  }, 'agora:tools')

  if (cfg.preStepHint) {
    const seen = new WeakMap()
    ctx.effect(() => {
      const off = ctx.on('agent/pre-step', ({ agent, messages }, next) => {
        try {
          const prompt = lastUserText(messages)
          if (prompt && seen.get(agent) !== prompt) {
            seen.set(agent, prompt)
            const hint = hintFor(prompt, cfg)
            if (hint) agent.inject(contextMessage(hint))
          }
        } catch { /* advisory hint must never block a turn */ }
        return next()
      })
      return () => { try { off?.() } catch {} }
    }, 'agora:pre-step-hint')
  }
}
