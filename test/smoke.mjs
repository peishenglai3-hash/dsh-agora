import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { apply } from '../index.js'
import { census, health, route, validateManifest } from '../lib/core.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const WORKSPACE = [
  resolve(HERE, '..', '..', '..'),
  resolve(HERE, '..'),
].find((p) => existsSync(join(p, 'tools', 'agora', 'agora.mjs'))) || resolve(HERE, '..')

function harness() {
  const defs = []
  const ctx = {
    effect(fn) { fn() },
    tools: { register(def) { defs.push(def); return () => {} } },
  }
  apply(ctx, { workspace: WORKSPACE })
  return { defs }
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'agora-fixture-'))
  const profile = join(root, 'profile')
  mkdirSync(join(profile), { recursive: true })
  writeFileSync(join(profile, 'package.json'), JSON.stringify({ dependencies: { '@local/a': 'link:a' }, dsh: { profile: { bundles: ['@local/a'] } } }))
  mkdirSync(join(root, '.agents', 'skills', 'one'), { recursive: true })
  mkdirSync(join(root, '.agents', 'skills', 'two'), { recursive: true })
  writeFileSync(join(root, '.agents', 'skills', 'one', 'SKILL.md'), '---\nname: tdd\ndescription: code helper\n---\n# one\n')
  writeFileSync(join(root, '.agents', 'skills', 'two', 'SKILL.md'), '---\nname: test-driven-development\ndescription: code helper two\n---\n# two\n')
  mkdirSync(join(root, 'dsh-plugins', 'a', 'skills', 'x'), { recursive: true })
  mkdirSync(join(root, 'dsh-plugins', 'a', 'references', 'old'), { recursive: true })
  writeFileSync(join(root, 'dsh-plugins', 'a', 'skills', 'x', 'SKILL.md'), '---\nname: live\ndescription: research helper\n---\n# live\n')
  writeFileSync(join(root, 'dsh-plugins', 'a', 'references', 'old', 'SKILL.md'), '---\nname: old\ndescription: archived\n---\n# old\n')
  mkdirSync(join(root, 'dsh-plugins', 'orphan'), { recursive: true })
  writeFileSync(join(root, 'dsh-plugins', 'orphan', 'package.json'), '{"name":"orphan"}')
  return { root, workspace: root, profile }
}

test('registers exactly three read-only tools', () => {
  const { defs } = harness()
  assert.deepEqual(defs.map((d) => d.name).sort(), ['agora_census', 'agora_health', 'agora_route'])
  for (const def of defs) assert.equal(def.parameters.additionalProperties, false)
})

test('live vs archived and duplicate detection on a fixture', () => {
  const f = fixture()
  const c = census(f)
  assert.equal(c.counts.liveSkills, 3)
  assert.equal(c.counts.archivedSkills, 1)
  assert.equal(c.duplicates.length, 0)
  assert.ok(c.skills.every((s) => s.name), 'every parsed skill must have a name')
  const h = health(c, f.root)
  assert.ok(h.unlinkedLocalDirs.includes('orphan'))
})

test('route is advisory and overlap needs a user decision', () => {
  const c = census(fixture())
  const r = route({ kind: 'code', risk: 'low' }, c)
  assert.ok(r.receiptId)
  assert.ok(Array.isArray(r.candidates))
  assert.equal(r.needsUser, true)
})

test('manifest health reports missing, archived and canonical conflicts', () => {
  const f = fixture()
  const manifest = {
    path: 'fixture-manifest.json',
    assets: [
      { asset: 'tdd', scenarios: ['code'], canonical: true, overlapGroup: 'tdd' },
      { asset: 'test-driven-development', scenarios: ['code'], canonical: true, overlapGroup: 'tdd' },
      { asset: 'does-not-exist', scenarios: ['code'] },
      { asset: 'old', scenarios: ['research'] },
      { asset: 'tdd', scenarios: ['bogus'], role: 'wrong' },
    ],
  }
  const v = validateManifest(manifest, census(f))
  assert.ok(v.missing.includes('does-not-exist'))
  assert.ok(v.archived.includes('old'))
  assert.equal(v.canonicalConflicts[0].group, 'tdd')
  assert.ok(v.unknownScenarios.length >= 1)
  assert.ok(v.unknownRoles.length >= 1)
  assert.ok(v.duplicateAssets.includes('tdd'))
})

test('explicit manifest narrows candidates and detects overlap', () => {
  const f = fixture()
  mkdirSync(join(f.root, '.agora'), { recursive: true })
  writeFileSync(join(f.root, '.agora', 'manifest.json'), JSON.stringify({
    version: 1,
    assets: [
      { asset: 'tdd', scenarios: ['code'], risk: ['low', 'medium', 'high', 'irreversible'], role: 'enabling', overlapGroup: 'tdd', why: 'test-first' },
      { asset: 'test-driven-development', scenarios: ['code'], risk: ['low', 'medium', 'high', 'irreversible'], role: 'enabling', overlapGroup: 'tdd', why: 'test-first alias' },
    ],
  }))
  const c = census(f)
  const r = route({ kind: 'code', risk: 'medium' }, c, { manifestPath: join(f.root, '.agora', 'manifest.json') })
  assert.equal(r.manifest, join(f.root, '.agora', 'manifest.json'))
  assert.deepEqual(r.candidates.map((x) => x.asset).sort(), ['tdd', 'test-driven-development'])
  assert.equal(r.needsUser, true)
  assert.equal(r.overlap[0].group, 'tdd')
})

test('census/health/route run through the plugin without profile writes', async () => {
  const { defs } = harness()
  const censusOut = JSON.parse(await defs.find((d) => d.name === 'agora_census').execute({}))
  assert.ok(censusOut.counts.bundles >= 0)
  assert.ok(typeof censusOut.profileHash === 'string' && censusOut.profileHash.length === 64)
  const healthOut = JSON.parse(await defs.find((d) => d.name === 'agora_health').execute({}))
  assert.equal(typeof healthOut.ok, 'boolean')
  const routeOut = JSON.parse(await defs.find((d) => d.name === 'agora_route').execute({ kind: 'code', risk: 'medium' }))
  assert.ok(routeOut.receiptId)
})
