/**
 * Agora core — pure read-only census/health/route functions.
 * No DSH imports, no profile writes, no tool execution.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { createHash, randomUUID } from 'node:crypto'
import { join, resolve } from 'node:path'

const EXCLUDE_DIRS = new Set(['node_modules', '.git', '_raw', '_vendor'])
const OVERLAP_GROUPS = {
  'code-review': ['code-review', 'requesting-code-review', 'receiving-code-review'],
  tdd: ['tdd', 'test-driven-development'],
  debugging: ['diagnosing-bugs', 'systematic-debugging'],
  'writing-discipline': ['writing-for-agents', 'writing-skills'],
  'video-pipeline': ['video-pipeline', 'video-pipeline-html', 'media-pipeline', 'tangshi-pipeline'],
  grilling: ['brainstorming', 'grilling', 'grill-me', 'grill-with-docs', 'spec-driven-development'],
  humanizer: ['humanizer-zh', 'humanizer-zh-next', 'academic-humanizer'],
}
function groupFor(name) {
  for (const [group, members] of Object.entries(OVERLAP_GROUPS)) if (members.includes(name)) return group
  return name
}

export function defaultProfile() {
  return process.env.DSH_PROFILE_DIR || join(process.env.USERPROFILE || '', '.dsh', 'profiles', 'desktop')
}

function readJson(path, fallback = null) {
  try { return JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, '')) } catch { return fallback }
}
function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDE_DIRS.has(entry.name)) continue
    const p = join(dir, entry.name)
    if (entry.isDirectory()) walk(p, acc)
    else acc.push(p)
  }
  return acc
}
function frontmatter(path) {
  const text = readFileSync(path, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n')
  const meta = {}
  if (text.startsWith('---')) {
    const end = text.indexOf('\n---', 3)
    if (end !== -1) {
      for (const line of text.slice(3, end).split(/\r?\n/)) {
        const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
        if (m) meta[m[1].toLowerCase()] = m[2].replace(/^["']|["']$/g, '')
      }
    }
  }
  let title = meta.name || ''
  if (!title) { const m = text.match(/^#\s+(.+)$/m); title = m ? m[1].trim() : '' }
  return { name: meta.name || '', title, description: meta.description || '' }
}
export function collectSkills(workspace) {
  const out = []
  const roots = [
    { root: join(workspace, '.agents', 'skills'), source: 'workspace' },
    { root: join(workspace, 'dsh-plugins'), source: 'local-plugin' },
  ]
  for (const { root, source } of roots) {
    for (const p of walk(root).filter((f) => f.toLowerCase().endsWith('skill.md'))) {
      const rel = p.slice(workspace.length + 1).replaceAll('\\', '/')
      const archived = /(^|\/)(references|archive|_raw|_vendor)\//i.test(rel)
      const meta = frontmatter(p)
      out.push({ name: meta.name, title: meta.title, description: meta.description, path: rel, source, archived })
    }
  }
  return out
}
export function census({ workspace, profile } = {}) {
  const ws = resolve(workspace || process.cwd())
  const pf = resolve(profile || defaultProfile())
  const pkgPath = join(pf, 'package.json')
  const pkgRaw = existsSync(pkgPath) ? readFileSync(pkgPath, 'utf8').replace(/^\uFEFF/, '') : ''
  const pkg = pkgRaw ? JSON.parse(pkgRaw) : {}
  const bundles = Array.isArray(pkg?.dsh?.profile?.bundles) ? pkg.dsh.profile.bundles : []
  const deps = pkg?.dependencies ? Object.keys(pkg.dependencies) : []
  const skills = collectSkills(ws)
  const live = skills.filter((s) => !s.archived)
  const archived = skills.filter((s) => s.archived)
  const byName = new Map()
  for (const s of live) { if (!byName.has(s.name)) byName.set(s.name, []); byName.get(s.name).push(s) }
  const duplicates = [...byName.entries()].filter(([, v]) => v.length > 1).map(([name, v]) => ({ name, copies: v.length, paths: v.map((x) => x.path) }))
  return {
    schema: 'agora.census/1',
    asOf: new Date().toISOString(),
    profile: pf,
    workspace: ws,
    profileHash: pkgRaw ? createHash('sha256').update(pkgRaw).digest('hex') : null,
    counts: { bundles: bundles.length, dependencies: deps.length, skills: skills.length, liveSkills: live.length, archivedSkills: archived.length, duplicateLiveNames: duplicates.length },
    bundles,
    dependencies: deps,
    skills,
    duplicates,
    archived,
    note: 'Read-only metadata. No profile or skill was modified.',
  }
}
export function health(c, workspace) {
  const ws = resolve(workspace || c.workspace || process.cwd())
  const issues = []
  for (const d of c.duplicates) issues.push({ id: 'duplicate-live-skill', severity: 'P2', name: d.name, paths: d.paths })
  if (c.archived.length) issues.push({ id: 'archived-reference-skills', severity: 'P2', count: c.archived.length, note: 'archived SKILL.md must not be counted as live assets' })
  const localRoot = join(ws, 'dsh-plugins')
  const localDirs = existsSync(localRoot) ? readdirSync(localRoot, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name) : []
  const linked = new Set(c.bundles.filter((b) => b.startsWith('@local/')).map((b) => b.slice(7)))
  const unlinked = localDirs.filter((d) => !linked.has(d) && existsSync(join(localRoot, d, 'package.json')))
  return { schema: 'agora.health/1', asOf: c.asOf, counts: c.counts, issues, unlinkedLocalDirs: unlinked, ok: issues.filter((i) => i.severity === 'P1' || i.severity === 'P0').length === 0 }
}
export function route(frame = {}, c, { limit = 8 } = {}) {
  const kind = frame.kind || 'core'
  const risk = frame.risk || 'low'
  const live = c.skills.filter((s) => !s.archived)
  const groups = new Map()
  for (const s of live) { const g = groupFor(s.name); if (!groups.has(g)) groups.set(g, []); groups.get(g).push(s) }
  const candidates = []
  for (const s of live) {
    const hay = (s.name + ' ' + s.description).toLowerCase()
    let score = 0
    if (hay.includes(kind)) score += 3
    if (kind === 'code' && /(code|test|debug|review|refactor)/.test(hay)) score += 2
    if (kind === 'research' && /(research|paper|literature|knowledge)/.test(hay)) score += 2
    if (kind === 'writing' && /(writing|humaniz|editor|page|ppt|card)/.test(hay)) score += 2
    if (kind === 'audit' && /(audit|verify|review|backup|security)/.test(hay)) score += 2
    if (risk === 'irreversible' && /(verify|audit|backup|security)/.test(hay)) score += 3
    if (score > 0) candidates.push({ asset: s.name, path: s.path, role: 'stream', why: `frame=${kind}, risk=${risk}, score=${score}`, score })
  }
  candidates.sort((a, b) => b.score - a.score || a.asset.localeCompare(b.asset))
  const top = candidates.slice(0, limit)
  const candidateNames = new Set(top.map((x) => x.asset))
  const conflicts = [...groups.entries()]
    .map(([name, v]) => ({ name, members: [...new Set(v.filter((s) => candidateNames.has(s.name)).map((s) => s.name))], paths: v.map((x) => x.path) }))
    .filter((x) => x.members.length > 1)
    .map((x) => ({ group: x.name, members: x.members, paths: x.paths }))
  return {
    schema: 'agora.route/1',
    receiptId: 'route-' + randomUUID().slice(0, 8),
    at: new Date().toISOString(),
    frame: { kind, risk, ...frame },
    candidates: top,
    rejected: live.filter((s) => !candidates.some((x) => x.path === s.path)).slice(0, 20).map((s) => ({ asset: s.name, path: s.path, why: 'no frame match' })),
    overlap: conflicts,
    needsUser: conflicts.length > 0,
    note: 'Advisory only. Agora does not execute a skill/tool.',
  }
}
