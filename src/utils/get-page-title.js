import defaultSettings from '@/settings'

const title = defaultSettings.title || '大鹅会议'

export default function getPageTitle(pageTitle) {
  if (pageTitle) {
    return `${pageTitle} - ${title}`
  }
  return `${title}`
}
