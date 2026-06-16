import fs from 'node:fs'
import path from 'node:path'

const cwd = process.cwd()
const args = new Set(process.argv.slice(2))
const platform = readFlagValue('--platform') ?? 'android'
const checkOnly = args.has('--check')

const sourcePath = path.resolve(
  cwd,
  readFlagValue('--source') ?? 'removehandwriting-mobile/pubspec.yaml',
)
const targetPath = path.resolve(
  cwd,
  readFlagValue('--target') ?? 'removehandwriting-web/src/lib/app-version-config.ts',
)

if (!['android', 'ios'].includes(platform)) {
  fail(`Unsupported platform "${platform}". Use "android" or "ios".`)
}

const pubspec = fs.readFileSync(sourcePath, 'utf8')
const versionMatch = pubspec.match(/^version:\s*([0-9]+\.[0-9]+\.[0-9]+)\+[0-9]+\s*$/m)
if (!versionMatch) {
  fail(`Could not read Flutter version from ${sourcePath}`)
}

const appVersion = versionMatch[1]
const targetSource = fs.readFileSync(targetPath, 'utf8')
const blockPattern = new RegExp(
  String.raw`(${platform}\s*:\s*\{[\s\S]*?\blatestVersion:\s*')([^']+)(')`,
  'm',
)
const currentMatch = targetSource.match(blockPattern)
if (!currentMatch) {
  fail(`Could not find ${platform}.latestVersion in ${targetPath}`)
}

const currentVersion = currentMatch[2]

if (checkOnly) {
  if (currentVersion !== appVersion) {
    fail(
      [
        `${platform} version mismatch detected.`,
        `mobile pubspec: ${appVersion}`,
        `web config: ${currentVersion}`,
        `Run: npm run sync:${platform}-app-version`,
      ].join('\n'),
    )
  }

  console.log(`${platform} app version is in sync: ${appVersion}`)
  process.exit(0)
}

if (currentVersion === appVersion) {
  console.log(`${platform} app version already in sync: ${appVersion}`)
  process.exit(0)
}

const updatedSource = targetSource.replace(blockPattern, `$1${appVersion}$3`)
fs.writeFileSync(targetPath, updatedSource)

console.log(
  [
    `Updated ${platform}.latestVersion in ${path.relative(cwd, targetPath)}`,
    `from ${currentVersion} to ${appVersion}`,
  ].join('\n'),
)

function readFlagValue(flag) {
  const index = process.argv.indexOf(flag)
  if (index === -1) {
    return null
  }

  return process.argv[index + 1] ?? null
}

function fail(message) {
  console.error(message)
  process.exit(1)
}
