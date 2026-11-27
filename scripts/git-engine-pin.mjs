import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const packageName = '@markup-carve/carve'
const gitSource = /^(?:git\+https:\/\/github\.com\/markup-carve\/carve-js\.git|git\+ssh:\/\/git@github\.com\/markup-carve\/carve-js\.git|github:markup-carve\/carve-js)#([a-f0-9]{40})$/i

export function gitPin(spec) {
  return typeof spec === 'string' ? gitSource.exec(spec)?.[1]?.toLowerCase() ?? null : null
}

export function lockedPin(manifest, lockfile) {
  const declared = manifest.dependencies?.[packageName] ?? manifest.devDependencies?.[packageName]
  const pin = gitPin(declared)
  if (!pin) throw new Error(`Expected a Git commit dependency for ${packageName}`)
  const root = lockfile.packages?.['']?.dependencies?.[packageName]
    ?? lockfile.packages?.['']?.devDependencies?.[packageName]
  const resolved = lockfile.packages?.[`node_modules/${packageName}`]?.resolved
  if (gitPin(root) !== pin || gitPin(resolved) !== pin) {
    throw new Error(`${packageName} manifest and lockfile do not pin the same commit`)
  }
  return pin
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const manifest = JSON.parse(readFileSync('package.json', 'utf8'))
  const declared = manifest.dependencies?.[packageName] ?? manifest.devDependencies?.[packageName]
  if (process.argv[2] === 'manifest') {
    console.log(gitPin(declared) ?? '')
  } else if (process.argv[2] === 'lock') {
    try {
      const lockfile = JSON.parse(readFileSync('package-lock.json', 'utf8'))
      console.log(lockedPin(manifest, lockfile))
    } catch (error) {
      console.error(`::error::${error.message}`)
      process.exitCode = 1
    }
  }
}
