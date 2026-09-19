const ServerKey = 'goosemeeting.server'
export const isDesktop = process.env.VUE_APP_DESKTOP === 'true'

export function normalizeServerUrl(value) {
  const url = new URL(value.trim())
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error('请输入不含账号、参数或片段的 HTTP(S) 服务器地址')
  }
  return url.href.replace(/\/+$/, '')
}

export function getServerUrl() {
  return localStorage.getItem(ServerKey) || process.env.VUE_APP_BASE_API || ''
}

export function setServerUrl(value) {
  const url = normalizeServerUrl(value)
  localStorage.setItem(ServerKey, url)
  return url
}
