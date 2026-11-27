import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { gitPin, lockedPin } from '../scripts/git-engine-pin.mjs'

const sha = 'edd6e00a76729cb086dcb15c38818e1cc34159fb'
const spec = `git+https://github.com/markup-carve/carve-js.git#${sha}`

test('reads a Git dependency and verifies its lockfile commit', () => {
  assert.equal(gitPin(spec), sha)
  assert.equal(gitPin(`github:markup-carve/carve-js#${sha}`), sha)
  assert.equal(gitPin(`git+ssh://git@github.com/markup-carve/carve-js.git#${sha}`), sha)
  assert.equal(gitPin('^0.1.17'), null)
  const manifest = { dependencies: { '@markup-carve/carve': spec } }
  const lock = { packages: {
    '': { dependencies: { '@markup-carve/carve': spec } },
    'node_modules/@markup-carve/carve': { version: '0.1.17', resolved: spec },
  } }
  assert.equal(lockedPin(manifest, lock), sha)
  lock.packages['node_modules/@markup-carve/carve'].resolved = `${spec.slice(0, -1)}0`
  assert.throws(() => lockedPin(manifest, lock), /do not pin the same commit/)
})

test('drift workflow checks Git pins before registry ranges', () => {
  const workflow = readFileSync(new URL('../.github/workflows/engine-drift.yml', import.meta.url), 'utf8')
  assert.match(workflow, /node scripts\/git-engine-pin\.mjs manifest/)
  assert.match(workflow, /node scripts\/git-engine-pin\.mjs lock/)
  assert.match(workflow, /merge-base --is-ancestor/)
})
