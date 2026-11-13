/**
 * @local/agora v0.1 — Host-only, read-only asset census/health/route.
 * No DSH imports; no profile writes; no tool execution.
 */
import { census as coreCensus, health as coreHealth, route as coreRoute } from './lib/core.mjs'

export const name = 'agora'
export const inject = ['tools']

// No `export const Config`: Cordis expects a schemastery schema with validate(),
// not a raw JSON Schema. Configuration is read defensively in configOf().

function configOf(config) {
  return { workspace: config?.workspace || process.cwd(), profile: config?.profile || process.env.DSH_PROFILE_DIR }
}
function text(v) { return [{ type: 'text', text: typeof v === 'string' ? v : JSON.stringify(v, null, 2) }] }

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
    const h = coreHealth(c, cfg.workspace)
    return JSON.stringify({ asOf: h.asOf, ok: h.ok, issues: h.issues, unlinkedLocalDirs: h.unlinkedLocalDirs }, null, 2)
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
    const r = coreRoute({ kind: args.kind, risk: args.risk || 'low', goal: args.goal || '' }, c)
    return JSON.stringify({ receiptId: r.receiptId, frame: r.frame, candidates: r.candidates, rejected: r.rejected, overlap: r.overlap, needsUser: r.needsUser }, null, 2)
  },
}

export function apply(ctx, config) {
  ctx.effect(() => {
    const disposers = [censusTool, healthTool, routeTool].map((def) =>
      ctx.tools.register({ ...def, execute: (args) => def.execute(args, { config }) }))
    return () => { for (const d of disposers.reverse()) { try { d?.() } catch {} } }
  }, 'agora:tools')
}
