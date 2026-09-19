const { spawnSync } = require('node:child_process')
const { nativeWindowsVersion } = require('./release-version.cjs')
const { version } = require('../package.json')
const args = ['build', ...process.argv.slice(2)]
args.push('--', '--locked')
if (process.platform === 'win32') {
  args.splice(1, 0, '--config', JSON.stringify({ version: nativeWindowsVersion(version) }))
}
const cli = require.resolve('@tauri-apps/cli/tauri.js')
const result = spawnSync(process.execPath, [cli, ...args], { stdio: 'inherit' })
if (result.error) throw result.error
process.exit(result.status === null ? 1 : result.status)
