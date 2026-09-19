const fs = require('fs')
const path = require('path')

function nativeWindowsVersion(version) {
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(\d{4})(\d{2})(\d{2})$/.exec(version)
  if (!match) throw new Error('Expected major.minor.YYYYMMDD version')
  const [, major, minor, year, month, day] = match
  const date = new Date(`${year}-${month}-${day}T00:00:00Z`)
  if (Number(major) > 65535 || Number(minor) > 65535 || Number(year) < 2000 ||
      !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== `${year}-${month}-${day}`) {
    throw new Error('Version contains an invalid date or Windows numeric field')
  }
  return `${major}.${minor}.${Number(year)}+${Number(month + day)}`
}

function validateTag(tag, version) {
  nativeWindowsVersion(version)
  if (tag !== `v${version}`) throw new Error(`Tag ${tag} must match v${version}`)
  return version
}

if (require.main === module) {
  const root = path.resolve(__dirname, '..')
  const { version } = require('../package.json')
  nativeWindowsVersion(version)
  const cargo = fs.readFileSync(path.join(root, 'src-tauri/Cargo.toml'), 'utf8')
  if (!cargo.includes(`version = "${version}"`)) throw new Error('Cargo version mismatch')
  if (process.env.RELEASE_TAG) validateTag(process.env.RELEASE_TAG, version)
  console.log(`Release ${version}; Windows native version ${nativeWindowsVersion(version)}`)
}

module.exports = { nativeWindowsVersion, validateTag }
