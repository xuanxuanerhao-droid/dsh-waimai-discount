/**
 * Local structural test for the dsh-waimai-discount plugin entry.
 * Mocks the cordis `ctx.skills` surface and verifies the provider registers,
 * lists the bundled waimai-discount skill, and can fetch its definition.
 *
 * Run: node tests/load.test.mjs
 */
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import path from 'path'
import { readFileSync, existsSync } from 'node:fs'

const require = createRequire(import.meta.url)
// tests/ 的上一级是仓库根
const root = fileURLToPath(new URL('../', import.meta.url))

let assertCount = 0
function ok(cond, label) {
  assertCount++
  if (!cond) {
    console.error(`FAIL: ${label}`)
    process.exit(1)
  }
  console.log(`PASS: ${label}`)
}

// 1) Static artifacts resolve.
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'))
ok(pkg.name === 'dsh-waimai-discount', 'package.json name matches')
ok(typeof pkg.dsh?.bundle?.patch === 'string' && pkg.dsh.bundle.patch.length > 0,
  'package.json declares non-empty dsh.bundle.patch')
ok(pkg.dsh.bundle.patch === './cordis.patch.yml', 'patch points to ./cordis.patch.yml')
ok(Array.isArray(pkg.keywords) && pkg.keywords.includes('dsh-plugin'), 'keywords include dsh-plugin')

// 2) Bundled SKILL.md + data + script exist.
ok(existsSync(path.join(root, 'skills/waimai-discount/SKILL.md')), 'SKILL.md present')
ok(existsSync(path.join(root, 'skills/waimai-discount/data/channels.json')), 'channels.json present')
ok(existsSync(path.join(root, 'skills/waimai-discount/scripts/find.mjs')), 'find.mjs present')

// 3) Load the entry with a mocked ctx.skills provider registry.
const mod = await import('../index.js')
ok(mod.name === 'dsh-waimai-discount', 'entry name export matches')

let registeredProvider = null
const fakeSkills = {
  registerProvider(factory) {
    registeredProvider = factory
  },
}
mod.apply({ skills: fakeSkills })
ok(registeredProvider !== null, 'apply() registered a provider')

const provider = registeredProvider()
const candidates = await provider.list({})
ok(candidates.length === 1, `provider lists exactly 1 skill (got ${candidates.length})`)
ok(candidates[0].name === 'waimai-discount', 'listed skill name is waimai-discount')
ok(candidates[0].provider === 'waimai', 'provider tag is waimai')
ok(candidates[0].source === 'bundled', 'source is bundled')

const def = await provider.get(candidates[0], {})
ok(def !== undefined, 'provider.get returns a definition')
ok(def.content.includes('外卖优惠助手'), 'definition content contains the skill title')
ok(typeof def.content === 'string' && def.content.length > 0, 'definition content is non-empty')

// 4) The query engine runs against the bundled data via the resource base.
const script = path.join(root, 'skills/waimai-discount/scripts/find.mjs')
const { execFileSync } = await import('node:child_process')
const out = execFileSync(process.execPath, [script, '学生外卖', '--limit=2'], { encoding: 'utf8' })
ok(out.includes('学生专属福利'), 'query engine finds student channel through bundled script')
const out2 = execFileSync(process.execPath, [script, '美团优惠'], { encoding: 'utf8' })
ok(out2.includes('美团外卖'), 'query engine matches meituan channels')

console.log(`\nAll ${assertCount} assertions passed.`)
