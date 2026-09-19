const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const { version } = require('../package.json')
const root = 'release-artifacts'
const expected = ['windows-x64.exe', 'macos-x64.dmg', 'macos-arm64.dmg', 'linux-x64.AppImage']
  .map(suffix => `goosemeeting_${version}_${suffix}`).sort()
const actual = fs.readdirSync(root).filter(file => file !== 'SHA256SUMS.txt').sort()
if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`Incomplete release: ${actual}`)
const checksums = expected.map(file => {
  const data = fs.readFileSync(path.join(root, file))
  if (data.length < 1024 * 1024) throw new Error(`Invalid installer: ${file}`)
  return `${crypto.createHash('sha256').update(data).digest('hex')}  ${file}`
})
fs.writeFileSync(path.join(root, 'SHA256SUMS.txt'), checksums.join('\n') + '\n')
console.log(checksums.join('\n'))
