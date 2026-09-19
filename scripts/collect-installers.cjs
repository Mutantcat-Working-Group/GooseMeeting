const fs = require('node:fs')
const path = require('node:path')
const { version } = require('../package.json')

const [target, platform, extension] = process.argv.slice(2)
if (!target || !/^(windows-x64|macos-x64|macos-arm64|linux-x64)$/.test(platform) || !['exe', 'dmg', 'AppImage'].includes(extension)) {
  throw new Error('Expected target, platform and installer extension')
}
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(dir, entry.name)
    return entry.isDirectory() ? walk(file) : [file]
  })
}
const root = path.join('src-tauri', 'target', target, 'release', 'bundle')
const installers = walk(root).filter(file => file.endsWith(`.${extension}`))
if (installers.length !== 1) throw new Error(`Expected one installer, found ${installers.length}`)
if (fs.statSync(installers[0]).size < 1024 * 1024) throw new Error('Installer is unexpectedly small')
fs.mkdirSync('release-artifacts', { recursive: true })
const destination = `release-artifacts/goosemeeting_${version}_${platform}.${extension}`
fs.copyFileSync(installers[0], destination)
if (extension === 'AppImage') fs.chmodSync(destination, 0o755)
console.log(destination)
