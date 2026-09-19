const { spawnSync } = require('node:child_process')
const dev = process.argv.includes('--dev')
const cli = require.resolve('@vue/cli-service/bin/vue-cli-service.js')
const args = dev ? ['serve', '--host', '127.0.0.1', '--port', '1420'] : ['build']
const result = spawnSync(process.execPath, [cli, ...args], {
  stdio: 'inherit',
  env: { ...process.env, VUE_APP_DESKTOP: 'true', VUE_APP_BASE_API: process.env.VUE_APP_BASE_API || '' }
})
if (result.error) throw result.error
process.exit(result.status === null ? 1 : result.status)
